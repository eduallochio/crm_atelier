import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgProductCategories, orgProducts } from '@/lib/db/schema'
import { eq, and, count } from 'drizzle-orm'
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

    const nome = String(body.nome ?? '').trim()
    if (!nome) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    try {
      const [row] = await db
        .update(orgProductCategories)
        .set({
          nome,
          cor:       body.cor || null,
          ativo:     body.ativo !== false,
          updatedAt: new Date(),
        })
        .where(and(eq(orgProductCategories.id, id), eq(orgProductCategories.organizationId, user.organizationId)))
        .returning()

      if (!row) {
        return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 })
      }

      return NextResponse.json({
        id:         row.id,
        nome:       row.nome,
        cor:        row.cor,
        ativo:      row.ativo,
        created_at: row.createdAt,
        updated_at: row.updatedAt,
      })
    } catch (updateError) {
      if ((updateError as { code?: string }).code === '23505') {
        return NextResponse.json({ error: 'Já existe uma categoria com esse nome' }, { status: 409 })
      }
      throw updateError
    }
  } catch (error) {
    const msg = (error as Error).message
    if (msg === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    if (msg === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Recurso disponível apenas no plano pago' }, { status: 403 })
    }
    logServerError('[PUT /api/product-categories/:id]', error); console.error('[PUT /api/product-categories/:id]', error)
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

    const [existing] = await db
      .select({ id: orgProductCategories.id })
      .from(orgProductCategories)
      .where(and(eq(orgProductCategories.id, id), eq(orgProductCategories.organizationId, user.organizationId)))
      .limit(1)

    if (!existing) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 })
    }

    // Exclusão é bloqueada enquanto algum produto ATIVO ainda referencia esta
    // categoria — mesmo critério usado pela contagem exibida na listagem
    // (GET /api/product-categories), para a tela nunca prometer uma exclusão
    // que o servidor vai recusar. Produto inativo vinculado não bloqueia:
    // ele já não aparece em nenhuma lista como "usando" a categoria.
    const [{ value: productsCount }] = await db
      .select({ value: count() })
      .from(orgProducts)
      .where(and(eq(orgProducts.categoryId, id), eq(orgProducts.ativo, true)))

    if (productsCount > 0) {
      return NextResponse.json(
        { error: `${productsCount} produto${productsCount > 1 ? 's' : ''} usa${productsCount > 1 ? 'm' : ''} essa categoria. Mova ${productsCount > 1 ? 'os produtos' : 'o produto'} para outra categoria antes de excluir.` },
        { status: 409 }
      )
    }

    await db
      .delete(orgProductCategories)
      .where(and(eq(orgProductCategories.id, id), eq(orgProductCategories.organizationId, user.organizationId)))

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    const msg = (error as Error).message
    if (msg === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    if (msg === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Recurso disponível apenas no plano pago' }, { status: 403 })
    }
    logServerError('[DELETE /api/product-categories/:id]', error); console.error('[DELETE /api/product-categories/:id]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
