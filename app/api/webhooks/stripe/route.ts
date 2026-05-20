import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { db } from '@/lib/db'
import { organizations } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
})

// Mapeia price_id do Stripe → slug do plano no banco
function planFromPriceId(priceId: string): string {
  const map: Record<string, string> = {
    [process.env.STRIPE_PRICE_PRO_MONTHLY ?? '']: 'pro',
    [process.env.STRIPE_PRICE_PRO_ANNUAL ?? '']: 'pro',
    [process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY ?? '']: 'enterprise',
    [process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL ?? '']: 'enterprise',
  }
  return map[priceId] ?? 'free'
}

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Assinatura ausente' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('[webhook/stripe] Assinatura inválida:', err)
    return NextResponse.json({ error: 'Webhook inválido' }, { status: 400 })
  }

  try {
    switch (event.type) {
      // Assinatura criada ou atualizada (upgrade/downgrade)
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string
        const priceId = sub.items.data[0]?.price.id ?? ''
        const plan = planFromPriceId(priceId)
        const status =
          sub.status === 'active' || sub.status === 'trialing' ? 'active' : 'inactive'

        await db
          .update(organizations)
          .set({ plan, subscriptionStatus: status, updatedAt: new Date() })
          .where(eq(organizations.stripeCustomerId, customerId))

        console.log(`[webhook/stripe] ${event.type}: customer=${customerId} → plan=${plan} status=${status}`)
        break
      }

      // Assinatura cancelada / encerrada
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string

        await db
          .update(organizations)
          .set({ plan: 'free', subscriptionStatus: 'inactive', updatedAt: new Date() })
          .where(eq(organizations.stripeCustomerId, customerId))

        console.log(`[webhook/stripe] subscription.deleted: customer=${customerId} → free`)
        break
      }

      // Checkout concluído — vincula stripeCustomerId à org e ativa plano
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const customerId = session.customer as string
        const orgId = session.metadata?.organization_id

        if (!orgId) {
          console.warn('[webhook/stripe] checkout.session.completed sem organization_id no metadata')
          break
        }

        const subId = session.subscription as string | null
        let plan = 'pro'
        let subscriptionStatus = 'active'

        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId)
          const priceId = sub.items.data[0]?.price.id ?? ''
          plan = planFromPriceId(priceId)
          subscriptionStatus =
            sub.status === 'active' || sub.status === 'trialing' ? 'active' : 'inactive'
        }

        await db
          .update(organizations)
          .set({ stripeCustomerId: customerId, plan, subscriptionStatus, updatedAt: new Date() })
          .where(eq(organizations.id, orgId))

        console.log(`[webhook/stripe] checkout.completed: org=${orgId} → plan=${plan}`)
        break
      }

      // Pagamento de fatura falhou
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        await db
          .update(organizations)
          .set({ subscriptionStatus: 'past_due', updatedAt: new Date() })
          .where(eq(organizations.stripeCustomerId, customerId))

        console.log(`[webhook/stripe] invoice.payment_failed: customer=${customerId}`)
        break
      }

      // Pagamento de fatura bem-sucedido
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        await db
          .update(organizations)
          .set({ subscriptionStatus: 'active', updatedAt: new Date() })
          .where(eq(organizations.stripeCustomerId, customerId))

        break
      }

      default:
        break
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[webhook/stripe] Erro ao processar evento:', err)
    // Retorna 200 para o Stripe não retentar — erro é interno
    return NextResponse.json({ received: true, error: 'Erro interno' })
  }
}
