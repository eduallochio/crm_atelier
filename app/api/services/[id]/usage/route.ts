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
        SELECT
          i.*,
          o.id AS order_id,
          o.numero AS order_numero,
          o.data_abertura AS order_data_abertura,
          o.status AS order_status,
          c.nome AS client_nome
        FROM org_service_order_items i
        INNER JOIN org_service_orders o ON o.id = i.order_id AND o.organization_id = @orgId
        LEFT JOIN org_clients c ON c.id = o.client_id
        WHERE i.service_id = @serviceId
        ORDER BY i.created_at DESC
      `)

    const items = result.recordset.map((row: Record<string, unknown>) => ({
      ...row,
      order: {
        id: row.order_id,
        numero: row.order_numero,
        data_abertura: row.order_data_abertura,
        status: row.order_status,
        client: { nome: row.client_nome },
      },
    }))

    const totalUses = items.reduce((sum: number, item: Record<string, unknown>) => sum + ((item.quantidade as number) || 0), 0)
    const totalRevenue = items.reduce((sum: number, item: Record<string, unknown>) => sum + ((item.valor_total as number) || 0), 0)
    const lastUsed = items[0]?.created_at || null

    return NextResponse.json({ items, totalUses, totalRevenue, lastUsed })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[GET /api/services/:id/usage]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
