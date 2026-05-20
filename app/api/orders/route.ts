import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
import { logServerError } from '@/lib/log-error'
  orgServiceOrders,
  orgServiceOrderItems,
  orgClients,
  organizations,
  usageMetrics,
  orgTransactions,
} from '@/lib/db/schema'
import { eq, and, sql as drizzleSql } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth/session'
import { getPlanLimits, hasLifetimeLicense, limitExceededResponse } from '@/lib/plan-limits'

export async function GET() {
  try {
    const user = await requireAuth()

    const orderRows = await db
      .select({
        id:                 orgServiceOrders.id,
        numero:             orgServiceOrders.numero,
        organizationId:     orgServiceOrders.organizationId,
        clientId:           orgServiceOrders.clientId,
        status:             orgServiceOrders.status,
        valorTotal:         orgServiceOrders.valorTotal,
        valorEntrada:       orgServiceOrders.valorEntrada,
        valorPago:          orgServiceOrders.valorPago,
        statusPagamento:    orgServiceOrders.statusPagamento,
        descontoValor:      orgServiceOrders.descontoValor,
        descontoPercentual: orgServiceOrders.descontoPercentual,
        dataAbertura:       orgServiceOrders.dataAbertura,
        dataPrevista:       orgServiceOrders.dataPrevista,
        dataConclusao:      orgServiceOrders.dataConclusao,
        formaPagamento:     orgServiceOrders.formaPagamento,
        observacoes:        orgServiceOrders.observacoes,
        notasInternas:      orgServiceOrders.notasInternas,
        createdAt:          orgServiceOrders.createdAt,
        clienteCId:         orgClients.id,
        clienteNome:        orgClients.nome,
        clienteTelefone:    orgClients.telefone,
        clienteEmail:       orgClients.email,
      })
      .from(orgServiceOrders)
      .leftJoin(orgClients, eq(orgClients.id, orgServiceOrders.clientId))
      .where(eq(orgServiceOrders.organizationId, user.organizationId))
      .orderBy(drizzleSql`${orgServiceOrders.createdAt} desc`)

    if (orderRows.length === 0) {
      return NextResponse.json([])
    }

    const orderIds = orderRows.map(r => r.id)

    // Fetch all items for these orders
    const allItems = await db
      .select()
      .from(orgServiceOrderItems)
      .where(drizzleSql`${orgServiceOrderItems.orderId} = ANY(${orderIds})`)

    const itemsByOrder: Record<string, typeof allItems> = {}
    for (const item of allItems) {
      if (!itemsByOrder[item.orderId]) itemsByOrder[item.orderId] = []
      itemsByOrder[item.orderId].push(item)
    }

    const orders = orderRows.map(row => ({
      id:                  row.id,
      numero:              row.numero,
      organization_id:     row.organizationId,
      client_id:           row.clientId,
      status:              row.status,
      valor_total:         row.valorTotal,
      valor_entrada:       row.valorEntrada,
      valor_pago:          row.valorPago,
      status_pagamento:    row.statusPagamento,
      desconto_valor:      row.descontoValor,
      desconto_percentual: row.descontoPercentual,
      data_abertura:       row.dataAbertura,
      data_prevista:       row.dataPrevista,
      data_conclusao:      row.dataConclusao,
      forma_pagamento:     row.formaPagamento,
      observacoes:         row.observacoes,
      notas_internas:      row.notasInternas,
      fotos:               null,
      created_at:          row.createdAt,
      client: row.clienteCId
        ? { id: row.clienteCId, nome: row.clienteNome, telefone: row.clienteTelefone, email: row.clienteEmail }
        : null,
      items: itemsByOrder[row.id] || [],
    }))

    return NextResponse.json(orders)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[GET /api/orders]', error); console.error('[GET /api/orders]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    // Verificar limite do plano (usa contador cumulativo)
    const [orgRow, metricsRow, limits, lifetime] = await Promise.all([
      db
        .select({ plan: organizations.plan })
        .from(organizations)
        .where(eq(organizations.id, user.organizationId))
        .then(r => r[0]),
      db
        .select({ totalOrdersEver: usageMetrics.totalOrdersEver })
        .from(usageMetrics)
        .where(eq(usageMetrics.organizationId, user.organizationId))
        .then(r => r[0]),
      getPlanLimits(),
      hasLifetimeLicense(user.organizationId),
    ])

    const totalOrdersEver = metricsRow?.totalOrdersEver ?? 0
    if (!lifetime && orgRow?.plan === 'free' && totalOrdersEver >= limits.max_orders_free) {
      return NextResponse.json(
        limitExceededResponse('ordens de serviço', limits.max_orders_free),
        { status: 403 }
      )
    }

    const items: Array<{
      service_id: string
      service_nome: string
      quantidade: number
      valor_unitario: number
      valor_total: number
    }> = body.items || []

    const subtotal = items.reduce((sum, item) => sum + item.valor_total, 0)

    let valorDesconto = 0
    if (body.desconto_percentual && body.desconto_percentual > 0) {
      valorDesconto = (subtotal * body.desconto_percentual) / 100
    } else if (body.desconto_valor && body.desconto_valor > 0) {
      valorDesconto = body.desconto_valor
    }

    const valor_total = Math.max(0, subtotal - valorDesconto)
    const valor_entrada = body.valor_entrada || 0
    const valor_pago = valor_entrada

    let status_pagamento: 'pendente' | 'parcial' | 'pago' = 'pendente'
    if (valor_pago >= valor_total && valor_total > 0) {
      status_pagamento = 'pago'
    } else if (valor_pago > 0) {
      status_pagamento = 'parcial'
    }

    // Run in a transaction
    const order = await db.transaction(async (tx) => {
      // Next order number
      const numResult = await tx
        .select({ maxNum: drizzleSql<number>`coalesce(max(${orgServiceOrders.numero}), 0)` })
        .from(orgServiceOrders)
        .where(eq(orgServiceOrders.organizationId, user.organizationId))
      const numero = (Number(numResult[0]?.maxNum) || 0) + 1

      // Create order
      const [newOrder] = await tx
        .insert(orgServiceOrders)
        .values({
          organizationId:     user.organizationId,
          numero,
          clientId:           body.client_id || null,
          status:             body.status,
          valorTotal:         String(valor_total),
          valorEntrada:       String(valor_entrada),
          valorPago:          String(valor_pago),
          statusPagamento:    status_pagamento,
          descontoValor:      String(body.desconto_valor || 0),
          descontoPercentual: String(body.desconto_percentual || 0),
          dataPrevista:       body.data_prevista || null,
          formaPagamento:     body.forma_pagamento || null,
          observacoes:        body.observacoes || null,
          notasInternas:      body.notas_internas || null,
        })
        .returning()

      // Create items
      if (items.length > 0) {
        await tx.insert(orgServiceOrderItems).values(
          items.map(item => ({
            orderId:       newOrder.id,
            serviceId:     item.service_id || null,
            serviceNome:   item.service_nome,
            quantidade:    item.quantidade,
            valorUnitario: String(item.valor_unitario),
            valorTotal:    String(item.valor_total),
          }))
        )
      }

      // Update usage metrics
      await tx
        .update(usageMetrics)
        .set({
          ordersCount:     drizzleSql`${usageMetrics.ordersCount} + 1`,
          totalOrdersEver: drizzleSql`${usageMetrics.totalOrdersEver} + 1`,
          updatedAt:       new Date(),
        })
        .where(eq(usageMetrics.organizationId, user.organizationId))

      // Register financial entry for entrada, if any
      if (valor_entrada > 0) {
        const today = new Date().toISOString().split('T')[0]
        await tx.insert(orgTransactions).values({
          organizationId: user.organizationId,
          tipo:           'entrada',
          descricao:      `Entrada OS #${numero}`,
          valor:          String(valor_entrada),
          dataTransacao:  today,
          observacoes:    'Entrada recebida na criação da OS',
        })
      }

      return newOrder
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[POST /api/orders]', error); console.error('[POST /api/orders]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
