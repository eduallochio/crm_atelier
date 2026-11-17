import { NextResponse } from 'next/server'
import { requireAuth, assertPermission } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgServiceOrders, orgClients, orgCashierMovements, orgPaymentMethods } from '@/lib/db/schema'
import { eq, and, isNull, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'

const entradaMovements = alias(orgCashierMovements, 'entrada_mov')
import { logServerError } from '@/lib/log-error'

// OS pagas que ainda não foram lançadas em nenhuma sessão de caixa
export async function GET() {
  try {
    const user = await requireAuth()
    assertPermission(user, 'ordens_servico')

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
      // LEFT JOIN só com 'ordem_servico' (quitação, lançada na conclusão via
      // register-cashier) — não inclui 'ordem_servico_entrada' (sinal
      // lançado na criação, ver POST /api/orders): uma OS com sinal parcial
      // que foi concluída sem caixa aberto só tem o movimento do sinal, e
      // ainda precisa lançar o saldo restante, então deve continuar
      // aparecendo aqui como pendente
      .leftJoin(
        orgCashierMovements,
        and(
          eq(orgCashierMovements.referenciaId, orgServiceOrders.id),
          eq(orgCashierMovements.referenciaTipo, 'ordem_servico'),
          eq(orgCashierMovements.organizationId, user.organizationId),
        )
      )
      // Join separado (alias) só para o sinal ('ordem_servico_entrada') —
      // usado abaixo pra não excluir do resultado uma OS que nasceu paga
      // 100% só com sinal mas nunca teve esse sinal lançado no caixa de fato
      // (ex: nenhum caixa aberto no momento da criação da OS, ver POST
      // /api/orders — "segue sem lançar" nesse caso)
      .leftJoin(
        entradaMovements,
        and(
          eq(entradaMovements.referenciaId, orgServiceOrders.id),
          eq(entradaMovements.referenciaTipo, 'ordem_servico_entrada'),
          eq(entradaMovements.organizationId, user.organizationId),
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
        isNull(orgCashierMovements.id), // sem movimento de quitação = não lançada
        // Ainda é pendente se sobra saldo a lançar (sinal < total) OU se o
        // sinal nunca chegou a ser lançado no caixa de fato (ex: OS nasceu
        // paga 100% só com sinal, mas não havia caixa aberto na criação —
        // ver POST /api/orders). Sem o segundo termo, essa OS nunca
        // apareceria aqui, mesmo sem nenhum movimento de caixa registrado.
        sql`(${orgServiceOrders.valorEntrada} < ${orgServiceOrders.valorTotal} or ${isNull(entradaMovements.id)})`,
      ))
      .orderBy(orgServiceOrders.dataConclusao)

    return NextResponse.json(rows)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    if ((error as Error).message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    logServerError('[GET /api/orders/unlaunched]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
