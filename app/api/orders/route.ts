import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getPool, sql } from '@/lib/db'
import { getPlanLimits, limitExceededResponse } from '@/lib/plan-limits'

export async function GET() {
  try {
    const user = await requireAuth()
    const pool = await getPool()

    // Buscar ordens com dados do cliente
    const ordersResult = await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(`
        SELECT
          o.id, o.numero, o.organization_id, o.client_id,
          o.status, o.valor_total, o.valor_entrada, o.valor_pago,
          o.status_pagamento, o.desconto_valor, o.desconto_percentual,
          o.data_abertura, o.data_prevista, o.data_conclusao,
          o.forma_pagamento, o.observacoes, o.notas_internas, o.created_at,
          c.id AS c_id, c.nome AS c_nome,
          c.telefone AS c_telefone, c.email AS c_email
        FROM org_service_orders o
        LEFT JOIN org_clients c ON c.id = o.client_id
        WHERE o.organization_id = @orgId
        ORDER BY o.created_at DESC
      `)

    if (ordersResult.recordset.length === 0) {
      return NextResponse.json([])
    }

    // Buscar todos os itens das ordens desta organização
    const itemsResult = await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(`
        SELECT i.*
        FROM org_service_order_items i
        INNER JOIN org_service_orders o ON o.id = i.order_id
        WHERE o.organization_id = @orgId
      `)

    // Agrupar itens por order_id
    const itemsByOrder: Record<string, unknown[]> = {}
    for (const item of itemsResult.recordset) {
      const key = item.order_id as string
      if (!itemsByOrder[key]) itemsByOrder[key] = []
      itemsByOrder[key].push(item)
    }

    // Montar resposta no formato esperado pelo hook
    const orders = ordersResult.recordset.map((row) => ({
      id: row.id,
      numero: row.numero,
      organization_id: row.organization_id,
      client_id: row.client_id,
      status: row.status,
      valor_total: row.valor_total,
      valor_entrada: row.valor_entrada,
      valor_pago: row.valor_pago,
      status_pagamento: row.status_pagamento,
      desconto_valor: row.desconto_valor,
      desconto_percentual: row.desconto_percentual,
      data_abertura: row.data_abertura,
      data_prevista: row.data_prevista,
      data_conclusao: row.data_conclusao,
      forma_pagamento: row.forma_pagamento,
      observacoes: row.observacoes,
      notas_internas: row.notas_internas,
      fotos: null,
      created_at: row.created_at,
      client: row.c_id
        ? { id: row.c_id, nome: row.c_nome, telefone: row.c_telefone, email: row.c_email }
        : null,
      items: itemsByOrder[row.id as string] || [],
    }))

    return NextResponse.json(orders)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[GET /api/orders]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const pool = await getPool()

    // Verificar limite do plano
    const [limitResult, limits] = await Promise.all([
      pool.request()
        .input('orgId', sql.UniqueIdentifier, user.organizationId)
        .query(`
          SELECT o.[plan],
            (SELECT COUNT(*) FROM org_service_orders WHERE organization_id = @orgId) AS orders_count
          FROM organizations o WHERE o.id = @orgId
        `),
      getPlanLimits(),
    ])

    const planRow = limitResult.recordset[0]
    if (planRow?.plan === 'free' && planRow?.orders_count >= limits.max_orders_free) {
      return NextResponse.json(
        limitExceededResponse('ordens de serviço', limits.max_orders_free),
        { status: 403 }
      )
    }

    // Calcular valor total e status de pagamento
    const items: Array<{ service_id: string; service_nome: string; quantidade: number; valor_unitario: number; valor_total: number }> = body.items || []
    const subtotal = items.reduce((sum: number, item) => sum + item.valor_total, 0)

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

    const transaction = new sql.Transaction(pool)
    await transaction.begin()

    try {
      // Próximo número da ordem (dentro da transação para evitar concorrência)
      const numResult = await new sql.Request(transaction)
        .input('orgId', sql.UniqueIdentifier, user.organizationId)
        .query(`
          SELECT ISNULL(MAX(numero), 0) + 1 AS next_num
          FROM org_service_orders
          WHERE organization_id = @orgId
        `)

      const numero = numResult.recordset[0].next_num

      // Criar ordem
      const orderResult = await new sql.Request(transaction)
        .input('orgId', sql.UniqueIdentifier, user.organizationId)
        .input('numero', sql.Int, numero)
        .input('clientId', sql.UniqueIdentifier, body.client_id || null)
        .input('status', sql.NVarChar, body.status)
        .input('valorTotal', sql.Decimal(10, 2), valor_total)
        .input('valorEntrada', sql.Decimal(10, 2), valor_entrada)
        .input('valorPago', sql.Decimal(10, 2), valor_pago)
        .input('statusPagamento', sql.NVarChar, status_pagamento)
        .input('descontoValor', sql.Decimal(10, 2), body.desconto_valor || 0)
        .input('descontoPerc', sql.Decimal(5, 2), body.desconto_percentual || 0)
        .input('dataPrevista', sql.NVarChar, body.data_prevista || null)
        .input('formaPagamento', sql.NVarChar, body.forma_pagamento || null)
        .input('observacoes', sql.NVarChar, body.observacoes || null)
        .input('notasInternas', sql.NVarChar, body.notas_internas || null)
        .query(`
          INSERT INTO org_service_orders (
            organization_id, numero, client_id, status,
            valor_total, valor_entrada, valor_pago, status_pagamento,
            desconto_valor, desconto_percentual,
            data_prevista, forma_pagamento, observacoes, notas_internas
          )
          OUTPUT INSERTED.*
          VALUES (
            @orgId, @numero, @clientId, @status,
            @valorTotal, @valorEntrada, @valorPago, @statusPagamento,
            @descontoValor, @descontoPerc,
            CAST(NULLIF(@dataPrevista, '') AS DATE),
            @formaPagamento, @observacoes, @notasInternas
          )
        `)

      const order = orderResult.recordset[0]

      // Criar itens da ordem
      for (const item of items) {
        await new sql.Request(transaction)
          .input('orderId', sql.UniqueIdentifier, order.id)
          .input('serviceId', sql.UniqueIdentifier, item.service_id)
          .input('serviceNome', sql.NVarChar, item.service_nome)
          .input('quantidade', sql.Int, item.quantidade)
          .input('valorUnitario', sql.Decimal(10, 2), item.valor_unitario)
          .input('valorTotal', sql.Decimal(10, 2), item.valor_total)
          .query(`
            INSERT INTO org_service_order_items
              (order_id, service_id, service_nome, quantidade, valor_unitario, valor_total)
            VALUES
              (@orderId, @serviceId, @serviceNome, @quantidade, @valorUnitario, @valorTotal)
          `)
      }

      // Atualizar métricas
      await new sql.Request(transaction)
        .input('orgId', sql.UniqueIdentifier, user.organizationId)
        .query(`
          UPDATE usage_metrics
          SET orders_count = orders_count + 1, updated_at = GETDATE()
          WHERE organization_id = @orgId
        `)

      // Registrar transação financeira para a entrada (se houver)
      if (valor_entrada > 0) {
        const today = new Date().toISOString().split('T')[0]
        await new sql.Request(transaction)
          .input('orgId',      sql.UniqueIdentifier, user.organizationId)
          .input('descricao',  sql.NVarChar,         `Entrada OS #${numero}`)
          .input('valor',      sql.Decimal(10, 2),   valor_entrada)
          .input('data',       sql.NVarChar,         today)
          .query(`
            INSERT INTO org_transactions
              (organization_id, tipo, descricao, valor, data_transacao, observacoes)
            VALUES
              (@orgId, 'entrada', @descricao, @valor, CAST(@data AS DATE),
               'Entrada recebida na criação da OS')
          `)
      }

      await transaction.commit()
      return NextResponse.json(order, { status: 201 })
    } catch (txError) {
      await transaction.rollback()
      throw txError
    }
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[POST /api/orders]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
