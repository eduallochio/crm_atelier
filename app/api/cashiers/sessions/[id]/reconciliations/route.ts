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

    const result = await pool
      .request()
      .input('sessaoId', sql.UniqueIdentifier, id)
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(`
        SELECT * FROM org_cashier_reconciliations
        WHERE sessao_id = @sessaoId AND organization_id = @orgId
      `)

    return NextResponse.json(result.recordset)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[GET /api/cashiers/sessions/:id/reconciliations]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { id } = await params
    const pool = await getPool()

    // body é um array de itens de conferência
    const items: Array<{
      metodo_pagamento_id: string
      valor_esperado: number
      valor_informado: number
      observacoes?: string
    }> = Array.isArray(body) ? body : [body]

    const results = []
    for (const item of items) {
      const diferenca = (item.valor_informado ?? 0) - (item.valor_esperado ?? 0)
      const r = await pool
        .request()
        .input('orgId', sql.UniqueIdentifier, user.organizationId)
        .input('sessaoId', sql.UniqueIdentifier, id)
        .input('metodoPagamentoId', sql.UniqueIdentifier, item.metodo_pagamento_id)
        .input('valorEsperado', sql.Decimal(10, 2), item.valor_esperado ?? 0)
        .input('valorInformado', sql.Decimal(10, 2), item.valor_informado ?? 0)
        .input('diferenca', sql.Decimal(10, 2), diferenca)
        .input('observacoes', sql.NVarChar, item.observacoes || null)
        .query(`
          INSERT INTO org_cashier_reconciliations (
            organization_id, sessao_id, metodo_pagamento_id,
            valor_esperado, valor_informado, diferenca, observacoes
          )
          OUTPUT INSERTED.*
          VALUES (
            @orgId, @sessaoId, @metodoPagamentoId,
            @valorEsperado, @valorInformado, @diferenca, @observacoes
          )
        `)
      results.push(r.recordset[0])
    }

    return NextResponse.json(results, { status: 201 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[POST /api/cashiers/sessions/:id/reconciliations]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
