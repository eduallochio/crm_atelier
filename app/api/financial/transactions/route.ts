import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getPool, sql } from '@/lib/db'

export async function GET() {
  try {
    const user = await requireAuth()
    const pool = await getPool()

    const result = await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(`
        SELECT *, data_transacao AS data FROM org_transactions
        WHERE organization_id = @orgId
        ORDER BY data_transacao DESC
      `)

    return NextResponse.json(result.recordset)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[GET /api/financial/transactions]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const pool = await getPool()

    const valor = parseFloat(String(body.valor).replace(',', '.'))

    const result = await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .input('tipo', sql.NVarChar, body.tipo)
      .input('descricao', sql.NVarChar, body.descricao)
      .input('valor', sql.Decimal(10, 2), valor)
      .input('dataTransacao', sql.NVarChar, body.data_transacao)
      .input('categoryId', sql.UniqueIdentifier, body.category_id || null)
      .input('paymentMethodId', sql.UniqueIdentifier, body.payment_method_id || null)
      .input('receivableId', sql.UniqueIdentifier, body.receivable_id || null)
      .input('payableId', sql.UniqueIdentifier, body.payable_id || null)
      .input('observacoes', sql.NVarChar, body.observacoes || null)
      .query(`
        INSERT INTO org_transactions (
          organization_id, tipo, descricao, valor, data_transacao,
          category_id, payment_method_id, receivable_id, payable_id, observacoes
        )
        OUTPUT INSERTED.*
        VALUES (
          @orgId, @tipo, @descricao, @valor,
          CAST(@dataTransacao AS DATE),
          @categoryId, @paymentMethodId, @receivableId, @payableId, @observacoes
        )
      `)

    return NextResponse.json(result.recordset[0], { status: 201 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[POST /api/financial/transactions]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
