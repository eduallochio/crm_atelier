import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgReceivables, orgPayables, orgTransactions, orgFinancialCategories } from '@/lib/db/schema'
import { eq, and, gte, lte, lt, isNull, sql as drizzleSql } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'

function getPeriodDates(period: string) {
  const now = new Date()
  switch (period) {
    case '7days': {
      const start = new Date(now)
      start.setDate(start.getDate() - 6)
      start.setHours(0, 0, 0, 0)
      return { start, end: now }
    }
    case '30days': {
      const start = new Date(now)
      start.setDate(start.getDate() - 29)
      start.setHours(0, 0, 0, 0)
      return { start, end: now }
    }
    case 'lastMonth': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
      return { start, end }
    }
    case 'all': {
      const start = new Date(2000, 0, 1)
      return { start, end: now }
    }
    case 'thisMonth':
    default: {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      return { start, end }
    }
  }
}

const toDateStr = (d: Date) => d.toISOString().split('T')[0]

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'thisMonth'
    const { start: startOfMonth, end: endOfMonth } = getPeriodDates(period)

    const now = new Date()
    const in7Days = new Date()
    in7Days.setDate(in7Days.getDate() + 7)

    const orgId = user.organizationId
    const startStr  = toDateStr(startOfMonth)
    const endStr    = toDateStr(endOfMonth)
    const todayStr  = toDateStr(now)
    const in7Str    = toDateStr(in7Days)

    // ── Receivables aggregates ─────────────────────────────────────────────────
    const [recAgg] = await db
      .select({
        totalRecebido: drizzleSql<number>`
          COALESCE(SUM(CASE WHEN ${orgReceivables.status} = 'recebido' THEN ${orgReceivables.valor}::numeric ELSE 0 END), 0)`,
        totalAReceber: drizzleSql<number>`
          COALESCE(SUM(CASE WHEN ${orgReceivables.status} = 'pendente' THEN ${orgReceivables.valor}::numeric ELSE 0 END), 0)`,
        receitasAtrasadas: drizzleSql<number>`
          COALESCE(SUM(CASE
            WHEN ${orgReceivables.status} = 'pendente'
              AND ${orgReceivables.dataVencimento} < ${todayStr}::date
            THEN ${orgReceivables.valor}::numeric ELSE 0 END), 0)`,
        entradasMes: drizzleSql<number>`
          COALESCE(SUM(CASE
            WHEN ${orgReceivables.status} = 'recebido'
              AND ${orgReceivables.dataRecebimento} >= ${startStr}::date
              AND ${orgReceivables.dataRecebimento} <= ${endStr}::date
            THEN ${orgReceivables.valor}::numeric ELSE 0 END), 0)`,
        recebiveisVencendo: drizzleSql<number>`
          COUNT(CASE
            WHEN ${orgReceivables.status} = 'pendente'
              AND ${orgReceivables.dataVencimento} >= ${todayStr}::date
              AND ${orgReceivables.dataVencimento} <= ${in7Str}::date
            THEN 1 END)`,
      })
      .from(orgReceivables)
      .where(eq(orgReceivables.organizationId, orgId))

    // ── Payables aggregates ────────────────────────────────────────────────────
    const [payAgg] = await db
      .select({
        totalPago: drizzleSql<number>`
          COALESCE(SUM(CASE WHEN ${orgPayables.status} = 'pago' THEN ${orgPayables.valor}::numeric ELSE 0 END), 0)`,
        totalAPagar: drizzleSql<number>`
          COALESCE(SUM(CASE
            WHEN ${orgPayables.status} = 'pendente'
              AND ${orgPayables.dataVencimento} >= ${todayStr}::date
            THEN ${orgPayables.valor}::numeric ELSE 0 END), 0)`,
        despesasAtrasadas: drizzleSql<number>`
          COALESCE(SUM(CASE
            WHEN ${orgPayables.status} = 'pendente'
              AND ${orgPayables.dataVencimento} < ${todayStr}::date
            THEN ${orgPayables.valor}::numeric ELSE 0 END), 0)`,
        saidasMes: drizzleSql<number>`
          COALESCE(SUM(CASE
            WHEN ${orgPayables.status} = 'pago'
              AND ${orgPayables.dataPagamento} >= ${startStr}::date
              AND ${orgPayables.dataPagamento} <= ${endStr}::date
            THEN ${orgPayables.valor}::numeric ELSE 0 END), 0)`,
        pagaveisVencendo: drizzleSql<number>`
          COUNT(CASE
            WHEN ${orgPayables.status} = 'pendente'
              AND ${orgPayables.dataVencimento} >= ${todayStr}::date
              AND ${orgPayables.dataVencimento} <= ${in7Str}::date
            THEN 1 END)`,
      })
      .from(orgPayables)
      .where(eq(orgPayables.organizationId, orgId))

    // ── Direct transactions (no receivable/payable link) ───────────────────────
    const [transAgg] = await db
      .select({
        entradasTrans: drizzleSql<number>`
          COALESCE(SUM(CASE
            WHEN ${orgTransactions.tipo} = 'entrada'
              AND ${orgTransactions.receivableId} IS NULL
              AND ${orgTransactions.dataTransacao} >= ${startStr}::date
              AND ${orgTransactions.dataTransacao} <= ${endStr}::date
            THEN ${orgTransactions.valor}::numeric ELSE 0 END), 0)`,
        saidasTrans: drizzleSql<number>`
          COALESCE(SUM(CASE
            WHEN ${orgTransactions.tipo} = 'saida'
              AND ${orgTransactions.payableId} IS NULL
              AND ${orgTransactions.dataTransacao} >= ${startStr}::date
              AND ${orgTransactions.dataTransacao} <= ${endStr}::date
            THEN ${orgTransactions.valor}::numeric ELSE 0 END), 0)`,
        entradasTransTotal: drizzleSql<number>`
          COALESCE(SUM(CASE
            WHEN ${orgTransactions.tipo} = 'entrada' AND ${orgTransactions.receivableId} IS NULL
            THEN ${orgTransactions.valor}::numeric ELSE 0 END), 0)`,
        saidasTransTotal: drizzleSql<number>`
          COALESCE(SUM(CASE
            WHEN ${orgTransactions.tipo} = 'saida' AND ${orgTransactions.payableId} IS NULL
            THEN ${orgTransactions.valor}::numeric ELSE 0 END), 0)`,
      })
      .from(orgTransactions)
      .where(eq(orgTransactions.organizationId, orgId))

    const totalRecebido     = Number(recAgg.totalRecebido)
    const totalAReceber     = Number(recAgg.totalAReceber)
    const receitasAtrasadas = Number(recAgg.receitasAtrasadas)
    const totalPago         = Number(payAgg.totalPago)
    const totalAPagar       = Number(payAgg.totalAPagar)
    const despesasAtrasadas = Number(payAgg.despesasAtrasadas)

    const entradasMes = Number(recAgg.entradasMes) + Number(transAgg.entradasTrans)
    const saidasMes   = Number(payAgg.saidasMes)   + Number(transAgg.saidasTrans)
    const saldoTransacoesDiretas = Number(transAgg.entradasTransTotal) - Number(transAgg.saidasTransTotal)

    // ── Cash flow: last 6 months ───────────────────────────────────────────────
    const fluxoCaixa = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const primeiro = toDateStr(new Date(d.getFullYear(), d.getMonth(), 1))
      const ultimo   = toDateStr(new Date(d.getFullYear(), d.getMonth() + 1, 0))

      const [cf] = await db
        .select({
          entradas: drizzleSql<number>`
            (
              SELECT COALESCE(SUM(valor::numeric), 0)
              FROM org_receivables
              WHERE organization_id = ${orgId}::uuid
                AND status = 'recebido'
                AND data_recebimento >= ${primeiro}::date
                AND data_recebimento <= ${ultimo}::date
            ) + (
              SELECT COALESCE(SUM(valor::numeric), 0)
              FROM org_transactions
              WHERE organization_id = ${orgId}::uuid
                AND tipo = 'entrada'
                AND receivable_id IS NULL
                AND data_transacao >= ${primeiro}::date
                AND data_transacao <= ${ultimo}::date
            )
          `,
          saidas: drizzleSql<number>`
            (
              SELECT COALESCE(SUM(valor::numeric), 0)
              FROM org_payables
              WHERE organization_id = ${orgId}::uuid
                AND status = 'pago'
                AND data_pagamento >= ${primeiro}::date
                AND data_pagamento <= ${ultimo}::date
            ) + (
              SELECT COALESCE(SUM(valor::numeric), 0)
              FROM org_transactions
              WHERE organization_id = ${orgId}::uuid
                AND tipo = 'saida'
                AND payable_id IS NULL
                AND data_transacao >= ${primeiro}::date
                AND data_transacao <= ${ultimo}::date
            )
          `,
        })
        .from(drizzleSql`(SELECT 1) AS _dual`)

      const entradas = Number(cf.entradas)
      const saidas   = Number(cf.saidas)
      const mes         = d.toLocaleString('pt-BR', { month: 'short', year: 'numeric' })
      const mesCompleto = d.toLocaleString('pt-BR', { month: 'long',  year: 'numeric' })
      fluxoCaixa.push({ mes, mesCompleto, entradas, saidas, saldo: entradas - saidas })
    }

    // ── Expenses by category ───────────────────────────────────────────────────
    const catRows = await db
      .select({
        categoriaNome: drizzleSql<string>`
          COALESCE(${orgFinancialCategories.nome}, NULLIF(${orgPayables.categoria}, ''), 'Sem categoria')`,
        categoriaCor: drizzleSql<string>`
          COALESCE(${orgFinancialCategories.cor}, '#6b7280')`,
        total: drizzleSql<number>`SUM(${orgPayables.valor}::numeric)`,
      })
      .from(orgPayables)
      .leftJoin(orgFinancialCategories, eq(orgFinancialCategories.id, orgPayables.categoryId))
      .where(and(eq(orgPayables.organizationId, orgId), eq(orgPayables.status, 'pago')))
      .groupBy(orgFinancialCategories.nome, orgFinancialCategories.cor, orgPayables.categoria)
      .orderBy(drizzleSql`SUM(${orgPayables.valor}::numeric) DESC`)

    const despesasPorCategoria = catRows.map((r) => ({
      nome:  r.categoriaNome,
      cor:   r.categoriaCor,
      total: Number(r.total),
    }))

    return NextResponse.json({
      totalRecebido,
      totalAReceber,
      receitasAtrasadas,
      totalPago,
      totalAPagar,
      despesasAtrasadas,
      saldoAtual:         totalRecebido + saldoTransacoesDiretas - totalPago,
      saldoProjetado:     (totalRecebido + saldoTransacoesDiretas + totalAReceber) - (totalPago + totalAPagar),
      entradasMes,
      saidasMes,
      saldoMes:           entradasMes - saidasMes,
      recebiveisVencendo: Number(recAgg.recebiveisVencendo),
      pagaveisVencendo:   Number(payAgg.pagaveisVencendo),
      fluxoCaixa,
      despesasPorCategoria,
    })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[GET /api/financial/stats]', error); console.error('[GET /api/financial/stats]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
