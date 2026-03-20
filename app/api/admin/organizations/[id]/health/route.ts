import { NextResponse } from 'next/server'
import { requireMaster } from '@/lib/auth/session'
import { getPool, sql } from '@/lib/db'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireMaster()
    const { id } = await params
    const pool = await getPool()

    // ── Dados gerais da org ──────────────────────────────────────────────────
    const orgResult = await pool.request()
      .input('orgId', sql.UniqueIdentifier, id)
      .query(`
        SELECT
          o.id, o.name, o.[plan], o.state, o.created_at,
          -- Limites do plano free
          um.clients_count,
          um.orders_count,
          -- Última atividade
          (SELECT MAX(created_at) FROM org_service_orders WHERE organization_id = o.id) AS last_order_at,
          (SELECT MAX(created_at) FROM org_clients        WHERE organization_id = o.id) AS last_client_at,
          -- Atividade recente (últimos 7 dias)
          (SELECT COUNT(*) FROM org_service_orders WHERE organization_id = o.id AND created_at >= DATEADD(day,-7,GETDATE())) AS orders_7d,
          (SELECT COUNT(*) FROM org_clients        WHERE organization_id = o.id AND created_at >= DATEADD(day,-7,GETDATE())) AS clients_7d,
          -- Atividade recente (últimos 30 dias)
          (SELECT COUNT(*) FROM org_service_orders WHERE organization_id = o.id AND created_at >= DATEADD(day,-30,GETDATE())) AS orders_30d,
          -- Financeiro (receita estimada últimos 30 dias)
          (SELECT ISNULL(SUM(valor),0) FROM org_receivables WHERE organization_id = o.id AND created_at >= DATEADD(day,-30,GETDATE()) AND status = 'recebido') AS revenue_30d,
          -- Ordens por status
          (SELECT COUNT(*) FROM org_service_orders WHERE organization_id = o.id AND status = 'pendente')     AS orders_pending,
          (SELECT COUNT(*) FROM org_service_orders WHERE organization_id = o.id AND status = 'em_andamento') AS orders_in_progress,
          (SELECT COUNT(*) FROM org_service_orders WHERE organization_id = o.id AND status = 'concluido')    AS orders_done,
          -- Usuários
          (SELECT COUNT(*) FROM users WHERE organization_id = o.id) AS users_count
        FROM organizations o
        LEFT JOIN usage_metrics um ON um.organization_id = o.id
        WHERE o.id = @orgId
      `)

    if (orgResult.recordset.length === 0) {
      return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    }

    const org = orgResult.recordset[0]

    // ── Crescimento de clientes (últimos 6 meses) ────────────────────────────
    const growthResult = await pool.request()
      .input('orgId', sql.UniqueIdentifier, id)
      .query(`
        SELECT
          FORMAT(DATEFROMPARTS(YEAR(created_at), MONTH(created_at), 1), 'MMM/yy', 'pt-BR') AS label,
          FORMAT(DATEFROMPARTS(YEAR(created_at), MONTH(created_at), 1), 'yyyy-MM') AS ym,
          COUNT(*) AS new_clients
        FROM org_clients
        WHERE organization_id = @orgId
          AND created_at >= DATEADD(month,-6,GETDATE())
        GROUP BY YEAR(created_at), MONTH(created_at)
        ORDER BY ym ASC
      `)

    // ── Ordens recentes (últimas 10) ─────────────────────────────────────────
    const recentOrdersResult = await pool.request()
      .input('orgId', sql.UniqueIdentifier, id)
      .query(`
        SELECT TOP 10
          so.id, so.status, so.created_at,
          so.valor_total AS total_price,
          c.nome AS client_name,
          (SELECT TOP 1 i.service_nome FROM org_service_order_items i WHERE i.order_id = so.id) AS service_name
        FROM org_service_orders so
        LEFT JOIN org_clients c ON c.id = so.client_id
        WHERE so.organization_id = @orgId
        ORDER BY so.created_at DESC
      `)

    // ── Calcular alertas ─────────────────────────────────────────────────────
    const alerts: { type: 'warning' | 'danger' | 'info' | 'success'; message: string }[] = []

    const clientsCount  = Number(org.clients_count  ?? 0)
    const ordersCount   = Number(org.orders_count   ?? 0)
    const orders7d      = Number(org.orders_7d      ?? 0)
    const orders30d     = Number(org.orders_30d     ?? 0)
    const ordersPending = Number(org.orders_pending ?? 0)
    const daysSinceCad  = Math.floor((Date.now() - new Date(org.created_at).getTime()) / 86400000)

    const FREE_LIMITS = { clients: 50, orders: 100 }

    if (org.plan === 'free') {
      if (clientsCount >= FREE_LIMITS.clients * 0.9)
        alerts.push({ type: 'danger',  message: `${clientsCount}/${FREE_LIMITS.clients} clientes — limite quase atingido` })
      else if (clientsCount >= FREE_LIMITS.clients * 0.7)
        alerts.push({ type: 'warning', message: `${clientsCount}/${FREE_LIMITS.clients} clientes (${Math.round(clientsCount/FREE_LIMITS.clients*100)}% do limite)` })

      if (ordersCount >= FREE_LIMITS.orders * 0.9)
        alerts.push({ type: 'danger',  message: `${ordersCount}/${FREE_LIMITS.orders} ordens — limite quase atingido` })
      else if (ordersCount >= FREE_LIMITS.orders * 0.7)
        alerts.push({ type: 'warning', message: `${ordersCount}/${FREE_LIMITS.orders} ordens (${Math.round(ordersCount/FREE_LIMITS.orders*100)}% do limite)` })
    }

    if (!org.last_order_at && daysSinceCad > 7)
      alerts.push({ type: 'warning', message: 'Nenhuma ordem criada desde o cadastro' })
    else if (org.last_order_at) {
      const daysSinceOrder = Math.floor((Date.now() - new Date(org.last_order_at).getTime()) / 86400000)
      if (daysSinceOrder > 14)
        alerts.push({ type: 'warning', message: `Sem atividade há ${daysSinceOrder} dias` })
    }

    if (ordersPending > 10)
      alerts.push({ type: 'warning', message: `${ordersPending} ordens pendentes acumuladas` })

    if (orders30d > 20 && org.plan === 'free')
      alerts.push({ type: 'info', message: `Alta atividade (${orders30d} ordens/mês) — candidato a upgrade` })

    if (alerts.length === 0)
      alerts.push({ type: 'success', message: 'Sem alertas — organização saudável' })

    // ── Score de saúde (0–100) ───────────────────────────────────────────────
    let score = 100
    if (!org.last_order_at) score -= 30
    else {
      const d = Math.floor((Date.now() - new Date(org.last_order_at).getTime()) / 86400000)
      if (d > 30) score -= 30
      else if (d > 14) score -= 15
      else if (d > 7) score -= 5
    }
    if (orders7d === 0) score -= 10
    if (ordersPending > 10) score -= 10
    if (org.state === 'suspended') score -= 40
    if (org.state === 'cancelled') score = 0
    score = Math.max(0, score)

    return NextResponse.json({
      org: {
        id:          org.id as string,
        name:        org.name as string,
        plan:        org.plan as string,
        state:       org.state as string,
        created_at:  org.created_at as string,
        days_since_creation: daysSinceCad,
      },
      health: {
        score,
        status: score >= 75 ? 'healthy' : score >= 40 ? 'at_risk' : 'critical',
        alerts,
      },
      metrics: {
        clients_count:   clientsCount,
        orders_count:    ordersCount,
        orders_7d:       orders7d,
        orders_30d:      orders30d,
        orders_pending:  ordersPending,
        orders_in_progress: Number(org.orders_in_progress ?? 0),
        orders_done:     Number(org.orders_done ?? 0),
        users_count:     Number(org.users_count ?? 0),
        revenue_30d:     parseFloat(org.revenue_30d) || 0,
        last_order_at:   org.last_order_at as string | null,
        last_client_at:  org.last_client_at as string | null,
      },
      limits: org.plan === 'free' ? {
        clients: { used: clientsCount,  max: FREE_LIMITS.clients,  pct: Math.round(clientsCount /FREE_LIMITS.clients *100) },
        orders:  { used: ordersCount,   max: FREE_LIMITS.orders,   pct: Math.round(ordersCount  /FREE_LIMITS.orders  *100) },
      } : null,
      client_growth: growthResult.recordset.map(r => ({
        label:       r.label as string,
        new_clients: Number(r.new_clients),
      })),
      recent_orders: recentOrdersResult.recordset.map(r => ({
        id:           r.id as string,
        status:       r.status as string,
        created_at:   r.created_at as string,
        total_price:  parseFloat(r.total_price) || 0,
        client_name:  r.client_name as string | null,
        service_name: r.service_name as string | null,
      })),
    })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    console.error('[GET /api/admin/organizations/:id/health]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
