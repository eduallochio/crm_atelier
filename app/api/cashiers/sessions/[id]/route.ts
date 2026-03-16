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
      .input('id', sql.UniqueIdentifier, id)
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(`
        SELECT s.*, c.nome AS caixa_nome
        FROM org_cashier_sessions s
        LEFT JOIN org_cashiers c ON c.id = s.caixa_id
        WHERE s.id = @id AND s.organization_id = @orgId
      `)

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 })
    }

    const r = result.recordset[0]
    return NextResponse.json({ ...r, org_cashiers: { nome: r.caixa_nome } })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[GET /api/cashiers/sessions/:id]', error)
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

    const isClosing = body.status === 'fechado'

    const result = await pool
      .request()
      .input('id', sql.UniqueIdentifier, id)
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .input('status', sql.NVarChar, body.status)
      .input('saldoReal', sql.Decimal(10, 2), body.saldo_real ?? null)
      .input('saldoEsperado', sql.Decimal(10, 2), body.saldo_esperado ?? null)
      .input('diferenca', sql.Decimal(10, 2), body.diferenca ?? null)
      .input('dataFechamento', sql.DateTime2, isClosing ? new Date() : null)
      .input('observacoesFechamento', sql.NVarChar, body.observacoes_fechamento || null)
      .query(`
        UPDATE org_cashier_sessions
        SET
          status = @status,
          saldo_real = @saldoReal,
          saldo_esperado = @saldoEsperado,
          diferenca = @diferenca,
          data_fechamento = @dataFechamento,
          observacoes_fechamento = @observacoesFechamento,
          updated_at = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = @id AND organization_id = @orgId
      `)

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 })
    }

    return NextResponse.json(result.recordset[0])
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[PUT /api/cashiers/sessions/:id]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
