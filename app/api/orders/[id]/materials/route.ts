import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { orgServiceOrderMaterials, orgServiceOrders } from '@/lib/db/schema'
import { eq, and, asc } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth/session'
import { logServerError } from '@/lib/log-error'

/** GET /api/orders/[id]/materials → list materials for the order */
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    // Verify order belongs to org
    const [order] = await db
      .select({ id: orgServiceOrders.id })
      .from(orgServiceOrders)
      .where(and(eq(orgServiceOrders.id, id), eq(orgServiceOrders.organizationId, user.organizationId)))

    if (!order) {
      return NextResponse.json({ error: 'Ordem não encontrada' }, { status: 404 })
    }

    const materials = await db
      .select()
      .from(orgServiceOrderMaterials)
      .where(eq(orgServiceOrderMaterials.orderId, id))
      .orderBy(asc(orgServiceOrderMaterials.createdAt))

    return NextResponse.json(materials)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED')
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    logServerError('[GET /api/orders/[id]/materials]', error); console.error('[GET /api/orders/[id]/materials]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

/** PUT /api/orders/[id]/materials → replace all materials for the order (full upsert) */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const body = await request.json()
    const materiais: Array<{
      product_id?: string | null
      nome: string
      quantidade: number
      unidade?: string
    }> = body.materiais ?? []

    // Verify order belongs to org
    const [order] = await db
      .select({ id: orgServiceOrders.id })
      .from(orgServiceOrders)
      .where(and(eq(orgServiceOrders.id, id), eq(orgServiceOrders.organizationId, user.organizationId)))

    if (!order) {
      return NextResponse.json({ error: 'Ordem não encontrada' }, { status: 404 })
    }

    // Atomic delete + re-insert
    await db.transaction(async (tx) => {
      await tx
        .delete(orgServiceOrderMaterials)
        .where(eq(orgServiceOrderMaterials.orderId, id))

      const valid = materiais.filter(m => m.nome && m.quantidade && m.quantidade > 0)
      if (valid.length > 0) {
        await tx.insert(orgServiceOrderMaterials).values(
          valid.map(m => ({
            orderId:   id,
            productId: m.product_id || null,
            nome:      m.nome,
            quantidade: String(m.quantidade),
            unidade:   m.unidade || 'un',
          }))
        )
      }
    })

    const result = await db
      .select()
      .from(orgServiceOrderMaterials)
      .where(eq(orgServiceOrderMaterials.orderId, id))
      .orderBy(asc(orgServiceOrderMaterials.createdAt))

    return NextResponse.json(result)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED')
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    logServerError('[PUT /api/orders/[id]/materials]', error); console.error('[PUT /api/orders/[id]/materials]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
