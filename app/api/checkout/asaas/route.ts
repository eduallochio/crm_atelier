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
} from '@/lib/asaas'
import { format, addDays } from 'date-fns'

// POST /api/checkout/asaas
// Cria (ou reutiliza) cliente no Asaas e gera assinatura
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()

    const body = await req.json()
    const {
      billing_type,      // 'CREDIT_CARD' | 'PIX'
      cycle = 'MONTHLY', // 'MONTHLY' | 'YEARLY'
      plan = 'pro',
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
      const applicable = found.applicablePlans as string[] | null
      if (applicable && applicable.length > 0 && !applicable.includes(plan)) {
        return NextResponse.json({ error: 'Cupom não aplicável a este plano' }, { status: 400 })
      }

      couponRow = found
      discount = {
        value:  parseFloat(found.discountValue),
        type:   found.discountType === 'percentage' ? 'PERCENTAGE' : 'FIXED',
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

    // Criar assinatura
    const nextDueDate = format(addDays(new Date(), 1), 'yyyy-MM-dd')

    const forwardedFor = req.headers.get('x-forwarded-for')
    const remoteIp = forwardedFor?.split(',')[0]?.trim() ?? '127.0.0.1'

    const subscription = await createSubscription({
      customer:          asaasCustomerId,
      billingType:       billing_type,
      value:             basePrice,
      nextDueDate,
      cycle,
      description:       `Meu Atelier Sistema — Plano ${plan.charAt(0).toUpperCase() + plan.slice(1)} (${cycle === 'MONTHLY' ? 'Mensal' : 'Anual'})`,
      discount,
      externalReference: org.id,
      ...(billing_type === 'CREDIT_CARD' && {
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
      }),
    })

    // Salvar subscription_id na organização
    await db
      .update(organizations)
      .set({ asaasSubscriptionId: subscription.id })
      .where(eq(organizations.id, org.id))

    // Registrar uso do cupom
    if (couponRow) {
      await db.insert(couponUsages).values({
        couponId:       couponRow.id,
        organizationId: org.id,
      })
      await db
        .update(coupons)
        .set({ usesCount: sql`coalesce(${coupons.usesCount}, 0) + 1` })
        .where(eq(coupons.id, couponRow.id))
    }

    return NextResponse.json({
      subscription_id: subscription.id,
      status:          subscription.status,
      next_due_date:   subscription.nextDueDate,
      billing_type,
      value:           basePrice,
      discount,
    })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[POST /api/checkout/asaas]', error)
    console.error('[POST /api/checkout/asaas]', error)
    // Expõe a mensagem do Asaas para facilitar diagnóstico
    const msg = (error as Error).message ?? ''
    const friendly = msg.includes('Asaas')
      ? `Erro no gateway de pagamento: ${msg.split('→')[1]?.trim() ?? msg}`
      : 'Erro interno ao processar checkout'
    return NextResponse.json({ error: friendly }, { status: 500 })
  }
}
