import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { organizations, orgFinancialSettings, orgPayables } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'
import { format } from 'date-fns'

const WEBHOOK_TOKEN = process.env.ASAAS_WEBHOOK_TOKEN ?? ''

function validateToken(req: NextRequest): boolean {
  // O Asaas envia o token no header 'asaas-access-token'
  const token = req.headers.get('asaas-access-token') ?? ''
  return WEBHOOK_TOKEN.length > 0 && token === WEBHOOK_TOKEN
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
      let orgId: string | null = payment.externalReference ?? null

      if (!orgId && payment.subscription) {
        const [found] = await db
          .select({ id: organizations.id })
          .from(organizations)
          .where(eq(organizations.asaasSubscriptionId, payment.subscription))
          .limit(1)
        orgId = found?.id ?? null
      }

      if (orgId) {
        await db
          .update(organizations)
          .set({ plan: 'pro', subscriptionStatus: 'active' })
          .where(eq(organizations.id, orgId))
        console.log(`[webhook/asaas] ${event} → org ${orgId} → plano pro ativado`)

        // Lançar em contas a pagar se a opção estiver ativa
        try {
          const [settings] = await db
            .select({ autoLaunchSubscription: orgFinancialSettings.autoLaunchSubscription })
            .from(orgFinancialSettings)
            .where(eq(orgFinancialSettings.organizationId, orgId))
            .limit(1)

          if (settings?.autoLaunchSubscription) {
            const valor = String(payment.value ?? '0')
            const hoje  = format(new Date(), 'yyyy-MM-dd')
            const venc  = payment.dueDate ?? hoje
            await db.insert(orgPayables).values({
              organizationId: orgId,
              descricao:      'Assinatura Meu Atelier Sistema - Plano Pro',
              valor,
              dataVencimento: venc,
              dataPagamento:  hoje,
              status:         'pago',
              categoria:      'Assinatura',
              formaPagamento: payment.billingType === 'PIX' ? 'PIX' : payment.billingType === 'CREDIT_CARD' ? 'Cartão de Crédito' : 'Outro',
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
      const [org] = await db
        .select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.asaasSubscriptionId, payment.subscription))
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
      const [org] = await db
        .select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.asaasSubscriptionId, subscription.id))
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
      let orgId: string | null = payment.externalReference ?? null

      if (!orgId && payment.subscription) {
        const [found] = await db
          .select({ id: organizations.id })
          .from(organizations)
          .where(eq(organizations.asaasSubscriptionId, payment.subscription))
          .limit(1)
        orgId = found?.id ?? null
      }

      if (orgId) {
        await db
          .update(organizations)
          .set({ subscriptionStatus: 'overdue' })
          .where(eq(organizations.id, orgId))
        console.log(`[webhook/asaas] ${event} → org ${orgId} → status overdue (estorno/chargeback)`)
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
