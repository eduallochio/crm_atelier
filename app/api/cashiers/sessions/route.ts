import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgCashierSessions, orgCashiers } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const caixaId = searchParams.get('caixa_id')
    const status = searchParams.get('status')

    const conditions = [eq(orgCashierSessions.organizationId, user.organizationId)]
    if (caixaId) conditions.push(eq(orgCashierSessions.caixaId, caixaId))
    if (status) conditions.push(eq(orgCashierSessions.status, status))

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
      .where(and(...conditions))
      .orderBy(desc(orgCashierSessions.dataAbertura))

    const mapped = rows.map((r) => ({
      ...r,
      org_cashiers: { nome: r.caixa_nome },
    }))

    return NextResponse.json(mapped)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[GET /api/cashiers/sessions]', error); console.error('[GET /api/cashiers/sessions]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const [row] = await db
      .insert(orgCashierSessions)
      .values({
        organizationId: user.organizationId,
        caixaId: body.caixa_id,
        usuarioAberturaId: user.id ?? null,
        saldoInicial: String(body.saldo_inicial ?? 0),
        status: 'aberto',
        observacoesAbertura: body.observacoes_abertura ?? null,
      })
      .returning()

    return NextResponse.json(row, { status: 201 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[POST /api/cashiers/sessions]', error); console.error('[POST /api/cashiers/sessions]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
