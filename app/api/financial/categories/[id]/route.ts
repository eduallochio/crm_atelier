import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgFinancialCategories } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'
import { requireProPlan } from '@/lib/plan-limits'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    await requireProPlan(user.organizationId)
    const body = await request.json()
    const { id } = await params

    const [row] = await db
      .update(orgFinancialCategories)
      .set({
        nome:      body.nome,
        tipo:      body.tipo,
        cor:       body.cor || null,
        descricao: body.descricao || null,
        ativo:     body.ativo !== false,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(orgFinancialCategories.id, id),
          eq(orgFinancialCategories.organizationId, user.organizationId)
        )
      )
      .returning()

    if (!row) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 })
    }

    return NextResponse.json({
      id:              row.id,
      organization_id: row.organizationId,
      nome:            row.nome,
      tipo:            row.tipo,
      cor:             row.cor,
      descricao:       row.descricao,
      ativo:           row.ativo,
      created_at:      row.createdAt,
      updated_at:      row.updatedAt,
    })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    if ((error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Recurso disponível apenas no plano pago' }, { status: 403 })
    }
    logServerError('[PUT /api/financial/categories/:id]', error); console.error('[PUT /api/financial/categories/:id]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    await requireProPlan(user.organizationId)
    const { id } = await params

    const [row] = await db
      .delete(orgFinancialCategories)
      .where(
        and(
          eq(orgFinancialCategories.id, id),
          eq(orgFinancialCategories.organizationId, user.organizationId)
        )
      )
      .returning({ id: orgFinancialCategories.id })

    if (!row) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    if ((error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Recurso disponível apenas no plano pago' }, { status: 403 })
    }
    logServerError('[DELETE /api/financial/categories/:id]', error); console.error('[DELETE /api/financial/categories/:id]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
