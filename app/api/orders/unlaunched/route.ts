import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgServiceOrders, orgClients, orgCashierMovements } from '@/lib/db/schema'
import { eq, and, isNull, or, ilike } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'

// OS pagas que ainda não foram lançadas em nenhuma sessão de caixa
export async function GET() {
  try {
    const user = await requireAuth()

    const rows = await db
      .select({
        id: orgServiceOrders.id,
        numero: orgServiceOrders.numero,
        valorTotal: orgServiceOrders.valorTotal,
        formaPagamento: orgServiceOrders.formaPagamento,
        dataConclusao: orgServiceOrders.dataConclusao,
        clienteNome: orgClients.nome,
      })
      .from(orgServiceOrders)
      .leftJoin(orgClients, eq(orgClients.id, orgServiceOrders.clientId))
      // LEFT JOIN em movimentos para detectar ausência
      .leftJoin(
        orgCashierMovements,
        and(
          eq(orgCashierMovements.referenciaId, orgServiceOrders.id),
          eq(orgCashierMovements.referenciaTipo, 'ordem_servico'),
          eq(orgCashierMovements.organizationId, user.organizationId),
        )
      )
      .where(and(
        eq(orgServiceOrders.organizationId, user.organizationId),
        eq(orgServiceOrders.statusPagamento, 'pago'),
        isNull(orgCashierMovements.id), // sem movimento = não lançada
        or(
          ilike(orgServiceOrders.formaPagamento, '%pix%'),
          ilike(orgServiceOrders.formaPagamento, '%dinheiro%'),
        ),
      ))
      .orderBy(orgServiceOrders.dataConclusao)

    return NextResponse.json(rows)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[GET /api/orders/unlaunched]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
