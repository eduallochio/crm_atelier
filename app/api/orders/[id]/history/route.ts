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
      .input('orderId', sql.UniqueIdentifier, id)
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(`
        SELECT h.*
        FROM org_service_order_history h
        INNER JOIN org_service_orders o ON o.id = h.order_id
        WHERE h.order_id = @orderId AND o.organization_id = @orgId
        ORDER BY h.created_at DESC
      `)

    return NextResponse.json(result.recordset)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[GET /api/orders/:id/history]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
