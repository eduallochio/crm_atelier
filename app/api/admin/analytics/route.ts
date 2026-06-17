import { NextResponse } from 'next/server'
import { requireMaster } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { organizations, orgClients, orgServiceOrders, plans } from '@/lib/db/schema'
import { eq, gte, sql as drizzleSql, count } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'

export async function GET() {
  try {
    await requireMaster()

    // Preços reais da tabela plans
    const planRows = await db
      .select({ slug: plans.slug, price: plans.price })
      .from(plans)
      .where(eq(plans.isActive, true))

    const planPrices: Record<string, number> = {}
    for (const p of planRows) {
      planPrices[p.slug] = parseFloat(p.price) || 0
    }

    // Crescimento mensal (últimos 12 meses)
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    const growthResult = await db
      .select({
        ym: drizzleSql<string>`TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM')`,
        monthLabel: drizzleSql<string>`TO_CHAR(created_at, 'Mon')`,
        newOrgs: count(),
        proCount: drizzleSql<number>`COUNT(*) FILTER (WHERE plan = 'pro')::int`,
      })
      .from(organizations)
      .where(gte(organizations.createdAt, twelveMonthsAgo))
      .groupBy(
        drizzleSql`DATE_TRUNC('month', created_at)`,
        drizzleSql`TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM')`,
        drizzleSql`TO_CHAR(created_at, 'Mon')`,
      )
      .orderBy(drizzleSql`DATE_TRUNC('month', created_at) ASC`)

    let prevNewOrgs = 0
    const monthly = growthResult.map((r) => {
      const newOrgs = Number(r.newOrgs)
      const revenue = Number(r.proCount) * (planPrices.pro ?? 0)
      const growth = prevNewOrgs > 0 ? Math.round(((newOrgs - prevNewOrgs) / prevNewOrgs) * 1000) / 10 : 0
      prevNewOrgs = newOrgs
      return {
        month: r.monthLabel,
        users: newOrgs,
        revenue: Math.round(revenue * 100) / 100,
        growth,
      }
    })

    // Distribuição por plano
    const distResult = await db
      .select({
        plan: organizations.plan,
        cnt: count(),
      })
      .from(organizations)
      .groupBy(organizations.plan)

    const planDist: Record<string, number> = {}
    for (const r of distResult) {
      planDist[r.plan] = Number(r.cnt)
    }

    // Top organizações por clientes — JOIN + GROUP BY evita correlated subqueries
    const topResult = await db.execute(drizzleSql`
      SELECT
        o.id,
        o.name,
        o.plan,
        o.subscription_status AS "subscriptionStatus",
        COUNT(DISTINCT c.id)::int  AS "clientsCount",
        COUNT(DISTINCT os.id)::int AS "ordersCount"
      FROM organizations o
      LEFT JOIN org_clients        c  ON c.organization_id  = o.id
      LEFT JOIN org_service_orders os ON os.organization_id = o.id
      GROUP BY o.id, o.name, o.plan, o.subscription_status
      ORDER BY COUNT(DISTINCT c.id) DESC
      LIMIT 10
    `) as any[]

    const topOrgs = (topResult as any[]).map((r) => ({
      id:            r.id,
      name:          r.name,
      plan:          r.plan,
      revenue:       planPrices[r.plan] ?? 0,
      clients_count: Number(r.clientsCount ?? 0),
      orders_count:  Number(r.ordersCount ?? 0),
      growth:        0,
    }))

    // Churn
    const churnResult = await db
      .select({
        total: count(),
        cancelled: drizzleSql<number>`COUNT(*) FILTER (WHERE subscription_status = 'cancelled')::int`,
      })
      .from(organizations)

    const cr = churnResult[0]
    const churnTotal     = Number(cr.total)
    const churnCancelled = Number(cr.cancelled)
    const churnRate      = churnTotal > 0 ? Math.round((churnCancelled / churnTotal) * 1000) / 10 : 0

    return NextResponse.json({
      monthly,
      planDistribution: planDist,
      churn: {
        rate:      churnRate,
        cancelled: churnCancelled,
        total:     churnTotal,
        trend:     'down' as const,
        reasons:   [
          { reason: 'Sem uso ativo', count: churnCancelled, percentage: churnCancelled > 0 ? 100 : 0 },
        ],
      },
      topOrgs,
    })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    logServerError('[GET /api/admin/analytics]', error); console.error('[GET /api/admin/analytics]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
