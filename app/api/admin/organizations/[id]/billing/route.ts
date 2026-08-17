import { NextResponse } from 'next/server'
import { requireMaster } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { organizations } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getSubscription, getSubscriptionPayments } from '@/lib/asaas'
import { logServerError } from '@/lib/log-error'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireMaster()
    const { id } = await params

    const [org] = await db
      .select({ asaasSubscriptionId: organizations.asaasSubscriptionId })
      .from(organizations)
      .where(eq(organizations.id, id))
      .limit(1)

    if (!org?.asaasSubscriptionId) {
      return NextResponse.json({ error: 'Organização não possui assinatura ativa no Asaas.' }, { status: 404 })
    }

    const [subscription, payments] = await Promise.all([
      getSubscription(org.asaasSubscriptionId),
      getSubscriptionPayments(org.asaasSubscriptionId),
    ])

    return NextResponse.json({
      id:          subscription.id,
      status:      subscription.status,
      value:       subscription.value,
      cycle:       subscription.cycle,
      nextDueDate: subscription.nextDueDate,
      billingType: subscription.billingType,
      payments:    payments
        .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
        .slice(0, 24),
    })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[GET /api/admin/organizations/:id/billing]', error)
    return NextResponse.json({ error: 'Erro ao carregar faturamento' }, { status: 500 })
  }
}
