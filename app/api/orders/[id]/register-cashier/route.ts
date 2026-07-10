import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import {
  orgServiceOrders,
  orgCashierSessions,
  orgCashierMovements,
} from '@/lib/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    // Verificar que a OS pertence à organização e está paga
    const [order] = await db
      .select({
        id: orgServiceOrders.id,
        numero: orgServiceOrders.numero,
        valorTotal: orgServiceOrders.valorTotal,
        statusPagamento: orgServiceOrders.statusPagamento,
        formaPagamento: orgServiceOrders.formaPagamento,
      })
      .from(orgServiceOrders)
      .where(and(
        eq(orgServiceOrders.id, id),
        eq(orgServiceOrders.organizationId, user.organizationId),
      ))
      .limit(1)

    if (!order) {
      return NextResponse.json({ error: 'OS não encontrada' }, { status: 404 })
    }

    if (order.statusPagamento !== 'pago') {
      return NextResponse.json({ error: 'OS ainda não foi marcada como paga' }, { status: 422 })
    }

    // Verificar se já existe movimento para esta OS
    const [existingMovement] = await db
      .select({ id: orgCashierMovements.id })
      .from(orgCashierMovements)
      .where(and(
        eq(orgCashierMovements.organizationId, user.organizationId),
        eq(orgCashierMovements.referenciaId, id),
        eq(orgCashierMovements.referenciaTipo, 'ordem_servico'),
      ))
      .limit(1)

    if (existingMovement) {
      return NextResponse.json({ error: 'Esta OS já foi lançada no caixa' }, { status: 409 })
    }

    // Buscar sessão de caixa aberta
    const [openSession] = await db
      .select({ id: orgCashierSessions.id })
      .from(orgCashierSessions)
      .where(and(
        eq(orgCashierSessions.organizationId, user.organizationId),
        eq(orgCashierSessions.status, 'aberto'),
        isNull(orgCashierSessions.dataFechamento),
      ))
      .orderBy(orgCashierSessions.dataAbertura)
      .limit(1)

    if (!openSession) {
      return NextResponse.json({ error: 'Nenhum caixa aberto encontrado' }, { status: 422 })
    }

    const descricao = `OS #${String(order.numero ?? 0).padStart(6, '0')}${order.formaPagamento ? ` — ${order.formaPagamento}` : ''}`

    const [movement] = await db
      .insert(orgCashierMovements)
      .values({
        organizationId: user.organizationId,
        sessaoId: openSession.id,
        tipo: 'entrada',
        descricao,
        valor: String(order.valorTotal ?? 0),
        referenciaId: id,
        referenciaTipo: 'ordem_servico',
      })
      .returning()

    return NextResponse.json({ movement, sessaoId: openSession.id }, { status: 201 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[POST /api/orders/[id]/register-cashier]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
