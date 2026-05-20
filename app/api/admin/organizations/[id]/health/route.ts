import { NextResponse } from 'next/server'
import { requireMaster } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { organizations, usageMetrics, orgServiceOrders, orgClients, orgReceivables, profiles } from '@/lib/db/schema'
import { eq, and, gte, lt, sql as drizzleSql, count } from 'drizzle-orm'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireMaster()
    const { id } = await params

    const sevenDaysAgo  = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Org + usage metrics
    const orgRows = await db
      .select({
        id:                 organizations.id,
        name:               organizations.name,
        plan:               organizations.plan,
        subscriptionStatus: organizations.subscriptionStatus,
        createdAt:          organizations.createdAt,
        clientsCount:       usageMetrics.clientsCount,
        ordersCount:        usageMetrics.ordersCount,
        lastOrderAt:        drizzleSql<string | null>`(SELECT MAX(created_at) FROM org_service_orders WHERE organization_id = ${organizations.id})`,
        lastClientAt:       drizzleSql<string | null>`(SELECT MAX(created_at) FROM org_clients WHERE organization_id = ${organizations.id})`,
        orders7d:           drizzleSql<number>`(SELECT COUNT(*) FROM org_service_orders WHERE organization_id = ${organizations.id} AND created_at >= ${sevenDaysAgo.toISOString()})::int`,
        orders30d:          drizzleSql<number>`(SELECT COUNT(*) FROM org_service_orders WHERE organization_id = ${organizations.id} AND created_at >= ${thirtyDaysAgo.toISOString()})::int`,
        revenue30d:         drizzleSql<string>`COALESCE((SELECT SUM(valor) FROM org_receivables WHERE organization_id = ${organizations.id} AND created_at >= ${thirtyDaysAgo.toISOString()} AND status = 'recebido'), 0)`,
        ordersPending:      drizzleSql<number>`(SELECT COUNT(*) FROM org_service_orders WHERE organization_id = ${organizations.id} AND status = 'pendente')::int`,
        ordersInProgress:   drizzleSql<number>`(SELECT COUNT(*) FROM org_service_orders WHERE organization_id = ${organizations.id} AND status = 'em_andamento')::int`,
        ordersDone:         drizzleSql<number>`(SELECT COUNT(*) FROM org_service_orders WHERE organization_id = ${organizations.id} AND status = 'concluido')::int`,
        usersCount:         drizzleSql<number>`(SELECT COUNT(*) FROM profiles WHERE organization_id = ${organizations.id})::int`,
      })
      .from(organizations)
      .leftJoin(usageMetrics, eq(usageMetrics.organizationId, organizations.id))
      .where(eq(organizations.id, id))
      .limit(1)

    if (orgRows.length === 0) {
      return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    }

    const org = orgRows[0]

    // Client growth (last 6 months)
    const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const growthRows = await db
      .select({
        label:      drizzleSql<string>`TO_CHAR(DATE_TRUNC('month', created_at), 'Mon/YY')`,
        ym:         drizzleSql<string>`TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM')`,
        newClients: count(),
      })
      .from(orgClients)
      .where(and(
        eq(orgClients.organizationId, id),
        gte(orgClients.createdAt, sixMonthsAgo),
      ))
      .groupBy(drizzleSql`DATE_TRUNC('month', created_at)`)
      .orderBy(drizzleSql`DATE_TRUNC('month', created_at) ASC`)

    // Recent orders (last 10)
    const recentOrders = await db
      .select({
        id:          orgServiceOrders.id,
        status:      orgServiceOrders.status,
        createdAt:   orgServiceOrders.createdAt,
        totalPrice:  orgServiceOrders.valorTotal,
        clientName:  orgClients.nome,
        serviceName: drizzleSql<string | null>`(SELECT service_nome FROM org_service_order_items WHERE order_id = ${orgServiceOrders.id} LIMIT 1)`,
      })
      .from(orgServiceOrders)
      .leftJoin(orgClients, eq(orgClients.id, orgServiceOrders.clientId))
      .where(eq(orgServiceOrders.organizationId, id))
      .orderBy(drizzleSql`${orgServiceOrders.createdAt} DESC`)
      .limit(10)

    // Alerts
    const alerts: { type: 'warning' | 'danger' | 'info' | 'success'; message: string }[] = []

    const clientsCount  = Number(org.clientsCount  ?? 0)
    const ordersCount   = Number(org.ordersCount   ?? 0)
    const orders7d      = Number(org.orders7d      ?? 0)
    const orders30d     = Number(org.orders30d     ?? 0)
    const ordersPending = Number(org.ordersPending ?? 0)
    const daysSinceCad  = Math.floor((Date.now() - new Date(org.createdAt!).getTime()) / 86400000)

    const FREE_LIMITS = { clients: 50, orders: 100 }

    if (org.plan === 'free') {
      if (clientsCount >= FREE_LIMITS.clients * 0.9)
        alerts.push({ type: 'danger', message: `${clientsCount}/${FREE_LIMITS.clients} clientes — limite quase atingido` })
      else if (clientsCount >= FREE_LIMITS.clients * 0.7)
        alerts.push({ type: 'warning', message: `${clientsCount}/${FREE_LIMITS.clients} clientes (${Math.round(clientsCount / FREE_LIMITS.clients * 100)}% do limite)` })

      if (ordersCount >= FREE_LIMITS.orders * 0.9)
        alerts.push({ type: 'danger', message: `${ordersCount}/${FREE_LIMITS.orders} ordens — limite quase atingido` })
      else if (ordersCount >= FREE_LIMITS.orders * 0.7)
        alerts.push({ type: 'warning', message: `${ordersCount}/${FREE_LIMITS.orders} ordens (${Math.round(ordersCount / FREE_LIMITS.orders * 100)}% do limite)` })
    }

    if (!org.lastOrderAt && daysSinceCad > 7)
      alerts.push({ type: 'warning', message: 'Nenhuma ordem criada desde o cadastro' })
    else if (org.lastOrderAt) {
      const daysSinceOrder = Math.floor((Date.now() - new Date(org.lastOrderAt).getTime()) / 86400000)
      if (daysSinceOrder > 14)
        alerts.push({ type: 'warning', message: `Sem atividade há ${daysSinceOrder} dias` })
    }

    if (ordersPending > 10)
      alerts.push({ type: 'warning', message: `${ordersPending} ordens pendentes acumuladas` })

    if (orders30d > 20 && org.plan === 'free')
      alerts.push({ type: 'info', message: `Alta atividade (${orders30d} ordens/mês) — candidato a upgrade` })

    if (alerts.length === 0)
      alerts.push({ type: 'success', message: 'Sem alertas — organização saudável' })

    // Health score
    let score = 100
    if (!org.lastOrderAt) score -= 30
    else {
      const d = Math.floor((Date.now() - new Date(org.lastOrderAt).getTime()) / 86400000)
      if (d > 30) score -= 30
      else if (d > 14) score -= 15
      else if (d > 7) score -= 5
    }
    if (orders7d === 0) score -= 10
    if (ordersPending > 10) score -= 10
    if (org.subscriptionStatus === 'suspended') score -= 40
    if (org.subscriptionStatus === 'cancelled') score = 0
    score = Math.max(0, score)

    return NextResponse.json({
      org: {
        id:          org.id,
        name:        org.name,
        plan:        org.plan,
        state:       org.subscriptionStatus,
        created_at:  org.createdAt,
        days_since_creation: daysSinceCad,
      },
      health: {
        score,
        status: score >= 75 ? 'healthy' : score >= 40 ? 'at_risk' : 'critical',
        alerts,
      },
      metrics: {
        clients_count:      clientsCount,
        orders_count:       ordersCount,
        orders_7d:          orders7d,
        orders_30d:         orders30d,
        orders_pending:     ordersPending,
        orders_in_progress: Number(org.ordersInProgress ?? 0),
        orders_done:        Number(org.ordersDone ?? 0),
        users_count:        Number(org.usersCount ?? 0),
        revenue_30d:        parseFloat(org.revenue30d) || 0,
        last_order_at:      org.lastOrderAt,
        last_client_at:     org.lastClientAt,
      },
      limits: org.plan === 'free' ? {
        clients: { used: clientsCount, max: FREE_LIMITS.clients, pct: Math.round(clientsCount / FREE_LIMITS.clients * 100) },
        orders:  { used: ordersCount,  max: FREE_LIMITS.orders,  pct: Math.round(ordersCount  / FREE_LIMITS.orders  * 100) },
      } : null,
      client_growth: growthRows.map((r) => ({
        label:       r.label,
        new_clients: Number(r.newClients),
      })),
      recent_orders: recentOrders.map((r) => ({
        id:           r.id,
        status:       r.status,
        created_at:   r.createdAt,
        total_price:  parseFloat(r.totalPrice) || 0,
        client_name:  r.clientName,
        service_name: r.serviceName,
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
