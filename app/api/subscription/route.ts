import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { organizations, plans } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getSubscription } from '@/lib/asaas'
import { logServerError } from '@/lib/log-error'

export async function GET() {
  try {
    const user = await requireAuth()

    const [org] = await db
      .select({
        plan:                organizations.plan,
        subscriptionStatus:  organizations.subscriptionStatus,
        asaasSubscriptionId: organizations.asaasSubscriptionId,
      })
      .from(organizations)
      .where(eq(organizations.id, user.organizationId))
      .limit(1)

    if (!org?.asaasSubscriptionId) {
      return NextResponse.json({ plan: org?.plan ?? 'free', next_due_date: null, status: org?.subscriptionStatus ?? 'inactive' })
    }

    const [subscription, planRow] = await Promise.all([
      getSubscription(org.asaasSubscriptionId),
      db.select({ price: plans.price, priceAnnual: plans.priceAnnual })
        .from(plans).where(eq(plans.slug, org.plan)).limit(1).then(r => r[0] ?? null),
    ])

    const cycle = subscription.cycle
    const value = cycle === 'YEARLY'
      ? parseFloat(planRow?.priceAnnual ?? '0') || parseFloat(planRow?.price ?? '0') * 10
      : parseFloat(planRow?.price ?? String(subscription.value))

    return NextResponse.json({
      plan:          org.plan,
      status:        org.subscriptionStatus,
      next_due_date: subscription.nextDueDate,
      cycle,
      value,
    })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[GET /api/subscription]', error)
    return NextResponse.json({ error: 'Erro ao carregar dados da assinatura' }, { status: 500 })
  }
}
