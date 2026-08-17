import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { organizations } from '@/lib/db/schema'
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

    const subscription = await getSubscription(org.asaasSubscriptionId)

    return NextResponse.json({
      plan:          org.plan,
      status:        org.subscriptionStatus,
      next_due_date: subscription.nextDueDate,
      cycle:         subscription.cycle,
      value:         subscription.value,
    })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[GET /api/subscription]', error)
    return NextResponse.json({ plan: 'free', next_due_date: null, status: 'inactive' })
  }
}
