import { NextResponse } from 'next/server'
import { requireAuth, assertPermission } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgProductCategories, orgProducts } from '@/lib/db/schema'
import { eq, and, asc, sql } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'
import { requireProPlan } from '@/lib/plan-limits'

export async function GET() {
  try {
    const user = await requireAuth()
    assertPermission(user, 'estoque')
    await requireProPlan(user.organizationId)

    const rows = await db
      .select({
        id:        orgProductCategories.id,
        nome:      orgProductCategories.nome,
        cor:       orgProductCategories.cor,
        ativo:     orgProductCategories.ativo,
        createdAt: orgProductCategories.createdAt,
        updatedAt: orgProductCategories.updatedAt,
        productsCount: sql<number>`count(${orgProducts.id})`.mapWith(Number),
      })
      .from(orgProductCategories)
      .leftJoin(orgProducts, and(eq(orgProducts.categoryId, orgProductCategories.id), eq(orgProducts.ativo, true)))
      .where(eq(orgProductCategories.organizationId, user.organizationId))
      .groupBy(orgProductCategories.id)
      .orderBy(asc(orgProductCategories.nome))

    return NextResponse.json(rows.map(r => ({
      id:             r.id,
      nome:           r.nome,
      cor:            r.cor,
      ativo:          r.ativo,
      products_count: r.productsCount,
      created_at:     r.createdAt,
      updated_at:     r.updatedAt,
    })))
  } catch (error) {
    const msg = (error as Error).message
    if (msg === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    if (msg === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Recurso disponível apenas no plano pago' }, { status: 403 })
    }
    logServerError('[GET /api/product-categories]', error); console.error('[GET /api/product-categories]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    assertPermission(user, 'estoque')
    await requireProPlan(user.organizationId)
    const body = await request.json()

    const nome = String(body.nome ?? '').trim()
    if (!nome) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    try {
      const [row] = await db
        .insert(orgProductCategories)
        .values({
          organizationId: user.organizationId,
          nome,
          cor:   body.cor || null,
          ativo: body.ativo !== false,
        })
        .returning()

      return NextResponse.json({
        id:             row.id,
        nome:           row.nome,
        cor:            row.cor,
        ativo:          row.ativo,
        products_count: 0,
        created_at:     row.createdAt,
        updated_at:     row.updatedAt,
      }, { status: 201 })
    } catch (insertError) {
      // uq_product_categories_org_nome_ci — mesma categoria (comparação
      // case-insensitive) já cadastrada nesta organização
      if ((insertError as { code?: string }).code === '23505') {
        return NextResponse.json({ error: 'Já existe uma categoria com esse nome' }, { status: 409 })
      }
      throw insertError
    }
  } catch (error) {
    const msg = (error as Error).message
    if (msg === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    if (msg === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Recurso disponível apenas no plano pago' }, { status: 403 })
    }
    logServerError('[POST /api/product-categories]', error); console.error('[POST /api/product-categories]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
