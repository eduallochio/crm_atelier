import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgCashiers } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { id } = await params

    const [row] = await db
      .update(orgCashiers)
      .set({
        nome: body.nome,
        descricao: body.descricao ?? null,
        ativo: body.ativo !== false,
        updatedAt: new Date(),
      })
      .where(and(eq(orgCashiers.id, id), eq(orgCashiers.organizationId, user.organizationId)))
      .returning()

    if (!row) {
      return NextResponse.json({ error: 'Caixa não encontrado' }, { status: 404 })
    }

    return NextResponse.json(row)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[PUT /api/cashiers/:id]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const [row] = await db
      .delete(orgCashiers)
      .where(and(eq(orgCashiers.id, id), eq(orgCashiers.organizationId, user.organizationId)))
      .returning({ id: orgCashiers.id })

    if (!row) {
      return NextResponse.json({ error: 'Caixa não encontrado' }, { status: 404 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[DELETE /api/cashiers/:id]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
