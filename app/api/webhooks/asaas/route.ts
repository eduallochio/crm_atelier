import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { organizations } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'

const WEBHOOK_TOKEN = process.env.ASAAS_WEBHOOK_TOKEN ?? ''

function validateToken(req: NextRequest): boolean {
  // O Asaas envia o token no header 'asaas-access-token'
  const token = req.headers.get('asaas-access-token') ?? ''
  return WEBHOOK_TOKEN.length > 0 && token === WEBHOOK_TOKEN
}

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
    if (PAYMENT_CONFIRMED.has(event) && payment?.externalReference) {
      const orgId = payment.externalReference
      await db
        .update(organizations)
        .set({ plan: 'pro', subscriptionStatus: 'active' })
        .where(eq(organizations.id, orgId))

      console.log(`[webhook/asaas] ${event} → org ${orgId} → plano pro ativado`)
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

    // Outros eventos — apenas 200 para o Asaas não retentar
    return NextResponse.json({ ok: true, ignored: true })
  } catch (error) {
    logServerError('[POST /api/webhooks/asaas]', error)
    console.error('[POST /api/webhooks/asaas]', error)
    // Retornar 200 para o Asaas não retentar em erro de processamento interno
    return NextResponse.json({ ok: false, error: 'Erro interno' }, { status: 200 })
  }
}
