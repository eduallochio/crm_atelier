import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getPool, sql } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    const pool = await getPool()
    const { searchParams } = new URL(request.url)
    const caixaId = searchParams.get('caixa_id')
    const status = searchParams.get('status')

    let query = `
      SELECT s.*, c.nome AS caixa_nome
      FROM org_cashier_sessions s
      LEFT JOIN org_cashiers c ON c.id = s.caixa_id
      WHERE s.organization_id = @orgId
    `
    const req = pool.request().input('orgId', sql.UniqueIdentifier, user.organizationId)

    if (caixaId) {
      query += ' AND s.caixa_id = @caixaId'
      req.input('caixaId', sql.UniqueIdentifier, caixaId)
    }
    if (status) {
      query += ' AND s.status = @status'
      req.input('status', sql.NVarChar, status)
    }

    query += ' ORDER BY s.data_abertura DESC'

    const result = await req.query(query)

    // Mapear caixa_nome para formato compatível com CashierSessionWithRelations
    const rows = result.recordset.map((r: Record<string, unknown>) => ({
      ...r,
      org_cashiers: { nome: r.caixa_nome },
    }))

    return NextResponse.json(rows)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[GET /api/cashiers/sessions]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const pool = await getPool()

    const result = await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .input('caixaId', sql.UniqueIdentifier, body.caixa_id)
      .input('usuarioAberturaId', sql.UniqueIdentifier, user.id || null)
      .input('saldoInicial', sql.Decimal(10, 2), body.saldo_inicial ?? 0)
      .input('observacoesAbertura', sql.NVarChar, body.observacoes_abertura || null)
      .query(`
        INSERT INTO org_cashier_sessions (
          organization_id, caixa_id, usuario_abertura_id,
          saldo_inicial, status, observacoes_abertura
        )
        OUTPUT INSERTED.*
        VALUES (
          @orgId, @caixaId, @usuarioAberturaId,
          @saldoInicial, 'aberto', @observacoesAbertura
        )
      `)

    return NextResponse.json(result.recordset[0], { status: 201 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[POST /api/cashiers/sessions]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
