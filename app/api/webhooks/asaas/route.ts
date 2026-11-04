import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { db } from '@/lib/db'
import { organizations, orgFinancialSettings, orgPayables } from '@/lib/db/schema'
import { eq, and, like } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'
import { format, addDays } from 'date-fns'
import { getSubscription, updateSubscription, getSubscriptionPayments, deletePayment, getPayment } from '@/lib/asaas'

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
        // Idempotência — um evento reenviado/duplicado pelo Asaas não deve
        // lançar o mesmo pagamento duas vezes no financeiro. Escapa % e _
        // (caracteres curinga do LIKE) antes de interpolar o payment.id —
        // sem isso, um id contendo esses caracteres poderia casar com outras
        // linhas por acidente
        // Escapa primeiro o backslash (escape char padrão do LIKE no Postgres),
        // depois % e _ — ordem importa, senão os backslashes inseridos para
        // escapar % e _ seriam re-escapados incorretamente
        const escapedPaymentId = String(payment.id).replace(/\\/g, '\\\\').replace(/[%_]/g, '\\$&')
        const [already] = await db
          .select({ id: orgPayables.id })
          .from(orgPayables)
          .where(and(eq(orgPayables.organizationId, orgId), like(orgPayables.observacoes, `%ID: ${escapedPaymentId}%`)))
          .limit(1)
        if (already) {
          console.log(`[webhook/asaas] ${event} → payment ${payment.id} já processado, ignorando`)
          return NextResponse.json({ ok: true, duplicate: true })
        }
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

            // Bônus da 1ª assinatura mensal: 2 meses pelo preço de 1 (60 dias a
            // partir da aprovação, não do checkout). Só aplica uma vez por
            // organização — firstPaymentConfirmedAt ainda null é o que marca
            // "este é o primeiro pagamento confirmado desta assinatura"
            const [orgRow] = await db
              .select({ firstPaymentConfirmedAt: organizations.firstPaymentConfirmedAt })
              .from(organizations)
              .where(eq(organizations.id, orgId))
              .limit(1)

            const isFirstConfirmedPayment = !orgRow?.firstPaymentConfirmedAt
            // Usa a data corroborada pela API do Asaas, não o corpo da
            // requisição — esse valor alimenta o cálculo da data de bônus
            // (+60 dias) persistida em firstPaymentConfirmedAt, então
            // confiar no body permitiria manipular a janela de renovação
            const confirmedAt = confirmedPayment.confirmedDate ?? confirmedPayment.paymentDate ?? format(new Date(), 'yyyy-MM-dd')

            if (isFirstConfirmedPayment && sub.cycle === 'MONTHLY') {
              const bonusDueDateStr = format(addDays(new Date(`${confirmedAt}T12:00:00`), 60), 'yyyy-MM-dd')
              try {
                // O Asaas já gera a cobrança seguinte (ex.: vencimento daqui 1 mês)
                // antes do webhook rodar — como o próximo vencimento real vira
                // +60 dias, essa cobrança intermediária fica obsoleta e precisa
                // ser cancelada pra não cobrar o cliente de novo antes da hora
                const pendentes = await getSubscriptionPayments(subscriptionId)
                const intermediarias = pendentes.filter(p => p.status === 'PENDING' && p.id !== payment.id)
                for (const p of intermediarias) {
                  try {
                    await deletePayment(p.id)
                  } catch (delErr) {
                    logServerError('[webhook/asaas] cancelar cobrança intermediária', delErr)
                  }
                }

                const updated = await updateSubscription(subscriptionId, { nextDueDate: bonusDueDateStr })
                await db
                  .update(organizations)
                  .set({ subscriptionNextDueDate: updated.nextDueDate, firstPaymentConfirmedAt: new Date(`${confirmedAt}T12:00:00`) })
                  .where(eq(organizations.id, orgId))
                console.log(`[webhook/asaas] bônus 1ª assinatura aplicado → org ${orgId} → próximo vencimento ${updated.nextDueDate}`)
              } catch (bonusErr) {
                logServerError('[webhook/asaas] aplicar bônus 60 dias', bonusErr)
                await db
                  .update(organizations)
                  .set({ subscriptionNextDueDate: sub.nextDueDate, firstPaymentConfirmedAt: new Date(`${confirmedAt}T12:00:00`) })
                  .where(eq(organizations.id, orgId))
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
        .select({ id: organizations.id, name: organizations.name })
        .from(organizations)
        .where(eq(organizations.asaasSubscriptionId, payment.subscription))
        .limit(1)

      if (org) {
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
