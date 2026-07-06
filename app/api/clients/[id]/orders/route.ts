import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgServiceOrders, orgServiceOrderItems } from '@/lib/db/schema'
import { eq, and, desc, inArray } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const orders = await db
      .select()
      .from(orgServiceOrders)
      .where(
        and(
          eq(orgServiceOrders.clientId, id),
          eq(orgServiceOrders.organizationId, user.organizationId)
        )
      )
      .orderBy(desc(orgServiceOrders.createdAt))

    if (orders.length === 0) {
      return NextResponse.json({
        orders: [],
        stats: { totalSpent: 0, totalOrders: 0, lastOrder: null, openOrders: 0 },
      })
    }

    const orderIds = orders.map((o) => o.id)

    const items = await db
      .select()
      .from(orgServiceOrderItems)
      .where(inArray(orgServiceOrderItems.orderId, orderIds))

    const itemsByOrder = new Map<string, typeof items>()
    for (const item of items) {
      const list = itemsByOrder.get(item.orderId) ?? []
      list.push(item)
      itemsByOrder.set(item.orderId, list)
    }

    const ordersWithItems = orders.map((o) => ({
      id:               o.id,
      numero:           o.numero,
      status:           o.status,
      valor_total:      Number(o.valorTotal ?? 0),
      valor_entrada:    Number(o.valorEntrada ?? 0),
      valor_pago:       Number(o.valorPago ?? 0),
      forma_pagamento:  o.formaPagamento,
      data_prevista:    o.dataPrevista,
      data_conclusao:   o.dataConclusao,
      observacoes:      o.observacoes,
      created_at:       o.createdAt,
      items: (itemsByOrder.get(o.id) ?? []).map((item) => ({
        id:             item.id,
        service_nome:   item.serviceNome,
        quantidade:     Number(item.quantidade ?? 1),
        valor_unitario: Number(item.valorUnitario ?? 0),
        valor_total:    Number(item.valorTotal ?? 0),
        observacoes:    item.observacoes ?? null,
      })),
    }))

    const totalSpent = orders.reduce((sum, o) => {
      if (o.status === 'cancelado') return sum
      return sum + Number(o.valorTotal ?? 0)
    }, 0)

    const openOrders = ordersWithItems.filter((o) =>
      ['pendente', 'em_andamento'].includes(o.status)
    ).length

    return NextResponse.json({
      orders: ordersWithItems,
      stats: {
        totalSpent,
        totalOrders: orders.length,
        lastOrder: ordersWithItems[0] ?? null,
        openOrders,
      },
    })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[GET /api/clients/:id/orders]', error); console.error('[GET /api/clients/:id/orders]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
