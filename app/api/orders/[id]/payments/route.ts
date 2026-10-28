import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { orgTransactions, orgPaymentMethods, orgServiceOrders, profiles } from '@/lib/db/schema'
import { eq, and, asc, inArray } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth/session'
import { logServerError } from '@/lib/log-error'

// GET /api/orders/:id/payments
// Lista cada pagamento recebido para a OS (entrada na abertura + pagamento na
// conclusão), com forma de pagamento e quem registrou cada um — rastreabilidade
// completa para OS pagas em mais de uma forma/momento (ex: parte dinheiro, parte PIX)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const [order] = await db
      .select({
        id: orgServiceOrders.id,
        createdByUserId: orgServiceOrders.createdByUserId,
        concludedByUserId: orgServiceOrders.concludedByUserId,
      })
      .from(orgServiceOrders)
      .where(and(eq(orgServiceOrders.id, id), eq(orgServiceOrders.organizationId, user.organizationId)))
      .limit(1)

    if (!order) {
      return NextResponse.json({ error: 'Ordem não encontrada' }, { status: 404 })
    }

    const payments = await db
      .select({
        id: orgTransactions.id,
        valor: orgTransactions.valor,
        dataTransacao: orgTransactions.dataTransacao,
        observacoes: orgTransactions.observacoes,
        paymentMethodName: orgPaymentMethods.nome,
        createdAt: orgTransactions.createdAt,
      })
      .from(orgTransactions)
      .leftJoin(orgPaymentMethods, eq(orgPaymentMethods.id, orgTransactions.paymentMethodId))
      .where(and(
        eq(orgTransactions.serviceOrderId, id),
        eq(orgTransactions.organizationId, user.organizationId),
      ))
      .orderBy(asc(orgTransactions.createdAt))

    const userIds = [...new Set([order.createdByUserId, order.concludedByUserId].filter((v): v is string => !!v))]
    const userRows = userIds.length > 0
      ? await db.select({ id: profiles.id, fullName: profiles.fullName }).from(profiles).where(inArray(profiles.id, userIds))
      : []
    const userMap = new Map(userRows.map(r => [r.id, r.fullName]))

    return NextResponse.json({
      payments: payments.map(p => ({
        id: p.id,
        valor: Number(p.valor),
        data: p.dataTransacao,
        forma_pagamento: p.paymentMethodName,
        observacoes: p.observacoes,
      })),
      created_by: order.createdByUserId ? userMap.get(order.createdByUserId) ?? null : null,
      concluded_by: order.concludedByUserId ? userMap.get(order.concludedByUserId) ?? null : null,
    })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[GET /api/orders/:id/payments]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
