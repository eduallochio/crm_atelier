import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { organizations, plans } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { updateSubscription } from '@/lib/asaas'
import { addDays } from 'date-fns'
import { logServerError } from '@/lib/log-error'

// POST /api/subscription/upgrade
// Troca ciclo MONTHLY → YEARLY da assinatura ativa no Asaas
export async function POST() {
  try {
    const user = await requireAuth()

    const [org] = await db
      .select({
        plan:                    organizations.plan,
        subscriptionStatus:      organizations.subscriptionStatus,
        asaasSubscriptionId:     organizations.asaasSubscriptionId,
        firstPaymentConfirmedAt: organizations.firstPaymentConfirmedAt,
        subscriptionNextDueDate: organizations.subscriptionNextDueDate,
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

    // Enquanto o bônus de 60 dias da 1ª assinatura mensal estiver valendo,
    // migrar pra anual trocaria o valor pro anual cheio já na data do fim do
    // bônus (nextDueDate não se move no updateSubscription abaixo) — cobraria
    // 12x o valor numa data que deveria ser só o fim do período promocional
    if (org.firstPaymentConfirmedAt && org.subscriptionNextDueDate) {
      const fimDoBonus = addDays(new Date(org.firstPaymentConfirmedAt), 60)
      const proximoVencimento = new Date(`${org.subscriptionNextDueDate}T12:00:00`)
      if (proximoVencimento < fimDoBonus) {
        return NextResponse.json({
          error: 'Sua primeira assinatura ainda está no período promocional de 60 dias. Você pode migrar para o plano Anual assim que esse período terminar.',
        }, { status: 400 })
      }
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
