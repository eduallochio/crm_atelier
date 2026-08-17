import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { organizations } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { cancelSubscription } from '@/lib/asaas'
import { logServerError } from '@/lib/log-error'

export async function POST() {
  try {
    const user = await requireAuth()

    const [org] = await db
      .select({ id: organizations.id, asaasSubscriptionId: organizations.asaasSubscriptionId })
      .from(organizations)
      .where(eq(organizations.id, user.organizationId))
      .limit(1)

    if (!org?.asaasSubscriptionId) {
      return NextResponse.json({ error: 'Nenhuma assinatura ativa encontrada.' }, { status: 404 })
    }

    await cancelSubscription(org.asaasSubscriptionId)

    // Rebaixa imediatamente — o webhook SUBSCRIPTION_DELETED também fará isso,
    // mas adiantamos para o usuário ver o efeito na hora
    await db
      .update(organizations)
      .set({ plan: 'free', subscriptionStatus: 'inactive', asaasSubscriptionId: null })
      .where(eq(organizations.id, org.id))

    return NextResponse.json({ ok: true })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[POST /api/subscription/cancel]', error)
    return NextResponse.json({ error: 'Erro ao cancelar assinatura. Tente novamente.' }, { status: 500 })
  }
}
