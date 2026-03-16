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

    const ordersResult = await pool
      .request()
      .input('clientId', sql.UniqueIdentifier, id)
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(`
        SELECT o.*
        FROM org_service_orders o
        WHERE o.client_id = @clientId AND o.organization_id = @orgId
        ORDER BY o.created_at DESC
      `)

    const orders = ordersResult.recordset

    if (orders.length === 0) {
      return NextResponse.json({
        orders: [],
        stats: { totalSpent: 0, totalOrders: 0, lastOrder: null, openOrders: 0 },
      })
    }

    // Fetch items for all orders via JOIN (safe, no string interpolation)
    const itemsResult = await pool
      .request()
      .input('clientId2', sql.UniqueIdentifier, id)
      .input('orgId2', sql.UniqueIdentifier, user.organizationId)
      .query(`
        SELECT i.*
        FROM org_service_order_items i
        INNER JOIN org_service_orders o ON o.id = i.order_id
        WHERE o.client_id = @clientId2 AND o.organization_id = @orgId2
      `)

    const itemsByOrder = new Map<string, unknown[]>()
    for (const item of itemsResult.recordset) {
      const list = itemsByOrder.get(item.order_id) || []
      list.push(item)
      itemsByOrder.set(item.order_id, list)
    }

    const ordersWithItems = orders.map((o: Record<string, unknown>) => ({
      ...o,
      items: itemsByOrder.get(o.id as string) || [],
    }))

    const totalSpent = orders.reduce((sum: number, o: Record<string, unknown>) => {
      if (o.status === 'cancelado') return sum
      return sum + ((o.valor_total as number) || 0)
    }, 0)
    const openOrders = orders.filter((o: Record<string, unknown>) =>
      ['pendente', 'em_andamento'].includes(o.status as string)
    ).length

    return NextResponse.json({
      orders: ordersWithItems,
      stats: {
        totalSpent,
        totalOrders: orders.length,
        lastOrder: ordersWithItems[0] || null,
        openOrders,
      },
    })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[GET /api/clients/:id/orders]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
