import { NextResponse } from 'next/server'
import { requireMaster } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgClients, orgServiceOrders, orgServices, profiles } from '@/lib/db/schema'
import { eq, and, gte, sql as drizzleSql, count } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireMaster()
    const { id } = await params

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    // Totals
    const [totalClients, totalOrders, totalServices, totalUsers, ordersThisMonth] = await Promise.all([
      db.select({ count: count() }).from(orgClients).where(eq(orgClients.organizationId, id)),
      db.select({ count: count() }).from(orgServiceOrders).where(eq(orgServiceOrders.organizationId, id)),
      db.select({ count: count() }).from(orgServices).where(and(eq(orgServices.organizationId, id), eq(orgServices.ativo, true))),
      db.select({ count: count() }).from(profiles).where(eq(profiles.organizationId, id)),
      db.select({ count: count() }).from(orgServiceOrders).where(
        and(eq(orgServiceOrders.organizationId, id), gte(orgServiceOrders.createdAt, startOfMonth))
      ),
    ])

    // Monthly growth (last 6 months) — clients and orders combined
    const clientGrowth = await db
      .select({
        ym:         drizzleSql<string>`TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM')`,
        monthLabel: drizzleSql<string>`TO_CHAR(created_at, 'Mon')`,
        newClients: count(),
      })
      .from(orgClients)
      .where(and(eq(orgClients.organizationId, id), gte(orgClients.createdAt, sixMonthsAgo)))
      .groupBy(drizzleSql`DATE_TRUNC('month', created_at)`)
      .orderBy(drizzleSql`DATE_TRUNC('month', created_at) ASC`)

    const orderGrowth = await db
      .select({
        ym:        drizzleSql<string>`TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM')`,
        newOrders: count(),
      })
      .from(orgServiceOrders)
      .where(and(eq(orgServiceOrders.organizationId, id), gte(orgServiceOrders.createdAt, sixMonthsAgo)))
      .groupBy(drizzleSql`DATE_TRUNC('month', created_at)`)
      .orderBy(drizzleSql`DATE_TRUNC('month', created_at) ASC`)

    // Merge into monthly array
    const monthMap: Record<string, { month: string; newClients: number; newOrders: number }> = {}
    for (const r of clientGrowth) {
      monthMap[r.ym] = { month: r.monthLabel, newClients: Number(r.newClients), newOrders: 0 }
    }
    for (const r of orderGrowth) {
      if (monthMap[r.ym]) {
        monthMap[r.ym].newOrders = Number(r.newOrders)
      } else {
        monthMap[r.ym] = { month: r.ym, newClients: 0, newOrders: Number(r.newOrders) }
      }
    }
    const monthly = Object.values(monthMap)

    // Orders by status
    const statusRows = await db
      .select({
        status: orgServiceOrders.status,
        cnt:    count(),
      })
      .from(orgServiceOrders)
      .where(eq(orgServiceOrders.organizationId, id))
      .groupBy(orgServiceOrders.status)

    const ordersByStatus: Record<string, number> = {}
    for (const r of statusRows) {
      ordersByStatus[r.status] = Number(r.cnt)
    }

    return NextResponse.json({
      totals: {
        clients:         Number(totalClients[0]?.count ?? 0),
        orders:          Number(totalOrders[0]?.count ?? 0),
        services:        Number(totalServices[0]?.count ?? 0),
        users:           Number(totalUsers[0]?.count ?? 0),
        ordersThisMonth: Number(ordersThisMonth[0]?.count ?? 0),
      },
      monthly,
      ordersByStatus,
    })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    logServerError('[GET /api/admin/organizations/:id/usage]', error); console.error('[GET /api/admin/organizations/:id/usage]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
