import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgCashierMovements } from '@/lib/db/schema'
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
      .select()
      .from(orgCashierMovements)
      .where(
        and(
          eq(orgCashierMovements.sessaoId, id),
          eq(orgCashierMovements.organizationId, user.organizationId)
        )
      )
      .orderBy(desc(orgCashierMovements.createdAt))

    return NextResponse.json(rows)
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
        organizationId: user.organizationId,
        sessaoId: id,
        tipo: body.tipo,
        valor: String(body.valor),
        descricao: body.descricao,
        observacoes: body.observacoes ?? null,
      })
      .returning()

    return NextResponse.json(row, { status: 201 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[POST /api/cashiers/sessions/:id/movements]', error); console.error('[POST /api/cashiers/sessions/:id/movements]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
