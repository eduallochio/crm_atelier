import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgProducts, organizations } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'
import { hasLifetimeLicense } from '@/lib/plan-limits'

async function checkPlanAndProduct(organizationId: string, productId: string) {
  const [org] = await db
    .select({ plan: organizations.plan, lifetimeLicense: organizations.lifetimeLicense })
    .from(organizations)
    .where(eq(organizations.id, organizationId))
  if (org?.plan === 'free' && !org?.lifetimeLicense && !(await hasLifetimeLicense(organizationId))) {
    throw new Error('FORBIDDEN')
  }

  const [product] = await db
    .select()
    .from(orgProducts)
    .where(and(eq(orgProducts.id, productId), eq(orgProducts.organizationId, organizationId)))
  if (!product) throw new Error('NOT_FOUND')

  return product
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const product = await checkPlanAndProduct(user.organizationId, id)
    return NextResponse.json(product)
  } catch (error) {
    const msg = (error as Error).message
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    if (msg === 'FORBIDDEN') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    if (msg === 'NOT_FOUND') return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    logServerError('[GET /api/inventory/products/[id]]', error); console.error('[GET /api/inventory/products/[id]]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params
    await checkPlanAndProduct(user.organizationId, id)

    const body = await request.json()
    const { nome, descricao, unidade, quantidadeMinima, precoCusto, codigoBarras, ativo } = body

    const [updated] = await db
      .update(orgProducts)
      .set({
        nome,
        descricao: descricao ?? null,
        unidade: unidade ?? 'un',
        quantidadeMinima: quantidadeMinima != null ? String(quantidadeMinima) : '0',
        precoCusto: precoCusto != null ? String(precoCusto) : null,
        codigoBarras: codigoBarras ?? null,
        ativo: ativo !== false,
        updatedAt: new Date(),
      })
      .where(and(eq(orgProducts.id, id), eq(orgProducts.organizationId, user.organizationId)))
      .returning()

    return NextResponse.json(updated)
  } catch (error) {
    const msg = (error as Error).message
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    if (msg === 'FORBIDDEN') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    if (msg === 'NOT_FOUND') return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    logServerError('[PUT /api/inventory/products/[id]]', error); console.error('[PUT /api/inventory/products/[id]]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params
    await checkPlanAndProduct(user.organizationId, id)

    await db
      .update(orgProducts)
      .set({ ativo: false, updatedAt: new Date() })
      .where(and(eq(orgProducts.id, id), eq(orgProducts.organizationId, user.organizationId)))

    return NextResponse.json({ success: true })
  } catch (error) {
    const msg = (error as Error).message
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    if (msg === 'FORBIDDEN') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    if (msg === 'NOT_FOUND') return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    logServerError('[DELETE /api/inventory/products/[id]]', error); console.error('[DELETE /api/inventory/products/[id]]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
