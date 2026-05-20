import { NextRequest, NextResponse } from 'next/server'
import { requireMaster } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { organizations } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { logAdminAction } from '@/lib/admin-log'
import { logServerError } from '@/lib/log-error'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireMaster()
    const { id } = await params
    const { plan } = await request.json()

    const validPlans = ['free', 'pro']
    if (!plan || !validPlans.includes(plan)) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
    }

    // Buscar org atual para log
    const orgRows = await db
      .select({ name: organizations.name, plan: organizations.plan })
      .from(organizations)
      .where(eq(organizations.id, id))
      .limit(1)

    if (orgRows.length === 0) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
    }

    const org = orgRows[0]
    const oldPlan = org.plan

    if (oldPlan === plan) {
      return NextResponse.json({ message: 'Plano já é o mesmo' })
    }

    await db
      .update(organizations)
      .set({ plan, updatedAt: new Date() })
      .where(eq(organizations.id, id))

    await logAdminAction({
      action: 'CHANGE_PLAN',
      resourceType: 'organization',
      resourceId: id,
      description: `Plano de "${org.name}" alterado de ${oldPlan} → ${plan}`,
      adminEmail: admin.email,
      details: { orgId: id, orgName: org.name, oldPlan, newPlan: plan },
    })

    return NextResponse.json({ success: true, plan })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    logServerError('[PUT /api/admin/organizations/[id]/plan]', error); console.error('[PUT /api/admin/organizations/[id]/plan]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
