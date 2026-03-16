import { NextResponse } from 'next/server'
import { requireMaster } from '@/lib/auth/session'
import { getPool, sql } from '@/lib/db'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireMaster()
    const { id } = await params
    const pool = await getPool()

    const result = await pool
      .request()
      .input('id', sql.UniqueIdentifier, id)
      .query(`
        SELECT
          o.id, o.name, o.[plan], o.state, o.created_at,
          (SELECT COUNT(*) FROM users u WHERE u.organization_id = o.id) AS users_count,
          (SELECT COUNT(*) FROM org_clients c WHERE c.organization_id = o.id) AS clients_count
        FROM organizations o
        WHERE o.id = @id
      `)

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    }

    const row = result.recordset[0]
    return NextResponse.json({
      ...row,
      mrr: row.plan === 'pro' ? 59.90 : 0,
    })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[GET /api/admin/organizations/:id]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
