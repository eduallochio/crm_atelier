import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgProducts, organizations } from '@/lib/db/schema'
import { eq, and, asc } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'
import { hasLifetimeLicense } from '@/lib/plan-limits'

async function checkPlan(organizationId: string) {
  const [org] = await db
    .select({ plan: organizations.plan, lifetimeLicense: organizations.lifetimeLicense })
    .from(organizations)
    .where(eq(organizations.id, organizationId))
  if (org?.plan === 'free' && !org?.lifetimeLicense && !(await hasLifetimeLicense(organizationId))) {
    throw new Error('FORBIDDEN')
  }
}

export async function GET() {
  try {
    const user = await requireAuth()
    await checkPlan(user.organizationId)

    const products = await db
      .select()
      .from(orgProducts)
      .where(eq(orgProducts.organizationId, user.organizationId))
      .orderBy(asc(orgProducts.nome))

    return NextResponse.json(products.map(p => ({
      id:               p.id,
      organization_id:  p.organizationId,
      nome:             p.nome,
      descricao:        p.descricao,
      unidade:          p.unidade,
      quantidade_atual: Number(p.quantidadeAtual ?? 0),
      quantidade_minima: Number(p.quantidadeMinima ?? 0),
      preco_custo:      p.precoCusto != null ? Number(p.precoCusto) : null,
      codigo_barras:    p.codigoBarras,
      ativo:            p.ativo,
      created_at:       p.createdAt,
      updated_at:       p.updatedAt,
    })))
  } catch (error) {
    const msg = (error as Error).message
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    if (msg === 'FORBIDDEN') return NextResponse.json({ error: 'Recurso disponível apenas no plano pago' }, { status: 403 })
    logServerError('[GET /api/inventory/products]', error); console.error('[GET /api/inventory/products]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    await checkPlan(user.organizationId)

    const body = await request.json()
    const {
      nome,
      descricao,
      unidade = 'un',
      quantidadeAtual = 0,
      quantidadeMinima = 0,
      precoCusto,
      codigoBarras,
    } = body

    if (!nome) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })

    const [product] = await db
      .insert(orgProducts)
      .values({
        organizationId: user.organizationId,
        nome,
        descricao: descricao ?? null,
        unidade,
        quantidadeAtual: String(quantidadeAtual ?? 0),
        quantidadeMinima: String(quantidadeMinima ?? 0),
        precoCusto: precoCusto != null ? String(precoCusto) : null,
        codigoBarras: codigoBarras ?? null,
      })
      .returning()

    return NextResponse.json({
      id:               product.id,
      organization_id:  product.organizationId,
      nome:             product.nome,
      descricao:        product.descricao,
      unidade:          product.unidade,
      quantidade_atual: Number(product.quantidadeAtual ?? 0),
      quantidade_minima: Number(product.quantidadeMinima ?? 0),
      preco_custo:      product.precoCusto != null ? Number(product.precoCusto) : null,
      codigo_barras:    product.codigoBarras,
      ativo:            product.ativo,
      created_at:       product.createdAt,
      updated_at:       product.updatedAt,
    }, { status: 201 })
  } catch (error) {
    const msg = (error as Error).message
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    if (msg === 'FORBIDDEN') return NextResponse.json({ error: 'Recurso disponível apenas no plano pago' }, { status: 403 })
    logServerError('[POST /api/inventory/products]', error); console.error('[POST /api/inventory/products]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
