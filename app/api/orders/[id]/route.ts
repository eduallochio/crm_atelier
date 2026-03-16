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

    const orderResult = await pool
      .request()
      .input('id', sql.UniqueIdentifier, id)
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
        WHERE o.id = @id AND o.organization_id = @orgId
      `)

    if (orderResult.recordset.length === 0) {
      return NextResponse.json({ error: 'Ordem não encontrada' }, { status: 404 })
    }

    const itemsResult = await pool
      .request()
      .input('orderId', sql.UniqueIdentifier, id)
      .query(`SELECT * FROM org_service_order_items WHERE order_id = @orderId`)

    const row = orderResult.recordset[0]
    const order = {
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
      items: itemsResult.recordset,
    }

    return NextResponse.json(order)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[GET /api/orders/:id]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { id } = await params
    const pool = await getPool()

    const transaction = new sql.Transaction(pool)
    await transaction.begin()

    try {
      // Buscar dados atuais da ordem
      const orderResult = await new sql.Request(transaction)
        .input('id', sql.UniqueIdentifier, id)
        .input('orgId', sql.UniqueIdentifier, user.organizationId)
        .query(`
          SELECT o.*, c.nome AS client_nome
          FROM org_service_orders o
          LEFT JOIN org_clients c ON c.id = o.client_id
          WHERE o.id = @id AND o.organization_id = @orgId
        `)

      if (orderResult.recordset.length === 0) {
        await transaction.rollback()
        return NextResponse.json({ error: 'Ordem não encontrada' }, { status: 404 })
      }

      const order = orderResult.recordset[0]
      const finalStatus = body.status ?? order.status
      const isBeingConcluded = body.status === 'concluido' && order.status !== 'concluido'
      const isBeingReopened = order.status === 'concluido' && body.status && body.status !== 'concluido'

      // Merge: só sobrescreve campos que vieram explicitamente no body
      const toDateStr = (v: unknown): string | null => {
        if (!v) return null
        if (v instanceof Date) return v.toISOString().split('T')[0]
        return String(v).split('T')[0]
      }

      const finalDataPrevista = 'data_prevista' in body
        ? (body.data_prevista || null)
        : toDateStr(order.data_prevista)
      const finalObservacoes = 'observacoes' in body
        ? (body.observacoes ?? null)
        : order.observacoes
      const finalNotasInternas = 'notas_internas' in body
        ? (body.notas_internas ?? null)
        : order.notas_internas
      const finalFormaPagamento = 'forma_pagamento' in body
        ? (body.forma_pagamento ?? null)
        : order.forma_pagamento

      // Atualizar a ordem
      const updateResult = await new sql.Request(transaction)
        .input('id', sql.UniqueIdentifier, id)
        .input('orgId', sql.UniqueIdentifier, user.organizationId)
        .input('status', sql.NVarChar, finalStatus)
        .input('dataPrevista', sql.NVarChar, finalDataPrevista)
        .input('observacoes', sql.NVarChar, finalObservacoes)
        .input('notasInternas', sql.NVarChar, finalNotasInternas)
        .input('formaPagamento', sql.NVarChar, finalFormaPagamento)
        .input('setConclusao', sql.Bit, isBeingConcluded ? 1 : 0)
        .input('clearConclusao', sql.Bit, isBeingReopened ? 1 : 0)
        .input('dataConclusao', sql.DateTime2, isBeingConcluded ? new Date() : null)
        .query(`
          UPDATE org_service_orders
          SET
            status = @status,
            data_prevista = CAST(NULLIF(@dataPrevista, '') AS DATE),
            observacoes = @observacoes,
            notas_internas = @notasInternas,
            forma_pagamento = @formaPagamento,
            data_conclusao = CASE
              WHEN @setConclusao = 1 THEN @dataConclusao
              WHEN @clearConclusao = 1 THEN NULL
              ELSE data_conclusao
            END
          OUTPUT INSERTED.*
          WHERE id = @id AND organization_id = @orgId
        `)

      const updatedOrder = updateResult.recordset[0]

      // Criar conta a receber se a OS está concluída (atual ou agora) e ainda não existe receivable
      if (finalStatus === 'concluido') {
        const existingResult = await new sql.Request(transaction)
          .input('orderId', sql.UniqueIdentifier, id)
          .query(`SELECT id FROM org_receivables WHERE service_order_id = @orderId`)

        const saldoRestante = (order.valor_total || 0) - (order.valor_pago || 0)

        if (existingResult.recordset.length === 0 && saldoRestante > 0) {
          const dataVencimento = new Date()
          dataVencimento.setDate(dataVencimento.getDate() + 7)
          const dataVencStr = dataVencimento.toISOString().split('T')[0]

          await new sql.Request(transaction)
            .input('orgId', sql.UniqueIdentifier, user.organizationId)
            .input('orderId', sql.UniqueIdentifier, id)
            .input('clientId', sql.UniqueIdentifier, order.client_id || null)
            .input('descricao', sql.NVarChar, `OS #${order.numero} - ${order.client_nome || 'Cliente'}`)
            .input('valor', sql.Decimal(10, 2), saldoRestante)
            .input('dataVenc', sql.NVarChar, dataVencStr)
            .query(`
              INSERT INTO org_receivables
                (organization_id, service_order_id, client_id, descricao, valor, data_vencimento, status, observacoes)
              VALUES
                (@orgId, @orderId, @clientId, @descricao, @valor, CAST(@dataVenc AS DATE),
                 'pendente', 'Gerado automaticamente na conclusão da ordem de serviço')
            `)
        }
      }

      // Criar saída de estoque se: (1) está sendo concluída agora, (2) controle de estoque ativo,
      // (3) há materiais cadastrados e (4) saída ainda não existe para esta OS
      if (isBeingConcluded) {
        const prefCheck = await new sql.Request(transaction)
          .input('orgId', sql.UniqueIdentifier, user.organizationId)
          .query(`SELECT controla_estoque FROM org_system_preferences WHERE organization_id = @orgId`)

        const controlaEstoque = !!prefCheck.recordset[0]?.controla_estoque

        if (controlaEstoque) {
          // mssql não suporta requests paralelos na mesma transação — usar sequencial
          const materiaisResult = await new sql.Request(transaction)
            .input('orderId', sql.UniqueIdentifier, id)
            .query(`SELECT * FROM org_order_materials WHERE order_id = @orderId`)

          const exitExists = await new sql.Request(transaction)
            .input('orderId', sql.UniqueIdentifier, id)
            .query(`SELECT id FROM org_stock_exits WHERE service_order_id = @orderId`)

          const materiais = materiaisResult.recordset.filter(m => m.product_id)

          if (materiais.length > 0 && exitExists.recordset.length === 0) {
            const exitResult = await new sql.Request(transaction)
              .input('orgId', sql.UniqueIdentifier, user.organizationId)
              .input('orderId', sql.UniqueIdentifier, id)
              .input('obs', sql.NVarChar(sql.MAX), `Saída automática - OS #${order.numero}`)
              .query(`
                INSERT INTO org_stock_exits (organization_id, service_order_id, tipo, observacoes)
                OUTPUT INSERTED.id
                VALUES (@orgId, @orderId, 'ordem_servico', @obs)
              `)

            const exitId = exitResult.recordset[0].id

            for (const m of materiais) {
              await new sql.Request(transaction)
                .input('exitId', sql.UniqueIdentifier, exitId)
                .input('productId', sql.UniqueIdentifier, m.product_id)
                .input('produtoNome', sql.NVarChar(255), m.produto_nome)
                .input('quantidade', sql.Decimal(10, 3), Number(m.quantidade))
                .input('unidade', sql.NVarChar(20), m.unidade || 'un')
                .query(`
                  INSERT INTO org_stock_exit_items (exit_id, product_id, produto_nome, quantidade, unidade)
                  VALUES (@exitId, @productId, @produtoNome, @quantidade, @unidade)
                `)
            }
          }
        }
      }

      await transaction.commit()
      return NextResponse.json(updatedOrder)
    } catch (txError) {
      await transaction.rollback()
      throw txError
    }
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[PUT /api/orders/:id]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const pool = await getPool()

    // Items, history e notes são deletados por CASCADE
    const result = await pool
      .request()
      .input('id', sql.UniqueIdentifier, id)
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(`
        DELETE FROM org_service_orders
        OUTPUT DELETED.id
        WHERE id = @id AND organization_id = @orgId
      `)

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: 'Ordem não encontrada' }, { status: 404 })
    }

    // Atualizar métricas
    await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(`
        UPDATE usage_metrics
        SET orders_count = CASE WHEN orders_count > 0 THEN orders_count - 1 ELSE 0 END,
            updated_at = GETDATE()
        WHERE organization_id = @orgId
      `)

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[DELETE /api/orders/:id]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
