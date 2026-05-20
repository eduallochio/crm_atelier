import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { orgServiceOrderHistory, orgServiceOrders } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth/session'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    // Verify order belongs to org, then fetch history
    const history = await db
      .select({
        id:            orgServiceOrderHistory.id,
        orderId:       orgServiceOrderHistory.orderId,
        organizationId: orgServiceOrderHistory.organizationId,
        userEmail:     orgServiceOrderHistory.userEmail,
        campoAlterado: orgServiceOrderHistory.campoAlterado,
        valorAnterior: orgServiceOrderHistory.valorAnterior,
        valorNovo:     orgServiceOrderHistory.valorNovo,
        createdAt:     orgServiceOrderHistory.createdAt,
      })
      .from(orgServiceOrderHistory)
      .innerJoin(orgServiceOrders, eq(orgServiceOrders.id, orgServiceOrderHistory.orderId))
      .where(and(
        eq(orgServiceOrderHistory.orderId, id),
        eq(orgServiceOrders.organizationId, user.organizationId)
      ))
      .orderBy(desc(orgServiceOrderHistory.createdAt))

    return NextResponse.json(history)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[GET /api/orders/:id/history]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
