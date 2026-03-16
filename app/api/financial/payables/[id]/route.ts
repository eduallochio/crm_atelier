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

    // Buscar registro atual para merge
    const current = await pool
      .request()
      .input('id', sql.UniqueIdentifier, id)
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(`SELECT * FROM org_payables WHERE id = @id AND organization_id = @orgId`)

    if (current.recordset.length === 0) {
      return NextResponse.json({ error: 'Conta a pagar não encontrada' }, { status: 404 })
    }

    const c = current.recordset[0]
    const valor = body.valor
      ? parseFloat(String(body.valor).replace(',', '.'))
      : c.valor

    const toDateStr = (v: unknown): string | null => {
      if (!v) return null
      if (v instanceof Date) return v.toISOString().split('T')[0]
      return String(v).split('T')[0]
    }

    const isBeingPaid = body.status === 'pago' && c.status !== 'pago'
    const finalValor = valor

    const supplierId = body.supplier_id !== undefined
      ? (body.supplier_id && body.supplier_id !== 'sem-fornecedor' ? body.supplier_id : null)
      : c.supplier_id

    const categoryId = body.category_id !== undefined
      ? (body.category_id || null)
      : c.category_id

    const transaction = new sql.Transaction(pool)
    await transaction.begin()

    try {
      const result = await new sql.Request(transaction)
        .input('id', sql.UniqueIdentifier, id)
        .input('orgId', sql.UniqueIdentifier, user.organizationId)
        .input('supplierId', sql.UniqueIdentifier, supplierId)
        .input('categoryId', sql.UniqueIdentifier, categoryId)
        .input('descricao', sql.NVarChar, body.descricao ?? c.descricao)
        .input('valor', sql.Decimal(10, 2), finalValor)
        .input('dataVenc', sql.NVarChar, toDateStr(body.data_vencimento ?? c.data_vencimento))
        .input('dataPag', sql.NVarChar, toDateStr(body.data_pagamento ?? c.data_pagamento))
        .input('status', sql.NVarChar, body.status ?? c.status)
        .input('categoria', sql.NVarChar, body.categoria ?? c.categoria)
        .input('formaPagamento', sql.NVarChar, body.forma_pagamento ?? c.forma_pagamento)
        .input('observacoes', sql.NVarChar, body.observacoes ?? c.observacoes)
        .query(`
          UPDATE org_payables
          SET
            supplier_id = @supplierId,
            category_id = @categoryId,
            descricao = @descricao,
            valor = @valor,
            data_vencimento = CAST(NULLIF(@dataVenc, '') AS DATE),
            data_pagamento = CAST(NULLIF(@dataPag, '') AS DATE),
            status = @status,
            categoria = @categoria,
            forma_pagamento = @formaPagamento,
            observacoes = @observacoes,
            updated_at = GETDATE()
          OUTPUT INSERTED.*
          WHERE id = @id AND organization_id = @orgId
        `)

      // Se está sendo marcada como paga, criar transação financeira de saída
      if (isBeingPaid) {
        // Usa data do body se disponível; caso contrário usa GETDATE() no SQL (timezone do servidor)
        const dataPagamento = toDateStr(body.data_pagamento)

        await new sql.Request(transaction)
          .input('orgId',          sql.UniqueIdentifier, user.organizationId)
          .input('payableId',      sql.UniqueIdentifier, id)
          .input('categoryId',     sql.UniqueIdentifier, categoryId)
          .input('descricao',      sql.NVarChar,         body.descricao ?? c.descricao)
          .input('valor',          sql.Decimal(10, 2),   finalValor)
          .input('data',           sql.NVarChar,         dataPagamento)
          .query(`
            INSERT INTO org_transactions
              (organization_id, tipo, descricao, valor, data_transacao,
               payable_id, category_id, observacoes)
            VALUES
              (@orgId, 'saida', @descricao, @valor,
               CASE WHEN @data IS NOT NULL THEN CAST(@data AS DATE) ELSE CAST(GETDATE() AS DATE) END,
               @payableId, @categoryId, 'Pagamento de conta a pagar')
          `)
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
    console.error('[PUT /api/financial/payables/:id]', error)
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

    const transaction = new sql.Transaction(pool)
    await transaction.begin()

    try {
      // Se payable estava pago, remove a transação financeira vinculada
      await new sql.Request(transaction)
        .input('payableId', sql.UniqueIdentifier, id)
        .query(`DELETE FROM org_transactions WHERE payable_id = @payableId`)

      const result = await new sql.Request(transaction)
        .input('id', sql.UniqueIdentifier, id)
        .input('orgId', sql.UniqueIdentifier, user.organizationId)
        .query(`
          DELETE FROM org_payables
          OUTPUT DELETED.id
          WHERE id = @id AND organization_id = @orgId
        `)

      if (result.recordset.length === 0) {
        await transaction.rollback()
        return NextResponse.json({ error: 'Conta a pagar não encontrada' }, { status: 404 })
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
    console.error('[DELETE /api/financial/payables/:id]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
