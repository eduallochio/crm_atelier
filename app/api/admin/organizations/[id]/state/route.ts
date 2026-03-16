import { NextRequest, NextResponse } from 'next/server'
import { requireMaster } from '@/lib/auth/session'
import { getPool, sql } from '@/lib/db'
import { logAdminAction } from '@/lib/admin-log'

const ACTION_MAP: Record<string, { state: string; action: string; label: string }> = {
  suspend:    { state: 'suspended', action: 'SUSPEND',    label: 'Suspensa' },
  reactivate: { state: 'active',    action: 'REACTIVATE', label: 'Reativada' },
  cancel:     { state: 'cancelled', action: 'CANCEL',     label: 'Cancelada' },
  trial:      { state: 'trial',     action: 'UPDATE',     label: 'Em teste' },
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

    const pool = await getPool()

    // Buscar org atual
    const orgResult = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .query(`SELECT name, state FROM organizations WHERE id = @id`)

    if (!orgResult.recordset.length) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
    }

    const org = orgResult.recordset[0]
    const oldState = org.state as string

    if (oldState === mapping.state) {
      return NextResponse.json({ message: 'Estado já é o mesmo' })
    }

    // Atualizar estado
    await pool.request()
      .input('id',    sql.UniqueIdentifier, id)
      .input('state', sql.NVarChar, mapping.state)
      .query(`UPDATE organizations SET state = @state, updated_at = GETDATE() WHERE id = @id`)

    await logAdminAction({
      action: mapping.action,
      resourceType: 'organization',
      resourceId: id,
      description: `Organização "${org.name}" ${mapping.label.toLowerCase()} (era: ${oldState})`,
      adminEmail: admin.email,
      details: { orgId: id, orgName: org.name, oldState, newState: mapping.state },
    })

    return NextResponse.json({ success: true, state: mapping.state })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    console.error('[PUT /api/admin/organizations/[id]/state]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
