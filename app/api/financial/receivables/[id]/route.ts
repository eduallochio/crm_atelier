import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getPool, sql } from '@/lib/db'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { id } = await params
    const pool = await getPool()

    const valor = body.valor
      ? parseFloat(String(body.valor).replace(',', '.'))
      : undefined

    // Buscar registro atual para merge
    const current = await pool
      .request()
      .input('id', sql.UniqueIdentifier, id)
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(`SELECT * FROM org_receivables WHERE id = @id AND organization_id = @orgId`)

    if (current.recordset.length === 0) {
      return NextResponse.json({ error: 'Conta a receber não encontrada' }, { status: 404 })
    }

    const c = current.recordset[0]
    const isBeingReceived = body.status === 'recebido' && c.status !== 'recebido'
    const finalValor = valor ?? c.valor

    // Formata datas: Date objects do SQL Server precisam ser convertidos para 'YYYY-MM-DD'
    const toDateStr = (v: unknown): string | null => {
      if (!v) return null
      if (v instanceof Date) return v.toISOString().split('T')[0]
      return String(v).split('T')[0]
    }

    const transaction = new sql.Transaction(pool)
    await transaction.begin()

    try {
      const result = await new sql.Request(transaction)
        .input('id', sql.UniqueIdentifier, id)
        .input('orgId', sql.UniqueIdentifier, user.organizationId)
        .input('serviceOrderId', sql.UniqueIdentifier, body.service_order_id ?? c.service_order_id)
        .input('clientId', sql.UniqueIdentifier, body.client_id ?? c.client_id)
        .input('categoryId', sql.UniqueIdentifier, body.category_id ?? c.category_id)
        .input('paymentMethodId', sql.UniqueIdentifier, body.payment_method_id ?? c.payment_method_id)
        .input('descricao', sql.NVarChar, body.descricao ?? c.descricao)
        .input('valor', sql.Decimal(10, 2), finalValor)
        .input('dataVenc', sql.NVarChar, toDateStr(body.data_vencimento ?? c.data_vencimento))
        .input('dataReceb', sql.NVarChar, toDateStr(body.data_recebimento ?? c.data_recebimento))
        .input('status', sql.NVarChar, body.status ?? c.status)
        .input('observacoes', sql.NVarChar, body.observacoes ?? c.observacoes)
        .query(`
          UPDATE org_receivables
          SET
            service_order_id = @serviceOrderId,
            client_id = @clientId,
            category_id = @categoryId,
            payment_method_id = @paymentMethodId,
            descricao = @descricao,
            valor = @valor,
            data_vencimento = CAST(NULLIF(@dataVenc, '') AS DATE),
            data_recebimento = CAST(NULLIF(@dataReceb, '') AS DATE),
            status = @status,
            observacoes = @observacoes,
            updated_at = GETDATE()
          OUTPUT INSERTED.*
          WHERE id = @id AND organization_id = @orgId
        `)

      if (isBeingReceived) {
        const today = new Date().toISOString().split('T')[0]
        const dataRecebimento = body.data_recebimento ?? today

        // Criar transação financeira
        await new sql.Request(transaction)
          .input('orgId',          sql.UniqueIdentifier, user.organizationId)
          .input('receivableId',   sql.UniqueIdentifier, id)
          .input('paymentMethodId',sql.UniqueIdentifier, body.payment_method_id ?? c.payment_method_id)
          .input('categoryId',     sql.UniqueIdentifier, body.category_id ?? c.category_id)
          .input('descricao',      sql.NVarChar,         body.descricao ?? c.descricao)
          .input('valor',          sql.Decimal(10, 2),   finalValor)
          .input('data',           sql.NVarChar,         dataRecebimento)
          .query(`
            INSERT INTO org_transactions
              (organization_id, tipo, descricao, valor, data_transacao,
               receivable_id, payment_method_id, category_id, observacoes)
            VALUES
              (@orgId, 'entrada', @descricao, @valor, CAST(@data AS DATE),
               @receivableId, @paymentMethodId, @categoryId, 'Recebimento de conta a receber')
          `)

        // Atualizar OS vinculada (valor_pago e status_pagamento)
        if (c.service_order_id) {
          await new sql.Request(transaction)
            .input('orderId', sql.UniqueIdentifier, c.service_order_id)
            .input('valor',   sql.Decimal(10, 2),   finalValor)
            .query(`
              UPDATE org_service_orders
              SET
                valor_pago = ISNULL(valor_pago, 0) + @valor,
                status_pagamento = CASE
                  WHEN ISNULL(valor_pago, 0) + @valor >= valor_total THEN 'pago'
                  WHEN ISNULL(valor_pago, 0) + @valor > 0            THEN 'parcial'
                  ELSE 'pendente'
                END
              WHERE id = @orderId
            `)
        }
      }

      await transaction.commit()
      return NextResponse.json(result.recordset[0])
    } catch (txError) {
      await transaction.rollback()
      throw txError
    }
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[PUT /api/financial/receivables/:id]', error)
    return NextResponse.json({ error: 'Erro interno', details: (error as Error).message }, { status: 500 })
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

    // Buscar antes de deletar para restaurar OS vinculada se necessário
    const current = await pool
      .request()
      .input('id', sql.UniqueIdentifier, id)
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(`SELECT id, service_order_id, valor, status FROM org_receivables WHERE id = @id AND organization_id = @orgId`)

    if (current.recordset.length === 0) {
      return NextResponse.json({ error: 'Conta a receber não encontrada' }, { status: 404 })
    }

    const rec = current.recordset[0]
    const transaction = new sql.Transaction(pool)
    await transaction.begin()

    try {
      await new sql.Request(transaction)
        .input('id', sql.UniqueIdentifier, id)
        .input('orgId', sql.UniqueIdentifier, user.organizationId)
        .query(`DELETE FROM org_receivables WHERE id = @id AND organization_id = @orgId`)

      // Se havia OS vinculada e o receivable estava recebido, restaurar valor_pago da OS
      if (rec.service_order_id && rec.status === 'recebido') {
        await new sql.Request(transaction)
          .input('orderId', sql.UniqueIdentifier, rec.service_order_id)
          .input('valor',   sql.Decimal(10, 2),   rec.valor)
          .query(`
            UPDATE org_service_orders
            SET
              valor_pago = CASE WHEN ISNULL(valor_pago, 0) - @valor < 0 THEN 0 ELSE ISNULL(valor_pago, 0) - @valor END,
              status_pagamento = CASE
                WHEN ISNULL(valor_pago, 0) - @valor <= 0 THEN 'pendente'
                WHEN ISNULL(valor_pago, 0) - @valor < valor_total THEN 'parcial'
                ELSE 'pago'
              END
            WHERE id = @orderId
          `)
      }

      await transaction.commit()
      return new NextResponse(null, { status: 204 })
    } catch (txError) {
      await transaction.rollback()
      throw txError
    }
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[DELETE /api/financial/receivables/:id]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
