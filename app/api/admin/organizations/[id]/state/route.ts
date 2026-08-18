import { NextRequest, NextResponse } from 'next/server'
import { requireMaster } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { organizations } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { logAdminAction } from '@/lib/admin-log'
import { logServerError } from '@/lib/log-error'
import { cancelSubscription } from '@/lib/asaas'

const ACTION_MAP: Record<string, { status: string; action: string; label: string }> = {
  suspend:    { status: 'suspended', action: 'SUSPEND',    label: 'Suspensa' },
  reactivate: { status: 'active',    action: 'REACTIVATE', label: 'Reativada' },
  cancel:     { status: 'cancelled', action: 'CANCEL',     label: 'Cancelada' },
  trial:      { status: 'trialing',  action: 'UPDATE',     label: 'Em teste' },
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireMaster()
    const { id } = await params
    const { action } = await request.json()

    const mapping = ACTION_MAP[action]
    if (!mapping) {
      return NextResponse.json({ error: 'Ação inválida. Use: suspend, reactivate, cancel, trial' }, { status: 400 })
    }

    const orgRows = await db
      .select({
        name:                organizations.name,
        subscriptionStatus:  organizations.subscriptionStatus,
        asaasSubscriptionId: organizations.asaasSubscriptionId,
      })
      .from(organizations)
      .where(eq(organizations.id, id))
      .limit(1)

    if (orgRows.length === 0) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
    }

    const org = orgRows[0]
    const oldState = org.subscriptionStatus ?? 'inactive'

    if (oldState === mapping.status) {
      return NextResponse.json({ message: 'Estado já é o mesmo' })
    }

    // Cancelar no Asaas quando a ação é cancel e há assinatura ativa
    if (action === 'cancel' && org.asaasSubscriptionId) {
      try {
        await cancelSubscription(org.asaasSubscriptionId)
      } catch (asaasErr) {
        // Loga mas não bloqueia — o status local ainda deve ser atualizado
        logServerError('[PUT /api/admin/organizations/[id]/state] Asaas cancel', asaasErr)
      }
    }

    const updateFields: Partial<typeof organizations.$inferInsert> = {
      subscriptionStatus: mapping.status,
      updatedAt:          new Date(),
    }
    if (action === 'cancel') updateFields.plan = 'free'

    await db
      .update(organizations)
      .set(updateFields)
      .where(eq(organizations.id, id))

    await logAdminAction({
      action: mapping.action,
      resourceType: 'organization',
      resourceId: id,
      description: `Organização "${org.name}" ${mapping.label.toLowerCase()} (era: ${oldState})`,
      adminEmail: admin.email,
      details: { orgId: id, orgName: org.name, oldState, newState: mapping.status },
    })

    return NextResponse.json({ success: true, state: mapping.status })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    logServerError('[PUT /api/admin/organizations/[id]/state]', error); console.error('[PUT /api/admin/organizations/[id]/state]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
