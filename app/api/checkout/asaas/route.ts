import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { organizations, coupons, couponUsages, plans } from '@/lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'
import {
  createCustomer,
  findCustomerByCpfCnpj,
  createSubscription,
  createPayment,
  getSubscription,
  getCustomerPayments,
  getPixQrCode,
} from '@/lib/asaas'
import { format } from 'date-fns'

// POST /api/checkout/asaas
// Cria (ou reutiliza) cliente no Asaas e gera assinatura
export async function POST(req: NextRequest) {
  let organizationId: string | undefined
  let billing_type: string = ''
  let cycle: string = 'MONTHLY'
  let plan: string = 'pro'
  try {
    const user = await requireAuth()
    organizationId = user.organizationId

    const body = await req.json()
    const {
      coupon_code,
      installment_count,  // número de parcelas (apenas cartão anual)
      installment_value,  // valor por parcela
      // Dados de cartão (apenas quando billing_type === 'CREDIT_CARD')
      card_holder_name,
      card_number,
      card_expiry_month,
      card_expiry_year,
      card_ccv,
      card_holder_cpf,
      card_holder_phone,
      card_holder_postal_code,
      card_holder_address_number,
    } = body
    billing_type = body.billing_type      // 'CREDIT_CARD' | 'PIX'
    cycle = body.cycle ?? 'MONTHLY'       // 'MONTHLY' | 'YEARLY'
    plan = body.plan ?? 'pro'

    const ALLOWED_BILLING_TYPES = ['PIX', 'CREDIT_CARD']
    if (!billing_type || !ALLOWED_BILLING_TYPES.includes(billing_type)) {
      return NextResponse.json({ error: 'Método de pagamento inválido' }, { status: 400 })
    }

    if (billing_type === 'CREDIT_CARD') {
      if (!card_holder_name || !card_number || !card_expiry_month || !card_expiry_year || !card_ccv) {
        return NextResponse.json({ error: 'Dados do cartão incompletos' }, { status: 400 })
      }
      if (!card_holder_cpf) {
        return NextResponse.json({ error: 'CPF do titular é obrigatório para pagamento com cartão' }, { status: 400 })
      }
    }

    // Buscar dados da organização
    const [org] = await db
      .select({
        id:                  organizations.id,
        name:                organizations.name,
        email:               organizations.email,
        phone:               organizations.phone,
        cnpj:                organizations.cnpj,
        plan:                organizations.plan,
        asaasCustomerId:     organizations.asaasCustomerId,
        asaasSubscriptionId: organizations.asaasSubscriptionId,
        asaasBillingType:    organizations.asaasBillingType,
        subscriptionStatus:  organizations.subscriptionStatus,
      })
      .from(organizations)
      .where(eq(organizations.id, user.organizationId))
      .limit(1)

    if (!org) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
    }

    if (org.plan === plan) {
      return NextResponse.json({ error: 'Organização já possui este plano' }, { status: 400 })
    }

    // Evita gerar uma 2ª cobrança/assinatura PIX enquanto a 1ª ainda não
    // confirmou (ex: usuário clicou duas vezes) — PIX não tem subscription
    // no Asaas para checar status, então usa o status já persistido aqui
    if (org.asaasBillingType === 'PIX' && org.subscriptionStatus === 'active') {
      return NextResponse.json({
        error: 'Você já possui uma assinatura ativa. Entre em contato com o suporte para alterá-la.',
      }, { status: 409 })
    }

    // Evita criar uma segunda assinatura no Asaas quando já existe uma ativa
    // (ex: usuário tentou pagar de novo antes da 1ª cobrança confirmar) — o
    // Asaas rejeita a criação com erro genérico "invalid_billingType" nesse caso
    if (org.asaasSubscriptionId) {
      try {
        const existingSub = await getSubscription(org.asaasSubscriptionId)
        if (existingSub.status === 'ACTIVE') {
          const { notificarTelegram } = await import('@/lib/telegram')
          await notificarTelegram(
            `⚠️ <b>Checkout bloqueado — assinatura duplicada</b>\n🏪 ${org.name}\n🆔 ${org.id}\n📋 Assinatura existente: ${org.asaasSubscriptionId}`
          ).catch(() => {})
          return NextResponse.json({
            error: 'Você já possui uma assinatura ativa. Cancele-a antes de criar uma nova, ou entre em contato com o suporte.',
          }, { status: 409 })
        }
      } catch {
        // Assinatura não encontrada no Asaas (ex: removida manualmente) — segue o checkout normalmente
      }
    }

    // Preço base do plano — lido da tabela plans para consistência com a UI
    const [planRow] = await db
      .select({ price: plans.price, priceAnnual: plans.priceAnnual })
      .from(plans)
      .where(eq(plans.slug, plan))
      .limit(1)

    if (!planRow) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
    }

    const monthlyPrice   = parseFloat(planRow.price)
    const annualPrice1x  = parseFloat(planRow.priceAnnual ?? '0') || monthlyPrice * 10
    const annualPriceFull = Math.round(monthlyPrice * 12 * 100) / 100

    // Anual 1x (PIX ou cartão 1x): preço com desconto. Anual parcelado: preço cheio
    const effectiveInstallments = billing_type === 'CREDIT_CARD' && cycle === 'YEARLY'
      ? (installment_count ?? 1)
      : 1
    const basePrice = cycle === 'YEARLY'
      ? (effectiveInstallments > 1 ? annualPriceFull : annualPrice1x)
      : monthlyPrice

    if (!basePrice) {
      return NextResponse.json({ error: 'Preço do plano não configurado' }, { status: 400 })
    }

    // Aplicar cupom se informado
    let discount: { value: number; type: 'FIXED' | 'PERCENTAGE' } | undefined
    let couponRow: typeof coupons.$inferSelect | null = null

    // CPF/CNPJ do pagador — cartão informa o do titular; PIX usa o CNPJ da organização
    const payerCpfCnpj = (
      billing_type === 'CREDIT_CARD' ? card_holder_cpf : org.cnpj
    )?.replace(/\D/g, '') || null

    if (coupon_code) {
      const [found] = await db
        .select()
        .from(coupons)
        .where(eq(coupons.code, coupon_code.toUpperCase()))
        .limit(1)

      if (!found || !found.isActive) {
        return NextResponse.json({ error: 'Cupom inválido ou inativo' }, { status: 400 })
      }
      if (found.expiresAt && new Date(found.expiresAt) < new Date()) {
        return NextResponse.json({ error: 'Cupom expirado' }, { status: 400 })
      }
      if (found.maxUses != null && (found.usesCount ?? 0) >= found.maxUses) {
        return NextResponse.json({ error: 'Cupom esgotado' }, { status: 400 })
      }
      // Comparação case-insensitive — ver mesmo ajuste em /api/coupons/validate
      const applicable = found.applicablePlans as string[] | null
      if (applicable && applicable.length > 0 && !applicable.some(p => p.toLowerCase() === plan.toLowerCase())) {
        return NextResponse.json({ error: 'Cupom não aplicável a este plano' }, { status: 400 })
      }

      // Bloqueia reuso do mesmo cupom pelo mesmo CPF/CNPJ, mesmo em outra organização
      if (payerCpfCnpj) {
        const [alreadyUsed] = await db
          .select({ id: couponUsages.id })
          .from(couponUsages)
          .where(and(
            eq(couponUsages.couponId, found.id),
            eq(couponUsages.cpfCnpj, payerCpfCnpj),
          ))
          .limit(1)

        if (alreadyUsed) {
          return NextResponse.json({ error: 'Este cupom já foi utilizado com este CPF/CNPJ' }, { status: 400 })
        }
      }

      couponRow = found
      const discountValue = parseFloat(found.discountValue)
      // Cupom de ciclos de bônus (ex: PROMO50) tem discount_value = 0 — nesse caso
      // não há desconto de preço, só o adiamento da próxima cobrança (ver abaixo)
      if (discountValue > 0) {
        discount = {
          value: discountValue,
          type:  found.discountType === 'percentage' ? 'PERCENTAGE' : 'FIXED',
        }
      }
    }

    // Criar ou reutilizar cliente no Asaas
    let asaasCustomerId = org.asaasCustomerId

    if (!asaasCustomerId) {
      const cpfCnpj = org.cnpj?.replace(/\D/g, '') ?? ''
      let existing = cpfCnpj ? await findCustomerByCpfCnpj(cpfCnpj) : null

      if (!existing) {
        const customerData: Parameters<typeof createCustomer>[0] = {
          name:  org.name,
          email: org.email ?? user.email ?? '',
        }
        if (cpfCnpj) customerData.cpfCnpj = cpfCnpj
        const phone = org.phone?.replace(/\D/g, '')
        if (phone) customerData.mobilePhone = phone

        existing = await createCustomer(customerData)
      }

      asaasCustomerId = existing.id

      // Salvar customer_id na organização
      await db
        .update(organizations)
        .set({ asaasCustomerId })
        .where(eq(organizations.id, org.id))
    }

    // nextDueDate de hoje — o Asaas só processa a 1ª cobrança imediatamente
    // quando a data é hoje; qualquer data futura adia a cobrança real para
    // aquele dia (confirmado na documentação do Asaas), mesmo pagando na hora
    const nextDueDate = format(new Date(), 'yyyy-MM-dd')
    const description = `Meu Atelier Sistema — Plano ${plan.charAt(0).toUpperCase() + plan.slice(1)} (${cycle === 'MONTHLY' ? 'Mensal' : 'Anual'})`

    let pixQrCode: { encodedImage: string; payload: string; expirationDate: string } | null = null
    let subscriptionId: string | null = null
    let responseStatus = ''
    let responseNextDueDate = nextDueDate

    if (billing_type === 'PIX') {
      // Bloqueia clique duplo no checkout antes da 1ª cobrança confirmar —
      // a checagem de org.subscriptionStatus === 'active' acima só pega o
      // caso de já ter uma assinatura PIX ativa; aqui ainda não há nenhuma,
      // então sem isso o usuário poderia gerar duas cobranças avulsas
      // simultâneas clicando duas vezes
      const pendingPayments = await getCustomerPayments(asaasCustomerId)
      if (pendingPayments.some(p => p.status === 'PENDING' && p.billingType === 'PIX')) {
        return NextResponse.json({
          error: 'Já existe uma cobrança PIX pendente. Verifique seu email ou a tela de assinatura.',
        }, { status: 409 })
      }

      // O Asaas rejeita billingType PIX em /subscriptions (erro
      // invalid_billingType — "A forma de pagamento não é permitida para
      // assinaturas"), confirmado em produção: PIX só é aceito em cobrança
      // avulsa (/payments). Cada ciclo vira uma cobrança avulsa nova — a 1ª
      // aqui, as seguintes geradas pelo cron em
      // app/api/cron/generate-pix-renewal.
      const payment = await createPayment({
        customer:          asaasCustomerId,
        billingType:       'PIX',
        value:             basePrice,
        dueDate:           nextDueDate,
        description,
        discount,
        externalReference: org.id,
      })

      responseStatus = payment.status
      responseNextDueDate = payment.dueDate

      await db
        .update(organizations)
        .set({
          asaasBillingType: 'PIX',
          asaasCycle: cycle,
          subscriptionNextDueDate: payment.dueDate,
        })
        .where(eq(organizations.id, org.id))

      if (couponRow) {
        // Sem asaasSubscriptionId — não há assinatura no caminho PIX. O
        // bônus de cupom em PIX é aplicado pelo webhook ao confirmar esta
        // cobrança avulsa (ver app/api/webhooks/asaas), que localiza o uso
        // pendente por organizationId quando asaasSubscriptionId é null.
        await db.insert(couponUsages).values({
          couponId:       couponRow.id,
          organizationId: org.id,
          cpfCnpj:        payerCpfCnpj,
        })
        await db
          .update(coupons)
          .set({ usesCount: sql`coalesce(${coupons.usesCount}, 0) + 1` })
          .where(eq(coupons.id, couponRow.id))
      }

      try {
        pixQrCode = await getPixQrCode(payment.id)
      } catch {
        // QR code opcional — não bloqueia o checkout
      }

      const emailTo = org.email ?? user.email
      if (emailTo && pixQrCode) {
        const validade = pixQrCode.expirationDate
          ? format(new Date(pixQrCode.expirationDate), "dd/MM/yyyy 'às' HH:mm")
          : '24 horas'
        import('@/lib/email').then(({ sendPixAguardando }) =>
          sendPixAguardando({
            to: emailTo,
            valor: `R$ ${basePrice.toFixed(2).replace('.', ',')}`,
            validade,
            urlPagamento: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://meuateliersistema.com.br'}/configuracoes?tab=assinatura`,
            pixCopiaCola: pixQrCode!.payload,
            qrCodeBase64: pixQrCode!.encodedImage,
          })
        ).catch(() => {})
      }
    } else {
      const forwardedFor = req.headers.get('x-forwarded-for')
      const remoteIp = forwardedFor?.split(',')[0]?.trim() ?? '127.0.0.1'

      const subscription = await createSubscription({
        customer:          asaasCustomerId,
        billingType:       'CREDIT_CARD',
        value:             basePrice,
        nextDueDate,
        cycle,
        description,
        discount,
        externalReference: org.id,
        callback: {
          successUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://meuateliersistema.com.br'}/configuracoes?tab=assinatura&payment=confirmed`,
          autoRedirect: true,
        },
        creditCard: {
          holderName:  card_holder_name,
          number:      card_number.replace(/\s/g, ''),
          expiryMonth: card_expiry_month,
          expiryYear:  card_expiry_year,
          ccv:         card_ccv,
        },
        creditCardHolderInfo: {
          name:        card_holder_name,
          email:       org.email ?? user.email ?? '',
          cpfCnpj:     card_holder_cpf.replace(/\D/g, ''),
          mobilePhone:   card_holder_phone?.replace(/\D/g, '') || org.phone?.replace(/\D/g, ''),
          postalCode:    card_holder_postal_code?.replace(/\D/g, ''),
          addressNumber: card_holder_address_number,
        },
        remoteIp,
        ...(installment_count && installment_count > 1 && {
          installmentCount: installment_count,
          installmentValue: installment_value,
        }),
      })

      subscriptionId = subscription.id
      responseStatus = subscription.status
      responseNextDueDate = subscription.nextDueDate

      // Salvar subscription_id e data do próximo vencimento na organização —
      // usada pelo contador de dias até a renovação no dashboard/sidebar
      await db
        .update(organizations)
        .set({
          asaasSubscriptionId: subscription.id,
          asaasBillingType: 'CREDIT_CARD',
          asaasCycle: cycle,
          subscriptionNextDueDate: subscription.nextDueDate,
        })
        .where(eq(organizations.id, org.id))

      // Cupom com ciclos de bônus (ex: PROMO50 = 1 ciclo extra → "2 meses
      // pelo preço de 1"): NÃO mexe na assinatura aqui — fazer isso antes
      // da 1ª cobrança confirmar é a mesma race condition que já causou uma
      // cobrança fantasma no bônus automático de 60 dias (webhook pode
      // processar PAYMENT_CONFIRMED enquanto este updateSubscription ainda
      // está em voo). O esticamento da assinatura passa a acontecer só no
      // webhook (PAYMENT_CONFIRMED), que já consulta couponUsages para
      // saber se há bônus de cupom a aplicar — ver
      // app/api/webhooks/asaas/route.ts. Aqui só registramos o uso do cupom.
      if (couponRow) {
        await db.insert(couponUsages).values({
          couponId:            couponRow.id,
          organizationId:      org.id,
          cpfCnpj:             payerCpfCnpj,
          asaasSubscriptionId: subscription.id,
        })
        await db
          .update(coupons)
          .set({ usesCount: sql`coalesce(${coupons.usesCount}, 0) + 1` })
          .where(eq(coupons.id, couponRow.id))
      }
    }

    return NextResponse.json({
      subscription_id: subscriptionId,
      status:          responseStatus,
      next_due_date:   responseNextDueDate,
      billing_type,
      value:           basePrice,
      discount,
      pix_qr_code:     pixQrCode,
    })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[POST /api/checkout/asaas]', error, { billing_type, cycle, plan }, organizationId)
    console.error('[POST /api/checkout/asaas]', error)
    // Expõe a mensagem do Asaas para facilitar diagnóstico
    const msg = (error as Error).message ?? ''
    const friendly = msg.includes('Asaas')
      ? `Erro no gateway de pagamento: ${msg.split('→')[1]?.trim() ?? msg}`
      : 'Erro interno ao processar checkout'
    return NextResponse.json({ error: friendly }, { status: 500 })
  }
}
