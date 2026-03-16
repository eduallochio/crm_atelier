import { NextResponse } from 'next/server'
import { requireMaster } from '@/lib/auth/session'
import { getPool, sql } from '@/lib/db'

export async function GET() {
  try {
    await requireMaster()
    const pool = await getPool()

    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const orgsResult = await pool
      .request()
      .input('oneWeekAgo', sql.DateTime2, oneWeekAgo)
      .input('oneMonthAgo', sql.DateTime2, oneMonthAgo)
      .query(`
        SELECT
          COUNT(*) AS total_organizations,
          SUM(CASE WHEN state = 'active' THEN 1 ELSE 0 END) AS active_organizations,
          SUM(CASE WHEN state = 'trial' THEN 1 ELSE 0 END) AS trial_organizations,
          SUM(CASE WHEN state = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_organizations,
          SUM(CASE WHEN [plan] = 'free' THEN 1 ELSE 0 END) AS free_plan_count,
          SUM(CASE WHEN [plan] = 'pro' THEN 1 ELSE 0 END) AS pro_plan_count,
          SUM(CASE WHEN created_at >= @oneWeekAgo THEN 1 ELSE 0 END) AS new_this_week,
          SUM(CASE WHEN created_at >= @oneMonthAgo THEN 1 ELSE 0 END) AS new_this_month
        FROM organizations
      `)

    const usersResult = await pool
      .request()
      .query(`SELECT COUNT(*) AS total_users FROM users`)

    // Preços reais da tabela plans
    const plansResult = await pool
      .request()
      .query(`SELECT slug, price FROM plans WHERE is_active = 1`)
    const planPrices: Record<string, number> = { free: 0, pro: 0 }
    for (const p of plansResult.recordset) {
      planPrices[p.slug] = parseFloat(p.price) || 0
    }

    const o          = orgsResult.recordset[0]
    const proCount   = Number(o.pro_plan_count)
    const mrrTotal   = proCount * (planPrices.pro ?? 0)
    const total      = Number(o.total_organizations)
    const cancelled  = Number(o.cancelled_organizations)
    const churnRate  = total > 0 ? Math.round((cancelled / total) * 1000) / 10 : 0

    return NextResponse.json({
      totalOrganizations:     total,
      activeOrganizations:    Number(o.active_organizations),
      trialOrganizations:     Number(o.trial_organizations),
      cancelledOrganizations: cancelled,
      freePlanCount:          Number(o.free_plan_count),
      proPlanCount:           proCount,
      newThisWeek:            Number(o.new_this_week),
      newThisMonth:           Number(o.new_this_month),
      totalUsers:             Number(usersResult.recordset[0].total_users),
      activeOrgsThisWeek:     Number(o.active_organizations),
      mrrTotal,
      churnRate,
      planPrices,
    })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[GET /api/admin/dashboard]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
