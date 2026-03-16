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
          p.id, p.organization_id, p.supplier_id, p.category_id,
          p.descricao, p.valor, p.data_vencimento, p.data_pagamento,
          p.categoria, p.forma_pagamento, p.observacoes,
          p.created_at, p.updated_at,
          s.nome AS fornecedor,
          CASE
            WHEN p.status = 'pendente' AND p.data_vencimento < CAST(GETDATE() AS DATE)
            THEN 'atrasado'
            ELSE p.status
          END AS status
        FROM org_payables p
        LEFT JOIN org_suppliers s ON s.id = p.supplier_id
        WHERE p.organization_id = @orgId
        ORDER BY p.data_vencimento DESC
      `)

    return NextResponse.json(result.recordset)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[GET /api/financial/payables]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const pool = await getPool()

    const valor = parseFloat(String(body.valor || 0).replace(',', '.'))
    const supplierId = body.supplier_id && body.supplier_id !== 'sem-fornecedor'
      ? body.supplier_id
      : null
    const categoryId = body.category_id || null

    const result = await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .input('supplierId', sql.UniqueIdentifier, supplierId)
      .input('categoryId', sql.UniqueIdentifier, categoryId)
      .input('descricao', sql.NVarChar, body.descricao)
      .input('valor', sql.Decimal(10, 2), valor)
      .input('dataVenc', sql.NVarChar, body.data_vencimento)
      .input('dataPag', sql.NVarChar, body.data_pagamento || null)
      .input('status', sql.NVarChar, body.status || 'pendente')
      .input('categoria', sql.NVarChar, body.categoria || null)
      .input('formaPagamento', sql.NVarChar, body.forma_pagamento || null)
      .input('observacoes', sql.NVarChar, body.observacoes || null)
      .query(`
        INSERT INTO org_payables (
          organization_id, supplier_id, category_id, descricao, valor,
          data_vencimento, data_pagamento, status, categoria, forma_pagamento, observacoes
        )
        OUTPUT INSERTED.*
        VALUES (
          @orgId, @supplierId, @categoryId, @descricao, @valor,
          CAST(@dataVenc AS DATE),
          CAST(NULLIF(@dataPag, '') AS DATE),
          @status, @categoria, @formaPagamento, @observacoes
        )
      `)

    return NextResponse.json(result.recordset[0], { status: 201 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[POST /api/financial/payables]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
