import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgCashierMovements, orgPaymentMethods } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
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
    const body = await request.json()
    const { id } = await params

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
    logServerError('[POST /api/cashiers/sessions/:id/movements]', error); console.error('[POST /api/cashiers/sessions/:id/movements]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
