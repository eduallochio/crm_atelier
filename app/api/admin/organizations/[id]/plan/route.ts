import { NextRequest, NextResponse } from 'next/server'
import { requireMaster } from '@/lib/auth/session'
import { getPool, sql } from '@/lib/db'
import { logAdminAction } from '@/lib/admin-log'

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

    const pool = await getPool()

    // Buscar org atual para log
    const orgResult = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .query(`SELECT name, [plan] FROM organizations WHERE id = @id`)

    if (!orgResult.recordset.length) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
    }

    const org = orgResult.recordset[0]
    const oldPlan = org.plan as string

    if (oldPlan === plan) {
      return NextResponse.json({ message: 'Plano já é o mesmo' })
    }

    // Atualizar plano
    await pool.request()
      .input('id',  sql.UniqueIdentifier, id)
      .input('plan', sql.NVarChar, plan)
      .query(`UPDATE organizations SET [plan] = @plan, updated_at = GETDATE() WHERE id = @id`)

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
    console.error('[PUT /api/admin/organizations/[id]/plan]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
