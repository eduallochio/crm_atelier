import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logServerError } from '@/lib/log-error'
import {
  orgServiceOrders,
  orgServiceOrderItems,
  orgServiceOrderEmbalagens,
  orgClients,
  organizations,
  usageMetrics,
  orgTransactions,
  orgPaymentMethods,
  orgOrderSequences,
} from '@/lib/db/schema'
import { eq, and, inArray, sql as drizzleSql } from 'drizzle-orm'
import { requireAuth, assertPermission } from '@/lib/auth/session'
import { getPlanLimits, hasLifetimeLicense, limitExceededResponse } from '@/lib/plan-limits'
import { calcularDesconto } from '@/lib/order-discount'

export async function GET() {
  let organizationId: string | undefined
  try {
    const user = await requireAuth()
    assertPermission(user, 'ordens_servico')
    organizationId = user.organizationId

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
        horaRetirada:       orgServiceOrders.horaRetirada,
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
      .leftJoin(orgClients, and(eq(orgClients.id, orgServiceOrders.clientId), eq(orgClients.organizationId, user.organizationId)))
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
      .where(inArray(orgServiceOrderItems.orderId, orderIds))

    const itemsByOrder: Record<string, typeof allItems> = {}
    for (const item of allItems) {
      if (!itemsByOrder[item.orderId]) itemsByOrder[item.orderId] = []
      itemsByOrder[item.orderId].push(item)
    }

    const allEmbalagens = await db
      .select()
      .from(orgServiceOrderEmbalagens)
      .where(inArray(orgServiceOrderEmbalagens.orderId, orderIds))

    const embalagensByOrder: Record<string, typeof allEmbalagens> = {}
    for (const e of allEmbalagens) {
      if (!embalagensByOrder[e.orderId]) embalagensByOrder[e.orderId] = []
      embalagensByOrder[e.orderId].push(e)
    }

    const orders = orderRows.map(row => ({
      id:                  row.id,
      numero:              row.numero,
      organization_id:     row.organizationId,
      client_id:           row.clientId,
      status:              row.status,
      valor_total:         Number(row.valorTotal ?? 0),
      valor_entrada:       Number(row.valorEntrada ?? 0),
      valor_pago:          Number(row.valorPago ?? 0),
      status_pagamento:    row.statusPagamento,
      desconto_valor:      Number(row.descontoValor ?? 0),
      desconto_percentual: Number(row.descontoPercentual ?? 0),
      data_abertura:       row.dataAbertura,
      data_prevista:       row.dataPrevista,
      hora_retirada:       row.horaRetirada,
      data_conclusao:      row.dataConclusao,
      forma_pagamento:     row.formaPagamento,
      observacoes:         row.observacoes,
      notas_internas:      row.notasInternas,
      fotos:               null,
      created_at:          row.createdAt,
      client: row.clienteCId
        ? { id: row.clienteCId, nome: row.clienteNome, telefone: row.clienteTelefone, email: row.clienteEmail }
        : null,
      items: (itemsByOrder[row.id] || []).map((i: any) => ({
        id:             i.id,
        order_id:       i.orderId,
        service_id:     i.serviceId,
        service_nome:   i.serviceNome,
        quantidade:     Number(i.quantidade ?? 1),
        valor_unitario: Number(i.valorUnitario ?? 0),
        valor_total:    Number(i.valorTotal ?? 0),
        observacoes:    i.observacoes ?? null,
        created_at:     i.createdAt,
      })),
      embalagens: (embalagensByOrder[row.id] || []).map((e: any) => ({
        id:             e.id,
        order_id:       e.orderId,
        product_id:     e.productId,
        nome:           e.nome,
        quantidade:     Number(e.quantidade ?? 1),
        unidade:        e.unidade,
        preco_unitario: e.precoUnitario != null ? Number(e.precoUnitario) : null,
        created_at:     e.createdAt,
      })),
    }))

    return NextResponse.json(orders)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    if ((error as Error).message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    logServerError('[GET /api/orders]', error, undefined, organizationId); console.error('[GET /api/orders]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  let organizationId: string | undefined
  try {
    const user = await requireAuth()
    assertPermission(user, 'ordens_servico')
    organizationId = user.organizationId
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

    // Valida que o cliente referenciado pertence a esta org — sem esse filtro,
    // um client_id de outra organização passaria e a OS vazaria nome/telefone/
    // email desse cliente em toda leitura subsequente (GET /api/orders)
    if (body.client_id) {
      const [ownedClient] = await db
        .select({ id: orgClients.id })
        .from(orgClients)
        .where(and(eq(orgClients.id, body.client_id), eq(orgClients.organizationId, user.organizationId)))
        .limit(1)
      if (!ownedClient) {
        return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 400 })
      }
    }

    const items: Array<{
      service_id: string
      service_nome: string
      quantidade: number
      valor_unitario: number
      valor_total: number
      observacoes?: string
    }> = body.items || []

    // valor_total de cada item é sempre recalculado aqui (quantidade × valor
    // unitário) — nunca confia no valor_total que o cliente mandou, mesma
    // regra já aplicada em PUT /api/orders/[id]/items; sem isso um caller
    // poderia subfaturar a OS mandando um valor_total divergente
    const itemTotals = items.map(item => {
      const quantidade = Math.max(1, Number(item.quantidade) || 1)
      const valorUnitario = Math.max(0, Number(item.valor_unitario) || 0)
      return quantidade * valorUnitario
    })
    const subtotal = itemTotals.reduce((sum, v) => sum + v, 0)

    const { descontoPercentual, descontoValor, valorTotal: valor_total } =
      calcularDesconto(subtotal, body.desconto_percentual, body.desconto_valor)
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
      // Incrementa o contador monotônico para esta org e obtém o próximo número.
      // UPSERT garante que novas orgs sem registro prévio funcionem.
      // Deleções de OS nunca afetam este contador — elimina colisões de unique
      // constraint (uq_order_numero_org) que ocorriam com a abordagem max()+1.
      const [seq] = await tx
        .insert(orgOrderSequences)
        .values({ organizationId: user.organizationId, lastNumero: 1 })
        .onConflictDoUpdate({
          target: orgOrderSequences.organizationId,
          set: {
            lastNumero: drizzleSql`${orgOrderSequences.lastNumero} + 1`,
            updatedAt:  drizzleSql`now()`,
          },
        })
        .returning({ lastNumero: orgOrderSequences.lastNumero })

      // Resolve forma de pagamento — forma_pagamento agora é o UUID do método
      let resolvedPaymentMethodId: string | null = null
      let resolvedFormaPagamento: string | null = null
      if (body.forma_pagamento) {
        const [pm] = await tx
          .select({ id: orgPaymentMethods.id, nome: orgPaymentMethods.nome })
          .from(orgPaymentMethods)
          .where(and(
            eq(orgPaymentMethods.organizationId, user.organizationId),
            eq(orgPaymentMethods.id, body.forma_pagamento)
          ))
          .limit(1)
        resolvedPaymentMethodId = pm?.id ?? null
        resolvedFormaPagamento = pm?.nome ?? null
      }

      const [newOrder] = await tx
        .insert(orgServiceOrders)
        .values({
          organizationId:     user.organizationId,
          numero:             seq.lastNumero,
          clientId:           body.client_id || null,
          status:             body.status,
          valorTotal:         String(valor_total),
          valorEntrada:       String(valor_entrada),
          valorPago:          String(valor_pago),
          statusPagamento:    status_pagamento,
          descontoValor:      String(descontoValor),
          descontoPercentual: String(descontoPercentual),
          dataPrevista:       body.data_prevista || null,
          horaRetirada:       body.hora_retirada || null,
          formaPagamento:     resolvedFormaPagamento,
          observacoes:        body.observacoes || null,
          notasInternas:      body.notas_internas || null,
          createdByUserId:    user.id,
        })
        .returning()

      // Create items
      if (items.length > 0) {
        await tx.insert(orgServiceOrderItems).values(
          items.map((item, index) => ({
            orderId:       newOrder.id,
            serviceId:     item.service_id || null,
            serviceNome:   item.service_nome,
            quantidade:    Math.max(1, Number(item.quantidade) || 1),
            valorUnitario: String(Math.max(0, Number(item.valor_unitario) || 0)),
            valorTotal:    String(itemTotals[index]),
            observacoes:   item.observacoes || null,
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

      // Register financial entry for entrada, if any — vinculada à OS e à
      // forma de pagamento informada, pra ficar rastreável na ficha da ordem
      if (valor_entrada > 0) {
        const today = new Date().toISOString().split('T')[0]

        const paymentMethodId = resolvedPaymentMethodId

        await tx.insert(orgTransactions).values({
          organizationId: user.organizationId,
          tipo:           'entrada',
          descricao:      `Entrada OS #${newOrder.numero}`,
          valor:          String(valor_entrada),
          dataTransacao:  today,
          paymentMethodId,
          serviceOrderId: newOrder.id,
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
    if ((error as Error).message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    logServerError('[POST /api/orders]', error, undefined, organizationId); console.error('[POST /api/orders]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
