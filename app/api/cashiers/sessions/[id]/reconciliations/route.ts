import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgCashierReconciliations } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const rows = await db
      .select()
      .from(orgCashierReconciliations)
      .where(
        and(
          eq(orgCashierReconciliations.sessaoId, id),
          eq(orgCashierReconciliations.organizationId, user.organizationId)
        )
      )

    return NextResponse.json(rows)
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

    const items: Array<{
      metodo_pagamento_id: string
      valor_esperado: number
      valor_informado: number
      observacoes?: string
    }> = Array.isArray(body) ? body : [body]

    const values = items.map((item) => ({
      organizationId: user.organizationId,
      sessaoId: id,
      metodoPagamentoId: item.metodo_pagamento_id,
      valorEsperado: String(item.valor_esperado ?? 0),
      valorInformado: String(item.valor_informado ?? 0),
      diferenca: String((item.valor_informado ?? 0) - (item.valor_esperado ?? 0)),
      observacoes: item.observacoes ?? null,
    }))

    const results = await db
      .insert(orgCashierReconciliations)
      .values(values)
      .returning()

    return NextResponse.json(results, { status: 201 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[POST /api/cashiers/sessions/:id/reconciliations]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
