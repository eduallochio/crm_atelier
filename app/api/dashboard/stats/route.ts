import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getPool, sql } from '@/lib/db'

export async function GET() {
  try {
    const user = await requireAuth()
    const pool = await getPool()

    // Métricas reais contadas diretamente nas tabelas (evita dessincronia com usage_metrics)
    const metricsResult = await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(`
        SELECT
          (SELECT COUNT(*) FROM org_clients    WHERE organization_id = @orgId) AS clients_count,
          (SELECT COUNT(*) FROM org_service_orders WHERE organization_id = @orgId)                    AS orders_count,
          (SELECT COUNT(*) FROM users          WHERE organization_id = @orgId)                        AS users_count
      `)

    const metrics = metricsResult.recordset[0] ?? {
      clients_count: 0,
      orders_count: 0,
      users_count: 1,
    }

    // Receita do mês atual (ordens concluídas)
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    const revenueResult = await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .input('month', sql.Int, currentMonth)
      .input('year', sql.Int, currentYear)
      .query(`
        SELECT ISNULL(SUM(valor_total), 0) AS monthly_revenue
        FROM org_service_orders
        WHERE organization_id = @orgId
          AND status = 'concluido'
          AND data_conclusao IS NOT NULL
          AND MONTH(data_conclusao) = @month
          AND YEAR(data_conclusao) = @year
      `)

    const monthlyRevenue = revenueResult.recordset[0]?.monthly_revenue ?? 0

    // Plano da organização
    const orgResult = await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(`SELECT [plan] FROM organizations WHERE id = @orgId`)

    const plan = orgResult.recordset[0]?.plan ?? 'free'

    // Atividades recentes: últimos 5 clientes + 5 ordens
    const recentClientsResult = await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(`
        SELECT TOP 5 id, nome, created_at
        FROM org_clients
        WHERE organization_id = @orgId
        ORDER BY created_at DESC
      `)

    const recentOrdersResult = await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(`
        SELECT TOP 5 o.id, o.numero, o.created_at, o.status, c.nome AS client_nome
        FROM org_service_orders o
        LEFT JOIN org_clients c ON c.id = o.client_id
        WHERE o.organization_id = @orgId
        ORDER BY o.created_at DESC
      `)

    const activities = [
      ...recentClientsResult.recordset.map((c: { id: string; nome: string; created_at: string }) => ({
        id: `client-${c.id}`,
        type: 'client',
        title: 'Novo cliente cadastrado',
        description: c.nome,
        timestamp: c.created_at,
      })),
      ...recentOrdersResult.recordset.map((o: { id: string; numero: number; created_at: string; status: string; client_nome: string }) => ({
        id: `order-${o.id}`,
        type: o.status === 'concluido' ? 'order_completed' : 'order',
        title: o.status === 'concluido' ? 'Ordem concluída' : 'Nova ordem criada',
        description: `${o.numero} - ${o.client_nome || 'Cliente não informado'}`,
        timestamp: o.created_at,
        metadata: {
          orderNumber: o.numero,
          clientName: o.client_nome,
          status: o.status,
        },
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)

    // ── Saúde financeira ──────────────────────────────────────────
    const todayDate = new Date()
    todayDate.setHours(0, 0, 0, 0)
    const next7d = new Date(todayDate)
    next7d.setDate(next7d.getDate() + 7)
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1
    const prevYear  = currentMonth === 1 ? currentYear - 1 : currentYear

    const financialHealthResult = await pool
      .request()
      .input('orgId',      sql.UniqueIdentifier, user.organizationId)
      .input('today',      sql.Date, todayDate)
      .input('next7d',     sql.Date, next7d)
      .input('prevMonth',  sql.Int,  prevMonth)
      .input('prevYear',   sql.Int,  prevYear)
      .query(`
        SELECT
          -- A receber: pendente (não vencido)
          (SELECT ISNULL(SUM(valor), 0) FROM org_receivables
           WHERE organization_id = @orgId AND status = 'pendente'
             AND CAST(data_vencimento AS DATE) >= @today) AS receivables_pending,

          -- A receber: vencido
          (SELECT ISNULL(SUM(valor), 0) FROM org_receivables
           WHERE organization_id = @orgId AND status = 'pendente'
             AND CAST(data_vencimento AS DATE) < @today) AS receivables_overdue,

          -- A pagar: pendente (não vencido)
          (SELECT ISNULL(SUM(valor), 0) FROM org_payables
           WHERE organization_id = @orgId AND status = 'pendente'
             AND CAST(data_vencimento AS DATE) >= @today) AS payables_pending,

          -- A pagar: vencido
          (SELECT ISNULL(SUM(valor), 0) FROM org_payables
           WHERE organization_id = @orgId AND status = 'pendente'
             AND CAST(data_vencimento AS DATE) < @today) AS payables_overdue,

          -- Próximos 7 dias: a receber
          (SELECT ISNULL(SUM(valor), 0) FROM org_receivables
           WHERE organization_id = @orgId AND status = 'pendente'
             AND CAST(data_vencimento AS DATE) BETWEEN @today AND @next7d) AS receivables_7d,

          -- Próximos 7 dias: a pagar
          (SELECT ISNULL(SUM(valor), 0) FROM org_payables
           WHERE organization_id = @orgId AND status = 'pendente'
             AND CAST(data_vencimento AS DATE) BETWEEN @today AND @next7d) AS payables_7d,

          -- Pipeline: valor das ordens em aberto
          (SELECT ISNULL(SUM(valor_total), 0) FROM org_service_orders
           WHERE organization_id = @orgId
             AND status IN ('pendente', 'em_andamento')) AS pipeline_value,

          -- Receita mês anterior
          (SELECT ISNULL(SUM(valor_total), 0) FROM org_service_orders
           WHERE organization_id = @orgId AND status = 'concluido'
             AND MONTH(data_conclusao) = @prevMonth
             AND YEAR(data_conclusao) = @prevYear) AS prev_month_revenue
      `)

    const financialHealth = financialHealthResult.recordset[0] ?? {
      receivables_pending: 0, receivables_overdue: 0,
      payables_pending: 0,    payables_overdue: 0,
      receivables_7d: 0,      payables_7d: 0,
      pipeline_value: 0,      prev_month_revenue: 0,
    }

    // ── Top clientes por receita ───────────────────────────────
    const topClientsResult = await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(`
        SELECT TOP 5
          c.id,
          c.nome,
          COUNT(o.id)                    AS order_count,
          ISNULL(SUM(o.valor_total), 0)  AS total_revenue,
          MAX(o.created_at)              AS last_order_date
        FROM org_clients c
        INNER JOIN org_service_orders o
          ON o.client_id = c.id
          AND o.organization_id = @orgId
          AND o.status = 'concluido'
        WHERE c.organization_id = @orgId
        GROUP BY c.id, c.nome
        ORDER BY total_revenue DESC
      `)

    const topClients = topClientsResult.recordset

    // ── Clientes inativos (sem ordem nos últimos 60 dias) ─────
    const inactiveResult = await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(`
        SELECT COUNT(*) AS inactive_count
        FROM org_clients c
        WHERE c.organization_id = @orgId
          AND NOT EXISTS (
            SELECT 1 FROM org_service_orders o
            WHERE o.client_id = c.id
              AND o.organization_id = @orgId
              AND o.created_at >= DATEADD(DAY, -60, GETDATE())
          )
      `)

    const inactiveClientsCount = inactiveResult.recordset[0]?.inactive_count ?? 0

    // Ordens urgentes (próximas 7 dias, pendente/em_andamento)
    const deadline = new Date()
    deadline.setDate(deadline.getDate() + 7)

    const urgentResult = await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .input('deadline', sql.DateTime2, deadline)
      .query(`
        SELECT TOP 5
          o.id, o.numero, o.data_prevista, o.status, o.valor_total,
          c.nome AS client_nome
        FROM org_service_orders o
        LEFT JOIN org_clients c ON c.id = o.client_id
        WHERE o.organization_id = @orgId
          AND o.status IN ('pendente', 'em_andamento')
          AND o.data_prevista IS NOT NULL
          AND o.data_prevista <= @deadline
        ORDER BY o.data_prevista ASC
      `)

    const urgentOrders = urgentResult.recordset.map((o: Record<string, unknown>) => ({
      ...o,
      client: { nome: o.client_nome },
    }))

    return NextResponse.json({
      metrics,
      monthly_revenue: monthlyRevenue,
      plan,
      recent_activities: activities,
      urgent_orders: urgentOrders,
      financial_health: financialHealth,
      top_clients: topClients,
      inactive_clients_count: inactiveClientsCount,
    })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[GET /api/dashboard/stats]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
