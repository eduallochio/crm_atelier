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
      .input('orgId', sql.UniqueIdentifier, id)
      .query(`
        SELECT id, email, full_name, [role], created_at
        FROM users
        WHERE organization_id = @orgId
        ORDER BY created_at DESC
      `)

    return NextResponse.json(result.recordset)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[GET /api/admin/organizations/:id/users]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
