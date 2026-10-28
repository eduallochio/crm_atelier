import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgServiceOrders, orgClients, orgCashierMovements, orgPaymentMethods } from '@/lib/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
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
      // forma_pagamento da OS grava o `tipo` real cadastrado em
      // org_payment_methods — junta por aí em vez de um match de texto fixo,
      // que ignorava cartão e qualquer forma de pagamento customizada.
      // LEFT JOIN (não inner): se o método foi renomeado/excluído depois que a
      // OS foi paga, a OS continua aparecendo em vez de desaparecer em silêncio
      .leftJoin(
        orgPaymentMethods,
        and(
          eq(orgPaymentMethods.tipo, orgServiceOrders.formaPagamento),
          eq(orgPaymentMethods.organizationId, user.organizationId),
        )
      )
      .where(and(
        eq(orgServiceOrders.organizationId, user.organizationId),
        eq(orgServiceOrders.statusPagamento, 'pago'),
        isNull(orgCashierMovements.id), // sem movimento = não lançada
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
