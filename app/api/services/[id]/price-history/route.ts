import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getPool, sql } from '@/lib/db'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const pool = await getPool()

    const result = await pool
      .request()
      .input('serviceId', sql.UniqueIdentifier, id)
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(`
        SELECT h.*
        FROM org_service_price_history h
        INNER JOIN org_services s ON s.id = h.org_service_id AND s.organization_id = @orgId
        WHERE h.org_service_id = @serviceId
        ORDER BY h.changed_at DESC
      `)

    return NextResponse.json(result.recordset)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[GET /api/services/:id/price-history]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
