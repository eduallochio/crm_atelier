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
        SELECT
          r.id, r.organization_id, r.service_order_id, r.client_id,
          r.category_id, r.payment_method_id, r.descricao, r.valor,
          r.data_vencimento, r.data_recebimento, r.observacoes,
          r.created_at, r.updated_at,
          pm.nome AS forma_pagamento,
          CASE
            WHEN r.status = 'pendente' AND r.data_vencimento < CAST(GETDATE() AS DATE)
            THEN 'atrasado'
            ELSE r.status
          END AS status
        FROM org_receivables r
        LEFT JOIN org_payment_methods pm ON pm.id = r.payment_method_id
        WHERE r.organization_id = @orgId
        ORDER BY r.data_vencimento DESC
      `)

    return NextResponse.json(result.recordset)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[GET /api/financial/receivables]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const pool = await getPool()

    const valor = parseFloat(String(body.valor || 0).replace(',', '.'))

    const result = await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .input('serviceOrderId', sql.UniqueIdentifier, body.service_order_id || null)
      .input('clientId', sql.UniqueIdentifier, body.client_id || null)
      .input('categoryId', sql.UniqueIdentifier, body.category_id || null)
      .input('paymentMethodId', sql.UniqueIdentifier, body.payment_method_id || null)
      .input('descricao', sql.NVarChar, body.descricao)
      .input('valor', sql.Decimal(10, 2), valor)
      .input('dataVenc', sql.NVarChar, body.data_vencimento)
      .input('dataReceb', sql.NVarChar, body.data_recebimento || null)
      .input('status', sql.NVarChar, body.status || 'pendente')
      .input('observacoes', sql.NVarChar, body.observacoes || null)
      .query(`
        INSERT INTO org_receivables (
          organization_id, service_order_id, client_id, category_id, payment_method_id,
          descricao, valor, data_vencimento, data_recebimento, status, observacoes
        )
        OUTPUT INSERTED.*
        VALUES (
          @orgId, @serviceOrderId, @clientId, @categoryId, @paymentMethodId,
          @descricao, @valor,
          CAST(@dataVenc AS DATE),
          CAST(NULLIF(@dataReceb, '') AS DATE),
          @status, @observacoes
        )
      `)

    return NextResponse.json(result.recordset[0], { status: 201 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[POST /api/financial/receivables]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
