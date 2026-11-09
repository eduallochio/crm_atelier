import { NextResponse } from 'next/server'
import { requireAuth, assertPermission } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgCashierMovements, orgPaymentMethods, orgCashierSessions } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'
import { requireProPlan } from '@/lib/plan-limits'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    assertPermission(user, 'ordens_servico')
    await requireProPlan(user.organizationId)
    const { id } = await params

    const rows = await db
      .select({
        id:              orgCashierMovements.id,
        organizationId:  orgCashierMovements.organizationId,
        sessaoId:        orgCashierMovements.sessaoId,
        tipo:            orgCashierMovements.tipo,
        valor:           orgCashierMovements.valor,
        descricao:       orgCashierMovements.descricao,
        observacoes:     orgCashierMovements.observacoes,
        createdAt:       orgCashierMovements.createdAt,
        paymentMethodName: orgPaymentMethods.nome,
      })
      .from(orgCashierMovements)
      .leftJoin(orgPaymentMethods, eq(orgPaymentMethods.id, orgCashierMovements.metodoPagamentoId))
      .where(
        and(
          eq(orgCashierMovements.sessaoId, id),
          eq(orgCashierMovements.organizationId, user.organizationId)
        )
      )
      .orderBy(desc(orgCashierMovements.createdAt))

    return NextResponse.json(rows.map(r => ({
      id:               r.id,
      organization_id:  r.organizationId,
      sessao_id:        r.sessaoId,
      tipo:             r.tipo,
      valor:            r.valor,
      descricao:        r.descricao,
      observacoes:      r.observacoes,
      created_at:       r.createdAt,
      forma_pagamento:  r.paymentMethodName,
    })))
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    if ((error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Recurso disponível apenas no plano pago' }, { status: 403 })
    }
    logServerError('[GET /api/cashiers/sessions/:id/movements]', error); console.error('[GET /api/cashiers/sessions/:id/movements]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    assertPermission(user, 'ordens_servico')
    await requireProPlan(user.organizationId)
    const body = await request.json()
    const { id } = await params

    // Confirma que a sessão existe, pertence a esta org e está aberta — sem
    // isso, um sessaoId de outra organização seria aceito, e a movimentação
    // poderia contaminar o saldoEsperado calculado no close-all dessa org
    const [session] = await db
      .select({ id: orgCashierSessions.id, status: orgCashierSessions.status })
      .from(orgCashierSessions)
      .where(and(eq(orgCashierSessions.id, id), eq(orgCashierSessions.organizationId, user.organizationId)))
      .limit(1)
    if (!session) {
      return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 })
    }
    if (session.status !== 'aberto') {
      return NextResponse.json({ error: 'Sessão de caixa não está aberta' }, { status: 409 })
    }

    const valorNumerico = Number(body.valor)
    if (!Number.isFinite(valorNumerico) || valorNumerico <= 0) {
      return NextResponse.json({ error: 'Valor deve ser maior que zero' }, { status: 400 })
    }
    const tiposValidos = ['entrada', 'saida', 'sangria', 'reforco']
    if (!tiposValidos.includes(body.tipo)) {
      return NextResponse.json({ error: 'Tipo de movimentação inválido' }, { status: 400 })
    }

    // Valida que o método de pagamento informado pertence a esta org — sem
    // isso, um metodo_pagamento_id de outra organização seria aceito e a
    // movimentação ficaria associada a um método de pagamento fora do tenant
    if (body.metodo_pagamento_id) {
      const [owned] = await db
        .select({ id: orgPaymentMethods.id })
        .from(orgPaymentMethods)
        .where(and(eq(orgPaymentMethods.id, body.metodo_pagamento_id), eq(orgPaymentMethods.organizationId, user.organizationId)))
        .limit(1)
      if (!owned) {
        return NextResponse.json({ error: 'Método de pagamento não encontrado' }, { status: 400 })
      }
    }

    const [row] = await db
      .insert(orgCashierMovements)
      .values({
        organizationId:    user.organizationId,
        sessaoId:          id,
        tipo:              body.tipo,
        valor:             String(body.valor),
        descricao:         body.descricao,
        metodoPagamentoId: body.metodo_pagamento_id || null,
        usuarioId:         user.id,
        observacoes:       body.observacoes ?? null,
      })
      .returning()

    return NextResponse.json({
      id:                 row.id,
      organization_id:    row.organizationId,
      sessao_id:          row.sessaoId,
      tipo:               row.tipo,
      valor:              row.valor,
      descricao:          row.descricao,
      payment_method_id:  row.metodoPagamentoId,
      usuario_id:         row.usuarioId,
      observacoes:        row.observacoes,
      created_at:         row.createdAt,
    }, { status: 201 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    if ((error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Recurso disponível apenas no plano pago' }, { status: 403 })
    }
    logServerError('[POST /api/cashiers/sessions/:id/movements]', error); console.error('[POST /api/cashiers/sessions/:id/movements]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
