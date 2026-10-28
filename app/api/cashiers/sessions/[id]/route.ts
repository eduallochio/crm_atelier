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
        saldoEsperado: orgCashierSessions.saldoEsperado,
        diferenca: orgCashierSessions.diferenca,
        usuarioFechamentoId: orgCashierSessions.usuarioFechamentoId,
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
    return NextResponse.json({
      id:                    r.id,
      organization_id:       r.organizationId,
      caixa_id:              r.caixaId,
      usuario_abertura_id:   r.usuarioAberturaId,
      data_abertura:         r.dataAbertura,
      data_fechamento:       r.dataFechamento,
      saldo_inicial:         r.saldoInicial,
      saldo_real:            r.saldoReal,
      saldo_esperado:        r.saldoEsperado,
      diferenca:             r.diferenca,
      usuario_fechamento_id: r.usuarioFechamentoId,
      status:                r.status,
      observacoes_abertura:  r.observacoesAbertura,
      observacoes_fechamento: r.observacoesFechamento,
      created_at:            r.createdAt,
      updated_at:            r.updatedAt,
      org_cashiers:          { nome: r.caixa_nome },
    })
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
    const saldoReal = body.saldo_real != null ? Number(body.saldo_real) : null
    const saldoEsperado = body.saldo_esperado != null ? Number(body.saldo_esperado) : null

    const [row] = await db
      .update(orgCashierSessions)
      .set({
        status: body.status,
        saldoReal: saldoReal != null ? String(saldoReal) : null,
        saldoEsperado: saldoEsperado != null ? String(saldoEsperado) : null,
        diferenca: (saldoReal != null && saldoEsperado != null) ? String(saldoReal - saldoEsperado) : null,
        dataFechamento: isClosing ? new Date() : null,
        observacoesFechamento: body.observacoes_fechamento ?? null,
        // Quem fechou o caixa — ficava sem gravar, mesmo já tendo o usuário
        // autenticado na mão; útil para auditoria em equipes com + de 1 usuário
        ...(isClosing ? { usuarioFechamentoId: user.id } : {}),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(orgCashierSessions.id, id),
          eq(orgCashierSessions.organizationId, user.organizationId),
          // Ao fechar, exige que ainda esteja aberta — sem isso, duas abas (ou um
          // retry) fechando a mesma sessão em paralelo sobrescrevem silenciosamente
          // o saldo_real/diferença um do outro, sem erro para nenhuma delas
          ...(isClosing ? [eq(orgCashierSessions.status, 'aberto')] : []),
        )
      )
      .returning()

    if (!row) {
      if (isClosing) {
        return NextResponse.json({ error: 'Esta sessão já foi fechada' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 })
    }

    return NextResponse.json({
      id:                     row.id,
      organization_id:        row.organizationId,
      caixa_id:               row.caixaId,
      usuario_abertura_id:    row.usuarioAberturaId,
      data_abertura:          row.dataAbertura,
      data_fechamento:        row.dataFechamento,
      saldo_inicial:          row.saldoInicial,
      saldo_real:             row.saldoReal,
      saldo_esperado:         row.saldoEsperado,
      diferenca:              row.diferenca,
      usuario_fechamento_id:  row.usuarioFechamentoId,
      status:                 row.status,
      observacoes_abertura:   row.observacoesAbertura,
      observacoes_fechamento: row.observacoesFechamento,
      created_at:             row.createdAt,
      updated_at:             row.updatedAt,
    })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[PUT /api/cashiers/sessions/:id]', error); console.error('[PUT /api/cashiers/sessions/:id]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
