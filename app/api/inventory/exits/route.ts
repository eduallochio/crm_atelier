import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgStockExits, orgStockExitItems, orgProducts, organizations } from '@/lib/db/schema'
import { eq, desc, inArray } from 'drizzle-orm'
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

    const exits = await db
      .select()
      .from(orgStockExits)
      .where(eq(orgStockExits.organizationId, user.organizationId))
      .orderBy(desc(orgStockExits.createdAt))

    if (!exits.length) return NextResponse.json([])

    const exitIds = exits.map(e => e.id)
    const items = await db
      .select()
      .from(orgStockExitItems)
      .where(inArray(orgStockExitItems.exitId, exitIds))

    const exitsWithItems = exits.map(e => ({
      ...e,
      itens: items.filter(i => i.exitId === e.id),
    }))

    return NextResponse.json(exitsWithItems.map(e => ({
      id:               e.id,
      organization_id:  e.organizationId,
      service_order_id: e.serviceOrderId,
      tipo:             e.tipo,
      observacoes:      e.observacoes,
      created_at:       e.createdAt,
      itens: e.itens.map(i => ({
        id:           i.id,
        exit_id:      i.exitId,
        product_id:   i.productId,
        produto_nome: i.produtoNome,
        quantidade:   Number(i.quantidade ?? 0),
        unidade:      i.unidade,
      })),
    })))
  } catch (error) {
    const msg = (error as Error).message
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    if (msg === 'FORBIDDEN') return NextResponse.json({ error: 'Recurso disponível apenas no plano pago' }, { status: 403 })
    logServerError('[GET /api/inventory/exits]', error); console.error('[GET /api/inventory/exits]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    await checkPlan(user.organizationId)

    const body = await request.json()
    const { serviceOrderId, tipo = 'manual', observacoes, itens = [] } = body

    if (!itens.length) {
      return NextResponse.json({ error: 'Ao menos um item é obrigatório' }, { status: 400 })
    }

    // Validate all products exist and belong to this org
    const productIds = itens.map((i: { productId: string }) => i.productId).filter(Boolean)
    if (productIds.length) {
      const products = await db
        .select({ id: orgProducts.id })
        .from(orgProducts)
        .where(inArray(orgProducts.id, productIds))
      if (products.length !== productIds.length) {
        return NextResponse.json({ error: 'Um ou mais produtos não encontrados' }, { status: 400 })
      }
    }

    const result = await db.transaction(async (tx) => {
      const [exit] = await tx
        .insert(orgStockExits)
        .values({
          organizationId: user.organizationId,
          serviceOrderId: serviceOrderId ?? null,
          tipo,
          observacoes: observacoes ?? null,
        })
        .returning()

      const insertedItems = await tx
        .insert(orgStockExitItems)
        .values(
          itens.map((item: { productId: string; produtoNome: string; quantidade: number; unidade?: string }) => ({
            exitId:      exit.id,
            productId:   item.productId,
            produtoNome: item.produtoNome,
            quantidade:  String(item.quantidade),
            unidade:     item.unidade ?? 'un',
          }))
        )
        .returning()

      return { ...exit, itens: insertedItems }
    })

    return NextResponse.json({
      id:               result.id,
      organization_id:  result.organizationId,
      service_order_id: result.serviceOrderId,
      tipo:             result.tipo,
      observacoes:      result.observacoes,
      created_at:       result.createdAt,
      updated_at:       result.updatedAt,
      itens: result.itens.map((i: { id: string; exitId: string; productId: string; produtoNome: string; quantidade: string | number; unidade: string }) => ({
        id:           i.id,
        exit_id:      i.exitId,
        product_id:   i.productId,
        produto_nome: i.produtoNome,
        quantidade:   Number(i.quantidade ?? 0),
        unidade:      i.unidade,
      })),
    }, { status: 201 })
  } catch (error) {
    const msg = (error as Error).message
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    if (msg === 'FORBIDDEN') return NextResponse.json({ error: 'Recurso disponível apenas no plano pago' }, { status: 403 })
    if (msg.includes('Estoque insuficiente')) return NextResponse.json({ error: msg }, { status: 422 })
    logServerError('[POST /api/inventory/exits]', error); console.error('[POST /api/inventory/exits]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
