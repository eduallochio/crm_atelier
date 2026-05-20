import { NextResponse } from 'next/server'
import { requireMaster } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { organizations, profiles, plans } from '@/lib/db/schema'
import { eq, gte, sql as drizzleSql, count } from 'drizzle-orm'

export async function GET() {
  try {
    await requireMaster()

    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Preços reais da tabela plans
    const planRows = await db
      .select({ slug: plans.slug, price: plans.price })
      .from(plans)
      .where(eq(plans.isActive, true))

    const planPrices: Record<string, number> = {}
    for (const p of planRows) {
      planPrices[p.slug] = parseFloat(p.price) || 0
    }

    // Aggregate org stats
    const orgsStats = await db
      .select({
        total: count(),
        activeCount: drizzleSql<number>`COUNT(*) FILTER (WHERE subscription_status = 'active')`,
        trialCount: drizzleSql<number>`COUNT(*) FILTER (WHERE subscription_status = 'trialing')`,
        cancelledCount: drizzleSql<number>`COUNT(*) FILTER (WHERE subscription_status = 'cancelled')`,
        freeCount: drizzleSql<number>`COUNT(*) FILTER (WHERE plan = 'free')`,
        proCount: drizzleSql<number>`COUNT(*) FILTER (WHERE plan = 'pro')`,
        newThisWeek: drizzleSql<number>`COUNT(*) FILTER (WHERE created_at >= ${oneWeekAgo.toISOString()})`,
        newThisMonth: drizzleSql<number>`COUNT(*) FILTER (WHERE created_at >= ${oneMonthAgo.toISOString()})`,
      })
      .from(organizations)

    const totalUsersResult = await db.select({ count: count() }).from(profiles)

    const o = orgsStats[0]
    const proCount = Number(o.proCount)
    const totalOrgs = Number(o.total)
    const cancelled = Number(o.cancelledCount)
    const mrrTotal = proCount * (planPrices.pro ?? 0)
    const churnRate = totalOrgs > 0 ? Math.round((cancelled / totalOrgs) * 1000) / 10 : 0

    return NextResponse.json({
      totalOrganizations: totalOrgs,
      activeOrganizations: Number(o.activeCount),
      trialOrganizations: Number(o.trialCount),
      cancelledOrganizations: cancelled,
      freePlanCount: Number(o.freeCount),
      proPlanCount: proCount,
      newThisWeek: Number(o.newThisWeek),
      newThisMonth: Number(o.newThisMonth),
      totalUsers: Number(totalUsersResult[0]?.count ?? 0),
      activeOrgsThisWeek: Number(o.activeCount),
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
