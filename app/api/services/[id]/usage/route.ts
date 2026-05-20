import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { orgServiceOrderItems, orgServiceOrders, orgClients } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth/session'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const rows = await db
      .select({
        // item fields
        itemId:           orgServiceOrderItems.id,
        orderId:          orgServiceOrderItems.orderId,
        serviceId:        orgServiceOrderItems.serviceId,
        serviceNome:      orgServiceOrderItems.serviceNome,
        quantidade:       orgServiceOrderItems.quantidade,
        valorUnitario:    orgServiceOrderItems.valorUnitario,
        valorTotal:       orgServiceOrderItems.valorTotal,
        itemCreatedAt:    orgServiceOrderItems.createdAt,
        // order fields
        orderNumero:      orgServiceOrders.numero,
        orderDataAbertura: orgServiceOrders.dataAbertura,
        orderStatus:      orgServiceOrders.status,
        // client fields
        clientNome:       orgClients.nome,
      })
      .from(orgServiceOrderItems)
      .innerJoin(orgServiceOrders, and(
        eq(orgServiceOrders.id, orgServiceOrderItems.orderId),
        eq(orgServiceOrders.organizationId, user.organizationId)
      ))
      .leftJoin(orgClients, eq(orgClients.id, orgServiceOrders.clientId))
      .where(eq(orgServiceOrderItems.serviceId, id))
      .orderBy(desc(orgServiceOrderItems.createdAt))

    const items = rows.map(row => ({
      id:            row.itemId,
      order_id:      row.orderId,
      service_id:    row.serviceId,
      service_nome:  row.serviceNome,
      quantidade:    row.quantidade,
      valor_unitario: row.valorUnitario,
      valor_total:   row.valorTotal,
      created_at:    row.itemCreatedAt,
      order: {
        id:            row.orderId,
        numero:        row.orderNumero,
        data_abertura: row.orderDataAbertura,
        status:        row.orderStatus,
        client:        { nome: row.clientNome },
      },
    }))

    const totalUses = items.reduce((sum, item) => sum + (Number(item.quantidade) || 0), 0)
    const totalRevenue = items.reduce((sum, item) => sum + (Number(item.valor_total) || 0), 0)
    const lastUsed = rows[0]?.itemCreatedAt?.toISOString() ?? null

    return NextResponse.json({ items, totalUses, totalRevenue, lastUsed })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[GET /api/services/:id/usage]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
