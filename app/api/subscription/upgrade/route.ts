import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { organizations, plans } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { updateSubscription } from '@/lib/asaas'
import { logServerError } from '@/lib/log-error'

// POST /api/subscription/upgrade
// Troca ciclo MONTHLY → YEARLY da assinatura ativa no Asaas
export async function POST() {
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
      return NextResponse.json({ error: 'Nenhuma assinatura ativa encontrada' }, { status: 400 })
    }

    if (org.subscriptionStatus !== 'active') {
      return NextResponse.json({ error: 'Assinatura não está ativa' }, { status: 400 })
    }

    const [planRow] = await db
      .select({ priceAnnual: plans.priceAnnual })
      .from(plans)
      .where(eq(plans.slug, org.plan ?? 'pro'))
      .limit(1)

    const annualPrice = parseFloat(planRow?.priceAnnual ?? '0')
    if (!annualPrice) {
      return NextResponse.json({ error: 'Preço anual não configurado para este plano' }, { status: 400 })
    }

    await updateSubscription(org.asaasSubscriptionId, {
      cycle: 'YEARLY',
      value: annualPrice,
    })

    return NextResponse.json({ success: true, cycle: 'YEARLY', value: annualPrice })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[POST /api/subscription/upgrade]', error)
    const msg = (error as Error).message ?? ''
    const friendly = msg.includes('Asaas')
      ? `Erro no gateway: ${msg.split('→')[1]?.trim() ?? msg}`
      : 'Erro ao atualizar assinatura'
    return NextResponse.json({ error: friendly }, { status: 500 })
  }
}
