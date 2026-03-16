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

    try {
      const result = await pool
        .request()
        .input('orgId', sql.NVarChar, id)
        .query(`
          SELECT TOP 50
            id, action, resource_type, resource_id,
            description, admin_email, details_json, created_at
          FROM admin_logs
          WHERE resource_id = @orgId
          ORDER BY created_at DESC
        `)
      return NextResponse.json(result.recordset)
    } catch {
      return NextResponse.json([])
    }
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
