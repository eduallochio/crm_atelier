import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getPool, sql } from '@/lib/db'

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

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    const pool = await getPool()

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'thisMonth'
    const { start: startOfMonth, end: endOfMonth } = getPeriodDates(period)

    const now = new Date()
    const in7Days = new Date()
    in7Days.setDate(in7Days.getDate() + 7)

    // Receivables aggregates
    const recResult = await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .input('startOfMonth', sql.DateTime2, startOfMonth)
      .input('endOfMonth', sql.DateTime2, endOfMonth)
      .input('today', sql.DateTime2, now)
      .input('in7Days', sql.DateTime2, in7Days)
      .query(`
        SELECT
          ISNULL(SUM(CASE WHEN status = 'recebido' THEN valor ELSE 0 END), 0) AS total_recebido,
          -- todos os pendentes, independente se atrasados ou não
          ISNULL(SUM(CASE WHEN status = 'pendente' THEN valor ELSE 0 END), 0) AS total_a_receber,
          ISNULL(SUM(CASE
            WHEN status = 'pendente' AND data_vencimento < CAST(GETDATE() AS DATE) THEN valor
            ELSE 0
          END), 0) AS receitas_atrasadas,
          ISNULL(SUM(CASE
            WHEN status = 'recebido'
              AND data_recebimento >= @startOfMonth AND data_recebimento <= @endOfMonth
            THEN valor ELSE 0
          END), 0) AS entradas_mes,
          COUNT(CASE
            WHEN status = 'pendente'
              AND data_vencimento >= @today AND data_vencimento <= @in7Days
            THEN 1 END) AS recebiveis_vencendo
        FROM org_receivables
        WHERE organization_id = @orgId
      `)

    // Payables aggregates
    const payResult = await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .input('startOfMonth', sql.DateTime2, startOfMonth)
      .input('endOfMonth', sql.DateTime2, endOfMonth)
      .input('today', sql.DateTime2, now)
      .input('in7Days', sql.DateTime2, in7Days)
      .query(`
        SELECT
          ISNULL(SUM(CASE WHEN status = 'pago' THEN valor ELSE 0 END), 0) AS total_pago,
          ISNULL(SUM(CASE
            WHEN status = 'pendente' AND data_vencimento >= CAST(GETDATE() AS DATE) THEN valor
            ELSE 0
          END), 0) AS total_a_pagar,
          ISNULL(SUM(CASE
            WHEN status = 'pendente' AND data_vencimento < CAST(GETDATE() AS DATE) THEN valor
            ELSE 0
          END), 0) AS despesas_atrasadas,
          ISNULL(SUM(CASE
            WHEN status = 'pago'
              AND data_pagamento >= @startOfMonth AND data_pagamento <= @endOfMonth
            THEN valor ELSE 0
          END), 0) AS saidas_mes,
          COUNT(CASE
            WHEN status = 'pendente'
              AND data_vencimento >= @today AND data_vencimento <= @in7Days
            THEN 1 END) AS pagaveis_vencendo
        FROM org_payables
        WHERE organization_id = @orgId
      `)

    // Transactions diretas (sem vínculo com receivable/payable)
    // Período: para saldoMes | All-time: para saldoAtual
    const transResult = await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .input('startOfMonth', sql.DateTime2, startOfMonth)
      .input('endOfMonth', sql.DateTime2, endOfMonth)
      .query(`
        SELECT
          ISNULL(SUM(CASE WHEN tipo = 'entrada' AND receivable_id IS NULL
            AND data_transacao >= @startOfMonth AND data_transacao <= @endOfMonth
            THEN valor ELSE 0 END), 0) AS entradas_trans,
          ISNULL(SUM(CASE WHEN tipo = 'saida' AND payable_id IS NULL
            AND data_transacao >= @startOfMonth AND data_transacao <= @endOfMonth
            THEN valor ELSE 0 END), 0) AS saidas_trans,
          ISNULL(SUM(CASE WHEN tipo = 'entrada' AND receivable_id IS NULL THEN valor ELSE 0 END), 0) AS entradas_trans_total,
          ISNULL(SUM(CASE WHEN tipo = 'saida'   AND payable_id IS NULL    THEN valor ELSE 0 END), 0) AS saidas_trans_total
        FROM org_transactions
        WHERE organization_id = @orgId
      `)

    const rec   = recResult.recordset[0]
    const pay   = payResult.recordset[0]
    const trans = transResult.recordset[0]

    const totalRecebido     = Number(rec.total_recebido)
    const totalAReceber     = Number(rec.total_a_receber)
    const receitasAtrasadas = Number(rec.receitas_atrasadas)
    const totalPago         = Number(pay.total_pago)
    const totalAPagar       = Number(pay.total_a_pagar)
    const despesasAtrasadas = Number(pay.despesas_atrasadas)

    const entradasMes = Number(rec.entradas_mes) + Number(trans.entradas_trans)
    const saidasMes   = Number(pay.saidas_mes)   + Number(trans.saidas_trans)

    // saldoAtual inclui receivables recebidos + payables pagos + transações diretas (all-time)
    const saldoTransacoesDiretas = Number(trans.entradas_trans_total) - Number(trans.saidas_trans_total)

    // Fluxo de caixa: últimos 6 meses (fixo, independente do filtro de período)
    const fluxoCaixa = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const primeiro = new Date(d.getFullYear(), d.getMonth(), 1)
      const ultimo   = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)

      const cfResult = await pool
        .request()
        .input('orgId',    sql.UniqueIdentifier, user.organizationId)
        .input('primeiro', sql.DateTime2,        primeiro)
        .input('ultimo',   sql.DateTime2,        ultimo)
        .query(`
          SELECT
            (SELECT ISNULL(SUM(valor), 0) FROM org_receivables
              WHERE organization_id = @orgId AND status = 'recebido'
              AND data_recebimento >= @primeiro AND data_recebimento <= @ultimo) +
            (SELECT ISNULL(SUM(valor), 0) FROM org_transactions
              WHERE organization_id = @orgId AND tipo = 'entrada'
              AND receivable_id IS NULL
              AND data_transacao >= @primeiro AND data_transacao <= @ultimo) AS entradas,
            (SELECT ISNULL(SUM(valor), 0) FROM org_payables
              WHERE organization_id = @orgId AND status = 'pago'
              AND data_pagamento >= @primeiro AND data_pagamento <= @ultimo) +
            (SELECT ISNULL(SUM(valor), 0) FROM org_transactions
              WHERE organization_id = @orgId AND tipo = 'saida'
              AND payable_id IS NULL
              AND data_transacao >= @primeiro AND data_transacao <= @ultimo) AS saidas
        `)

      const { entradas, saidas } = cfResult.recordset[0]
      const mes         = d.toLocaleString('pt-BR', { month: 'short', year: 'numeric' })
      const mesCompleto = d.toLocaleString('pt-BR', { month: 'long',  year: 'numeric' })
      fluxoCaixa.push({
        mes,
        mesCompleto,
        entradas: Number(entradas),
        saidas:   Number(saidas),
        saldo:    Number(entradas) - Number(saidas),
      })
    }

    // Despesas por categoria — usa category_id FK (se preenchido) ou campo texto 'categoria'
    const catResult = await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(`
        SELECT
          COALESCE(cat.nome, NULLIF(p.categoria, ''), 'Sem categoria') AS categoria_nome,
          ISNULL(cat.cor, '#6b7280') AS categoria_cor,
          SUM(p.valor) AS total
        FROM org_payables p
        LEFT JOIN org_financial_categories cat ON cat.id = p.category_id
        WHERE p.organization_id = @orgId AND p.status = 'pago'
        GROUP BY cat.nome, cat.cor, p.categoria
        ORDER BY total DESC
      `)

    const despesasPorCategoria = catResult.recordset.map((r: Record<string, unknown>) => ({
      nome:  r.categoria_nome,
      cor:   r.categoria_cor,
      total: Number(r.total),
    }))

    return NextResponse.json({
      totalRecebido,
      totalAReceber,
      receitasAtrasadas,
      totalPago,
      totalAPagar,
      despesasAtrasadas,
      saldoAtual:          totalRecebido + saldoTransacoesDiretas - totalPago,
      saldoProjetado:      (totalRecebido + saldoTransacoesDiretas + totalAReceber) - (totalPago + totalAPagar),
      entradasMes,
      saidasMes,
      saldoMes:            entradasMes - saidasMes,
      recebiveisVencendo:  Number(rec.recebiveis_vencendo),
      pagaveisVencendo:    Number(pay.pagaveis_vencendo),
      fluxoCaixa,
      despesasPorCategoria,
    })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[GET /api/financial/stats]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
