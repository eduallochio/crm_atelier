import { NextResponse } from 'next/server'
import { requireMaster } from '@/lib/auth/session'
import { getPool } from '@/lib/db'

export async function GET() {
  try {
    await requireMaster()
    const pool = await getPool()

    // ── Preços reais ────────────────────────────────────────────────────────
    const plansResult = await pool
      .request()
      .query(`SELECT slug, price FROM plans WHERE is_active = 1`)
    const planPrices: Record<string, number> = { free: 0, pro: 0 }
    for (const p of plansResult.recordset) {
      planPrices[p.slug] = parseFloat(p.price) || 0
    }

    // ── Crescimento mensal (últimos 12 meses) ───────────────────────────────
    const growthResult = await pool.request().query(`
      SELECT
        FORMAT(created_at, 'yyyy-MM') AS ym,
        FORMAT(created_at, 'MMM', 'pt-BR') AS month_label,
        COUNT(*) AS new_orgs,
        SUM(CASE WHEN [plan] = 'pro' THEN 1 ELSE 0 END) AS pro_count
      FROM organizations
      WHERE created_at >= DATEADD(month, -12, GETDATE())
      GROUP BY FORMAT(created_at, 'yyyy-MM'), FORMAT(created_at, 'MMM', 'pt-BR')
      ORDER BY ym ASC
    `)

    let prevNewOrgs = 0
    const monthly = growthResult.recordset.map((r) => {
      const newOrgs = Number(r.new_orgs)
      const revenue = Number(r.pro_count) * (planPrices.pro ?? 0)
      const growth = prevNewOrgs > 0 ? Math.round(((newOrgs - prevNewOrgs) / prevNewOrgs) * 1000) / 10 : 0
      prevNewOrgs = newOrgs
      return {
        month:   r.month_label as string,
        users:   newOrgs,
        revenue: Math.round(revenue * 100) / 100,
        growth,
      }
    })

    // ── Distribuição por plano ──────────────────────────────────────────────
    const distResult = await pool.request().query(`
      SELECT [plan], COUNT(*) AS cnt
      FROM organizations
      GROUP BY [plan]
    `)
    const planDist: Record<string, number> = {}
    for (const r of distResult.recordset) {
      planDist[r.plan as string] = Number(r.cnt)
    }

    // ── Top organizações por clientes ───────────────────────────────────────
    const topResult = await pool.request().query(`
      SELECT TOP 10
        o.id, o.name, o.[plan], o.state,
        (SELECT COUNT(*) FROM org_clients c WHERE c.organization_id = o.id) AS clients_count,
        (SELECT COUNT(*) FROM org_service_orders so WHERE so.organization_id = o.id) AS orders_count
      FROM organizations o
      ORDER BY clients_count DESC
    `)

    const topOrgs = topResult.recordset.map((r) => ({
      id:            r.id as string,
      name:          r.name as string,
      plan:          r.plan as string,
      revenue:       planPrices[r.plan as string] ?? 0,
      clients_count: Number(r.clients_count),
      orders_count:  Number(r.orders_count),
      growth:        0,
    }))

    // ── Churn ───────────────────────────────────────────────────────────────
    const churnResult = await pool.request().query(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN state = 'cancelled' THEN 1 ELSE 0 END) AS cancelled
      FROM organizations
    `)
    const cr = churnResult.recordset[0]
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
    console.error('[GET /api/admin/analytics]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
