import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { db } from '@/lib/db'
import { organizations, orgFinancialSettings, orgPayables, coupons, couponUsages, asaasProcessedWebhooks } from '@/lib/db/schema'
import { eq, and, desc, isNull } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'
import { format, addMonths, addYears } from 'date-fns'
import { getSubscription, updateSubscription, getSubscriptionPayments, deletePayment, getPayment } from '@/lib/asaas'
import {
  sendPagamentoConfirmado,
  sendPagamentoAtrasado,
  sendAssinaturaCancelada,
} from '@/lib/email'

const WEBHOOK_TOKEN = process.env.ASAAS_WEBHOOK_TOKEN ?? ''

function validateToken(req: NextRequest): boolean {
  // O Asaas envia o token no header 'asaas-access-token'
  const token = req.headers.get('asaas-access-token') ?? ''
  if (WEBHOOK_TOKEN.length === 0) return false
  // Comparação em tempo constante — evita timing attack contra o token
  const tokenBuf = Buffer.from(token)
  const expectedBuf = Buffer.from(WEBHOOK_TOKEN)
  if (tokenBuf.length !== expectedBuf.length) return false
  return timingSafeEqual(tokenBuf, expectedBuf)
}

// Eventos de nova cobrança gerada (renovação)
const PAYMENT_CREATED = new Set([
  'PAYMENT_CREATED',
])

// Eventos que devem regredir o plano para overdue (estorno, chargeback)
const PAYMENT_REFUNDED = new Set([
  'PAYMENT_REFUNDED',
  'PAYMENT_CHARGEBACK_REQUESTED',
  'PAYMENT_CHARGEBACK_DISPUTE',
  'PAYMENT_AWAITING_CHARGEBACK_REVERSAL',
])

// Eventos que ativam/mantêm o plano Pro
const PAYMENT_CONFIRMED = new Set([
  'PAYMENT_RECEIVED',
  'PAYMENT_CONFIRMED',
  'PAYMENT_RECEIVED_IN_CASH_UNDONE',
])

// Eventos que suspendem o plano
const PAYMENT_OVERDUE = new Set([
  'PAYMENT_OVERDUE',
  'PAYMENT_DELETED',
])

// Eventos de cancelamento de assinatura
const SUBSCRIPTION_CANCELLED = new Set([
  'SUBSCRIPTION_INACTIVATED',
  'SUBSCRIPTION_DELETED',
])

export async function POST(req: NextRequest) {
  try {
    if (!validateToken(req)) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const body = await req.json()
    const { event, payment, subscription } = body

    if (!event) {
      return NextResponse.json({ error: 'evento ausente' }, { status: 400 })
    }

    // Pagamento confirmado → ativar plano Pro
    // Tenta primeiro por externalReference (pagamento avulso), depois por subscription ID
    if (PAYMENT_CONFIRMED.has(event) && payment) {
      // Corrobora o pagamento diretamente na API do Asaas antes de confiar em
      // qualquer campo do corpo da requisição — o body de um webhook pode ser
      // forjado por qualquer um que tenha o token estático; sem essa checagem,
      // um externalReference arbitrário mudaria o plano de qualquer organização
      let confirmedPayment
      try {
        confirmedPayment = payment.id ? await getPayment(payment.id) : null
      } catch (corroborationErr) {
        // Falha ao chamar a API do Asaas (rede, instabilidade) é transitória,
        // diferente de "pagamento não confirmado" — 200 aqui faria o Asaas
        // desistir de reenviar e o evento se perderia de vez. 503 sinaliza
        // falha temporária para o Asaas tentar novamente depois.
        logServerError('[webhook/asaas] falha ao corroborar pagamento com a API do Asaas', corroborationErr)
        return NextResponse.json({ ok: false, error: 'Não foi possível confirmar o pagamento' }, { status: 503 })
      }
      if (!confirmedPayment || !['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(confirmedPayment.status)) {
        logServerError('[webhook/asaas] pagamento não confirmado na API do Asaas', new Error(`payment.id=${payment.id} status=${confirmedPayment?.status}`))
        return NextResponse.json({ ok: false, error: 'Pagamento não confirmado' }, { status: 200 })
      }

      // Trava atômica de idempotência — INSERT com constraint única em
      // (payment_id, event) funciona como um "primeiro a chegar, vence":
      // duas requisições concorrentes do mesmo evento (reenvio do Asaas ou
      // dois PAYMENT_CONFIRMED quase simultâneos) nunca passam as duas, porque
      // o banco rejeita a segunda inserção por violação de unicidade antes de
      // qualquer uma delas tocar em organizations/couponUsages/orgPayables.
      // Isso substitui a antiga checagem via "LIKE em orgPayables.observacoes",
      // que só protegia depois que o primeiro lançamento financeiro já tivesse
      // sido criado — e esse lançamento só acontece se autoLaunchSubscription
      // estiver ligado, então a checagem antiga podia nunca existir.
      try {
        await db.insert(asaasProcessedWebhooks).values({ paymentId: String(payment.id), event })
      } catch (claimErr) {
        const isUniqueViolation = (claimErr as { code?: string })?.code === '23505'
        if (isUniqueViolation) {
          console.log(`[webhook/asaas] ${event} → payment ${payment.id} já processado (claim duplicado), ignorando`)
          return NextResponse.json({ ok: true, duplicate: true })
        }
        throw claimErr
      }

      // Usa exclusivamente o externalReference corroborado pela API do Asaas —
      // nunca o do corpo da requisição, que é a fonte não confiável que essa
      // corroboração inteira existe para neutralizar
      let orgId: string | null = confirmedPayment.externalReference ?? null

      if (!orgId && confirmedPayment.subscription) {
        const [found] = await db
          .select({ id: organizations.id })
          .from(organizations)
          .where(eq(organizations.asaasSubscriptionId, confirmedPayment.subscription))
          .limit(1)
        orgId = found?.id ?? null
      }

      if (orgId) {
        await db
          .update(organizations)
          .set({ plan: 'pro', subscriptionStatus: 'active' })
          .where(eq(organizations.id, orgId))
        console.log(`[webhook/asaas] ${event} → org ${orgId} → plano pro ativado`)

        // Sincroniza a data da próxima cobrança — usada no contador de dias até a
        // renovação no dashboard/sidebar. O dueDate do pagamento confirmado já
        // passou, então busca o nextDueDate atualizado direto da assinatura
        const subscriptionId = confirmedPayment.subscription
        if (subscriptionId) {
          try {
            const sub = await getSubscription(subscriptionId)

            // Bônus de assinatura (automático da 1ª mensal e/ou cupom com
            // bonusCycles) — calculado a partir da data de aprovação do
            // pagamento, não do checkout. Só aplica uma vez por organização —
            // firstPaymentConfirmedAt ainda null é o que marca "este é o
            // primeiro pagamento confirmado desta assinatura"
            const [orgRow] = await db
              .select({ firstPaymentConfirmedAt: organizations.firstPaymentConfirmedAt })
              .from(organizations)
              .where(eq(organizations.id, orgId))
              .limit(1)

            const isFirstConfirmedPayment = !orgRow?.firstPaymentConfirmedAt
            // Usa a data corroborada pela API do Asaas, não o corpo da
            // requisição — esse valor alimenta o cálculo da data de bônus
            // persistida em firstPaymentConfirmedAt, então confiar no body
            // permitiria manipular a janela de renovação
            const confirmedAt = confirmedPayment.confirmedDate ?? confirmedPayment.paymentDate ?? format(new Date(), 'yyyy-MM-dd')

            // Único ponto de decisão do bônus de assinatura — unifica o bônus
            // automático ("2 meses pelo preço de 1" na 1ª assinatura mensal) e
            // o bônus de cupom com bonusCycles (ex: PROMO50), que antes era
            // aplicado no checkout logo após criar a assinatura, antes de
            // qualquer confirmação de pagamento — mesma race condition que já
            // causou uma cobrança fantasma aqui. Quando os dois bônus se
            // aplicam, vale o maior, nunca a soma.
            //
            // As duas regras de elegibilidade são independentes: o bônus
            // automático só vale na 1ª assinatura da vida da organização
            // (isFirstConfirmedPayment), enquanto o bônus de cupom vale uma
            // única vez por uso de cupom (appliedAt ainda null) — sem essa
            // segunda condição, o mesmo registro de couponUsages seria
            // encontrado em TODA renovação da assinatura (a linha nunca é
            // "consumida"), reaplicando o bônus indefinidamente e o cliente
            // nunca mais pagaria depois da 1ª renovação.
            const autoBonusCycles = isFirstConfirmedPayment && sub.cycle === 'MONTHLY' ? 1 : 0
            const [couponUsage] = await db
              .select({ id: couponUsages.id, bonusCycles: coupons.bonusCycles })
              .from(couponUsages)
              .innerJoin(coupons, eq(coupons.id, couponUsages.couponId))
              .where(and(
                eq(couponUsages.organizationId, orgId),
                eq(couponUsages.asaasSubscriptionId, subscriptionId),
                isNull(couponUsages.appliedAt),
              ))
              .orderBy(desc(couponUsages.usedAt))
              .limit(1)
            const couponBonusCycles = couponUsage?.bonusCycles ?? 0
            const effectiveBonusCycles = Math.max(autoBonusCycles, couponBonusCycles)

            if (effectiveBonusCycles > 0) {
              const addCycle = sub.cycle === 'YEARLY' ? addYears : addMonths
              const bonusDueDateStr = format(addCycle(new Date(`${confirmedAt}T12:00:00`), effectiveBonusCycles), 'yyyy-MM-dd')
              try {
                // O Asaas já gera a cobrança seguinte (ex.: vencimento daqui 1 mês)
                // antes do webhook rodar — como o próximo vencimento real vira
                // +effectiveBonusCycles ciclos, essa cobrança intermediária fica
                // obsoleta e precisa ser cancelada pra não cobrar o cliente de
                // novo antes da hora.
                // Se o delete falhar aqui, o handler de PAYMENT_CREATED abaixo é
                // a segunda tentativa (compara dueDate com subscriptionNextDueDate
                // já persistido) — por isso o log precisa de IDs suficientes para
                // rastrear o caso sem precisar vasculhar o banco manualmente.
                const pendentes = await getSubscriptionPayments(subscriptionId)
                const intermediarias = pendentes.filter(p => p.status === 'PENDING' && p.id !== payment.id)
                for (const p of intermediarias) {
                  try {
                    await deletePayment(p.id)
                  } catch (delErr) {
                    logServerError(
                      '[webhook/asaas] cancelar cobrança intermediária',
                      delErr,
                      { subscriptionId, paymentId: p.id, paymentDueDate: p.dueDate, confirmedPaymentId: payment.id },
                      orgId,
                    )
                  }
                }

                const updated = await updateSubscription(subscriptionId, { nextDueDate: bonusDueDateStr })
                await db
                  .update(organizations)
                  .set({
                    subscriptionNextDueDate: updated.nextDueDate,
                    // Só grava firstPaymentConfirmedAt na 1ª confirmação da vida
                    // da organização — numa reassinatura com bônus de cupom,
                    // isFirstConfirmedPayment já é false e esse campo não deve
                    // ser sobrescrito com a data de agora
                    ...(isFirstConfirmedPayment ? { firstPaymentConfirmedAt: new Date(`${confirmedAt}T12:00:00`) } : {}),
                  })
                  .where(eq(organizations.id, orgId))
                // Marca o uso do cupom como consumido — essa é a única
                // confirmação de pagamento desta cobrança, então não há uma
                // "próxima tentativa" natural; sem marcar aqui, a mesma linha
                // seria encontrada de novo em toda renovação futura
                if (couponUsage) {
                  await db
                    .update(couponUsages)
                    .set({ appliedAt: new Date() })
                    .where(eq(couponUsages.id, couponUsage.id))
                }
                console.log(`[webhook/asaas] bônus de assinatura aplicado (${effectiveBonusCycles} ciclo(s)) → org ${orgId} → próximo vencimento ${updated.nextDueDate}`)
              } catch (bonusErr) {
                logServerError('[webhook/asaas] aplicar bônus de assinatura', bonusErr, { subscriptionId, effectiveBonusCycles }, orgId)
                await db
                  .update(organizations)
                  .set({
                    subscriptionNextDueDate: sub.nextDueDate,
                    ...(isFirstConfirmedPayment ? { firstPaymentConfirmedAt: new Date(`${confirmedAt}T12:00:00`) } : {}),
                  })
                  .where(eq(organizations.id, orgId))
                // Mesmo tendo falhado, marca como consumido — não há uma
                // próxima confirmação de pagamento desta mesma cobrança que
                // daria outra chance; o erro já ficou registrado acima com
                // os IDs necessários para correção manual
                if (couponUsage) {
                  await db
                    .update(couponUsages)
                    .set({ appliedAt: new Date() })
                    .where(eq(couponUsages.id, couponUsage.id))
                }
              }
            } else {
              await db
                .update(organizations)
                .set({
                  subscriptionNextDueDate: sub.nextDueDate,
                  ...(isFirstConfirmedPayment ? { firstPaymentConfirmedAt: new Date(`${confirmedAt}T12:00:00`) } : {}),
                })
                .where(eq(organizations.id, orgId))
            }
          } catch (syncErr) {
            logServerError('[webhook/asaas] sincronizar nextDueDate', syncErr)
          }
        }

        // Email de pagamento confirmado
        try {
          const [orgData] = await db
            .select({ email: organizations.email, name: organizations.name })
            .from(organizations)
            .where(eq(organizations.id, orgId))
            .limit(1)
          if (orgData?.email) {
            const ciclo = confirmedPayment.subscription ? 'mensal' : 'avulso'
            const forma = confirmedPayment.billingType === 'PIX' ? 'PIX'
              : confirmedPayment.billingType === 'CREDIT_CARD' ? 'Cartão de Crédito' : 'Boleto'
            const dataConfirmacao = confirmedPayment.paymentDate
              ? format(new Date(`${confirmedPayment.paymentDate}T12:00:00`), 'dd/MM/yyyy')
              : format(new Date(), 'dd/MM/yyyy')
            const [orgUpdated] = await db
              .select({ subscriptionNextDueDate: organizations.subscriptionNextDueDate })
              .from(organizations)
              .where(eq(organizations.id, orgId))
              .limit(1)
            const proximaRenovacao = orgUpdated?.subscriptionNextDueDate
              ? format(new Date(`${orgUpdated.subscriptionNextDueDate}T12:00:00`), 'dd/MM/yyyy')
              : '—'
            const valor = `R$ ${Number(confirmedPayment.value ?? 0).toFixed(2).replace('.', ',')}`
            await sendPagamentoConfirmado({
              to: orgData.email,
              ciclo,
              forma,
              data: dataConfirmacao,
              proximaRenovacao,
              valor,
            }).catch(err => logServerError('[webhook/asaas] email pagamento confirmado', err))
          }
        } catch (emailErr) {
          logServerError('[webhook/asaas] email pagamento confirmado', emailErr)
        }

        // Notificação Telegram — pagamento confirmado
        try {
          const [orgTel] = await db
            .select({ name: organizations.name, email: organizations.email })
            .from(organizations)
            .where(eq(organizations.id, orgId))
            .limit(1)
          if (orgTel) {
            const valorTel = `R$ ${Number(confirmedPayment.value ?? 0).toFixed(2).replace('.', ',')}`
            const { notificarTelegram } = await import('@/lib/telegram')
            await notificarTelegram(
              `💰 <b>Pagamento confirmado</b>\n🏪 ${orgTel.name}\n📧 ${orgTel.email}\n💵 ${valorTel}\n📋 Plano Pro`
            )
          }
        } catch { /* best-effort */ }

        // Lançar em contas a pagar se a opção estiver ativa
        try {
          const [settings] = await db
            .select({ autoLaunchSubscription: orgFinancialSettings.autoLaunchSubscription })
            .from(orgFinancialSettings)
            .where(eq(orgFinancialSettings.organizationId, orgId))
            .limit(1)

          if (settings?.autoLaunchSubscription) {
            const valor = String(confirmedPayment.value ?? '0')
            const hoje  = format(new Date(), 'yyyy-MM-dd')
            const venc  = confirmedPayment.dueDate ?? hoje
            await db.insert(orgPayables).values({
              organizationId: orgId,
              descricao:      'Assinatura Meu Atelier Sistema - Plano Pro',
              valor,
              dataVencimento: venc,
              dataPagamento:  hoje,
              status:         'pago',
              categoria:      'Assinatura',
              formaPagamento: confirmedPayment.billingType === 'PIX' ? 'PIX' : confirmedPayment.billingType === 'CREDIT_CARD' ? 'Cartão de Crédito' : 'Outro',
              observacoes:    `Pagamento automático via Asaas · ID: ${payment.id}`,
            })
            console.log(`[webhook/asaas] lançamento financeiro criado para org ${orgId}`)
          }
        } catch (finErr) {
          // Não bloqueia a ativação do plano se o lançamento falhar
          logServerError('[webhook/asaas] lançamento financeiro', finErr)
        }
      } else {
        console.warn(`[webhook/asaas] ${event} → org não encontrada (subscription=${payment.subscription}, ref=${payment.externalReference})`)
      }
      return NextResponse.json({ ok: true })
    }

    // Pagamento atrasado → manter pro mas marcar como inadimplente (não rebaixar imediatamente)
    if (PAYMENT_OVERDUE.has(event) && payment?.subscription) {
      // Corrobora contra a API do Asaas antes de confiar no subscription.id do
      // body — mesmo vetor de spoofing do branch PAYMENT_CONFIRMED: qualquer um
      // com o token estático do webhook poderia, sem isso, marcar qualquer
      // assinatura paga como inadimplente
      let confirmedSub
      try {
        confirmedSub = await getSubscription(payment.subscription)
      } catch (corroborationErr) {
        logServerError('[webhook/asaas] falha ao corroborar assinatura (overdue) com a API do Asaas', corroborationErr)
        return NextResponse.json({ ok: false, error: 'Não foi possível confirmar a assinatura' }, { status: 503 })
      }

      const [org] = await db
        .select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.asaasSubscriptionId, confirmedSub.id))
        .limit(1)

      if (org) {
        await db
          .update(organizations)
          .set({ subscriptionStatus: 'overdue' })
          .where(eq(organizations.id, org.id))

        console.log(`[webhook/asaas] ${event} → org ${org.id} → status overdue`)

        // Email de pagamento atrasado
        try {
          const [orgData] = await db
            .select({ email: organizations.email, subscriptionNextDueDate: organizations.subscriptionNextDueDate })
            .from(organizations)
            .where(eq(organizations.id, org.id))
            .limit(1)
          if (orgData?.email) {
            const vencimento = confirmedSub.nextDueDate
              ? format(new Date(`${confirmedSub.nextDueDate}T12:00:00`), 'dd/MM/yyyy')
              : '—'
            await sendPagamentoAtrasado({
              to: orgData.email,
              ciclo: 'mensal',
              valor: `R$ ${Number(confirmedSub.value ?? 0).toFixed(2).replace('.', ',')}`,
              vencimento,
              prazo: '5 dias',
              urlPagamento: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://meuateliersistema.com.br'}/configuracoes?tab=assinatura`,
            }).catch(err => logServerError('[webhook/asaas] email pagamento atrasado', err))
          }
        } catch (emailErr) {
          logServerError('[webhook/asaas] email pagamento atrasado', emailErr)
        }
      }
      return NextResponse.json({ ok: true })
    }

    // Assinatura cancelada → rebaixar para free
    if (SUBSCRIPTION_CANCELLED.has(event) && subscription?.id) {
      // Idem: corrobora o ID da assinatura antes de rebaixar qualquer
      // organização — essa é a mutação mais destrutiva do webhook (derruba
      // o plano pago), então o gate de corroboração é obrigatório aqui
      let confirmedSub
      try {
        confirmedSub = await getSubscription(subscription.id)
      } catch (corroborationErr) {
        logServerError('[webhook/asaas] falha ao corroborar assinatura (cancelamento) com a API do Asaas', corroborationErr)
        return NextResponse.json({ ok: false, error: 'Não foi possível confirmar a assinatura' }, { status: 503 })
      }

      const [org] = await db
        .select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.asaasSubscriptionId, confirmedSub.id))
        .limit(1)

      if (org) {
        await db
          .update(organizations)
          .set({ plan: 'free', subscriptionStatus: 'inactive', asaasSubscriptionId: null })
          .where(eq(organizations.id, org.id))

        console.log(`[webhook/asaas] ${event} → org ${org.id} → rebaixado para free`)

        // Email de assinatura cancelada
        try {
          const [orgData] = await db
            .select({ email: organizations.email })
            .from(organizations)
            .where(eq(organizations.id, org.id))
            .limit(1)
          if (orgData?.email) {
            const fimAcesso = confirmedSub.nextDueDate
              ? format(new Date(`${confirmedSub.nextDueDate}T12:00:00`), 'dd/MM/yyyy')
              : format(new Date(), 'dd/MM/yyyy')
            await sendAssinaturaCancelada({
              to: orgData.email,
              ciclo: confirmedSub.cycle === 'YEARLY' ? 'anual' : 'mensal',
              fimAcesso,
            }).catch(err => logServerError('[webhook/asaas] email assinatura cancelada', err))
          }
        } catch (emailErr) {
          logServerError('[webhook/asaas] email assinatura cancelada', emailErr)
        }
      }
      return NextResponse.json({ ok: true })
    }

    // Estorno ou chargeback → marca como overdue para revisão manual
    if (PAYMENT_REFUNDED.has(event) && payment) {
      // Corrobora o pagamento contra a API do Asaas — mesmo princípio dos
      // outros branches: o corpo do webhook não é confiável por si só
      let confirmedPayment
      try {
        confirmedPayment = payment.id ? await getPayment(payment.id) : null
      } catch (corroborationErr) {
        logServerError('[webhook/asaas] falha ao corroborar pagamento (estorno/chargeback) com a API do Asaas', corroborationErr)
        return NextResponse.json({ ok: false, error: 'Não foi possível confirmar o pagamento' }, { status: 503 })
      }
      if (!confirmedPayment) {
        logServerError('[webhook/asaas] pagamento não encontrado na API do Asaas (estorno/chargeback)', new Error(`payment.id=${payment.id}`))
        return NextResponse.json({ ok: false, error: 'Pagamento não encontrado' }, { status: 200 })
      }

      let orgId: string | null = confirmedPayment.externalReference ?? null

      if (!orgId && confirmedPayment.subscription) {
        const [found] = await db
          .select({ id: organizations.id })
          .from(organizations)
          .where(eq(organizations.asaasSubscriptionId, confirmedPayment.subscription))
          .limit(1)
        orgId = found?.id ?? null
      }

      if (orgId) {
        await db
          .update(organizations)
          .set({ subscriptionStatus: 'overdue' })
          .where(eq(organizations.id, orgId))
        console.log(`[webhook/asaas] ${event} → org ${orgId} → status overdue (estorno/chargeback)`)

        // Chargeback/estorno é um evento financeiro sensível — registra para
        // aparecer em /fix-payment-errors, não só no console (efêmero)
        logServerError(
          '[webhook/asaas] chargeback/estorno',
          new Error(`${event} para organização ${orgId} (payment ${confirmedPayment.id}, valor R$ ${confirmedPayment.value ?? '?'})`)
        )
      }
      return NextResponse.json({ ok: true })
    }

    // Nova cobrança gerada (renovação da assinatura)
    if (PAYMENT_CREATED.has(event) && payment?.subscription) {
      const [org] = await db
        .select({
          id: organizations.id,
          name: organizations.name,
          firstPaymentConfirmedAt: organizations.firstPaymentConfirmedAt,
          subscriptionNextDueDate: organizations.subscriptionNextDueDate,
        })
        .from(organizations)
        .where(eq(organizations.asaasSubscriptionId, payment.subscription))
        .limit(1)

      if (org) {
        // Rede de segurança do bônus de assinatura (automático ou de cupom):
        // se a cobrança intermediária (~1 ciclo) que o Asaas gera ao criar a
        // assinatura escapou do cancelamento feito no handler de
        // PAYMENT_CONFIRMED (ver bloco acima — deletePayment pode falhar), ela
        // chega aqui como um PAYMENT_CREATED comum. Detecta pelo vencimento:
        // se já houve bônus concedido (firstPaymentConfirmedAt preenchido) e
        // essa cobrança nova vence ANTES do vencimento real já persistido
        // (subscriptionNextDueDate, esticado pelo bônus), é a cobrança
        // fantasma — cancela em vez de sincronizar a data, senão o cliente
        // seria cobrado de novo antes da hora.
        const isPhantomIntermediateCharge =
          !!org.firstPaymentConfirmedAt &&
          !!org.subscriptionNextDueDate &&
          !!payment.dueDate &&
          payment.dueDate < org.subscriptionNextDueDate

        if (isPhantomIntermediateCharge) {
          try {
            await deletePayment(payment.id)
            console.log(`[webhook/asaas] PAYMENT_CREATED → org ${org.id} (${org.name}) → cobrança intermediária fantasma cancelada (dueDate ${payment.dueDate} < esperado ${org.subscriptionNextDueDate})`)
            return NextResponse.json({ ok: true })
          } catch (delErr) {
            logServerError(
              '[webhook/asaas] cancelar cobrança fantasma (2ª tentativa)',
              delErr,
              { subscriptionId: payment.subscription, paymentId: payment.id, paymentDueDate: payment.dueDate, expectedDueDate: org.subscriptionNextDueDate },
              org.id,
            )
            // 503 (em vez de 200) faz o Asaas reenviar este webhook depois —
            // sem isso, uma falha transitória aqui deixaria a cobrança
            // fantasma permanentemente ativa, sem nenhuma 3ª chance de
            // correção automática
            return NextResponse.json({ ok: false, error: 'Não foi possível cancelar cobrança intermediária' }, { status: 503 })
          }
        }

        if (payment.dueDate) {
          await db
            .update(organizations)
            .set({ subscriptionNextDueDate: payment.dueDate })
            .where(eq(organizations.id, org.id))
        }
        console.log(`[webhook/asaas] PAYMENT_CREATED → org ${org.id} (${org.name}) · vencimento ${payment.dueDate} · valor R$ ${payment.value}`)
        // TODO: enviar email de aviso de renovação para o usuário
      }
      return NextResponse.json({ ok: true })
    }

    // Outros eventos — apenas 200 para o Asaas não retentar
    return NextResponse.json({ ok: true, ignored: true })
  } catch (error) {
    logServerError('[POST /api/webhooks/asaas]', error)
    console.error('[POST /api/webhooks/asaas]', error)
    // Retornar 200 para o Asaas não retentar em erro de processamento interno
    return NextResponse.json({ ok: false, error: 'Erro interno' }, { status: 200 })
  }
}
