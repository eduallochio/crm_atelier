import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgCashierSessions, orgCashiers } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const rows = await db
      .select({
        id: orgCashierSessions.id,
        organizationId: orgCashierSessions.organizationId,
        caixaId: orgCashierSessions.caixaId,
        usuarioAberturaId: orgCashierSessions.usuarioAberturaId,
        dataAbertura: orgCashierSessions.dataAbertura,
        dataFechamento: orgCashierSessions.dataFechamento,
        saldoInicial: orgCashierSessions.saldoInicial,
        saldoReal: orgCashierSessions.saldoReal,
        status: orgCashierSessions.status,
        observacoesAbertura: orgCashierSessions.observacoesAbertura,
        observacoesFechamento: orgCashierSessions.observacoesFechamento,
        createdAt: orgCashierSessions.createdAt,
        updatedAt: orgCashierSessions.updatedAt,
        caixa_nome: orgCashiers.nome,
      })
      .from(orgCashierSessions)
      .leftJoin(orgCashiers, eq(orgCashiers.id, orgCashierSessions.caixaId))
      .where(
        and(
          eq(orgCashierSessions.id, id),
          eq(orgCashierSessions.organizationId, user.organizationId)
        )
      )

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 })
    }

    const r = rows[0]
    return NextResponse.json({ ...r, org_cashiers: { nome: r.caixa_nome } })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[GET /api/cashiers/sessions/:id]', error); console.error('[GET /api/cashiers/sessions/:id]', error)
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

    const isClosing = body.status === 'fechado'

    const [row] = await db
      .update(orgCashierSessions)
      .set({
        status: body.status,
        saldoReal: body.saldo_real != null ? String(body.saldo_real) : null,
        dataFechamento: isClosing ? new Date() : null,
        observacoesFechamento: body.observacoes_fechamento ?? null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(orgCashierSessions.id, id),
          eq(orgCashierSessions.organizationId, user.organizationId)
        )
      )
      .returning()

    if (!row) {
      return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 })
    }

    return NextResponse.json(row)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[PUT /api/cashiers/sessions/:id]', error); console.error('[PUT /api/cashiers/sessions/:id]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
