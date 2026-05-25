import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { organizations, usageMetrics, profiles, adminSystemSettings, orgServices } from '@/lib/db/schema'
import { eq, count, inArray } from 'drizzle-orm'
import { hasLifetimeLicense } from '@/lib/plan-limits'
import { logServerError } from '@/lib/log-error'

const DEFAULTS = {
  max_clients_free:  50,
  max_services_free: 20,
  max_orders_free:   100,
  max_users_free:    2,
  max_clients_pro:   999999,
  max_services_pro:  999999,
  max_orders_pro:    999999,
  max_users_pro:     3,
}

async function getPlanLimits() {
  try {
    const rows = await db
      .select({ key: adminSystemSettings.key, value: adminSystemSettings.value })
      .from(adminSystemSettings)
      .where(inArray(adminSystemSettings.key, Object.keys(DEFAULTS)))

    const limits = { ...DEFAULTS }
    for (const row of rows) {
      const val = parseInt(row.value)
      if (!isNaN(val) && val > 0) {
        limits[row.key as keyof typeof DEFAULTS] = val
      }
    }
    return limits
  } catch {
    return DEFAULTS
  }
}

export async function GET() {
  try {
    const user = await requireAuth()
    const orgId = user.organizationId

    const [orgRow, metrics, usersCount, servicesCount, limits, lifetime] = await Promise.all([
      db.select({ plan: organizations.plan })
        .from(organizations)
        .where(eq(organizations.id, orgId))
        .limit(1),

      db.select({
          clientsCount: usageMetrics.clientsCount,
          ordersCount:  usageMetrics.ordersCount,
        })
        .from(usageMetrics)
        .where(eq(usageMetrics.organizationId, orgId))
        .limit(1),

      db.select({ count: count() })
        .from(profiles)
        .where(eq(profiles.organizationId, orgId)),

      db.select({ count: count() })
        .from(orgServices)
        .where(eq(orgServices.organizationId, orgId)),

      getPlanLimits(),
      hasLifetimeLicense(orgId),
    ])

    const plan = lifetime ? 'pro' : (orgRow[0]?.plan ?? 'free')
    const isPro = plan !== 'free'

    const clientsCount  = Number(metrics[0]?.clientsCount ?? 0)
    const ordersCount   = Number(metrics[0]?.ordersCount  ?? 0)
    const users         = Number(usersCount[0]?.count ?? 1)
    const services      = Number(servicesCount[0]?.count ?? 0)

    return NextResponse.json({
      plan,
      clients_count:  clientsCount,
      orders_count:   ordersCount,
      users_count:    users,
      services_count: services,
      limits: {
        max_clients:  isPro ? limits.max_clients_pro  : limits.max_clients_free,
        max_orders:   isPro ? limits.max_orders_pro   : limits.max_orders_free,
        max_users:    isPro ? limits.max_users_pro    : limits.max_users_free,
        max_services: isPro ? limits.max_services_pro : limits.max_services_free,
      },
    })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[GET /api/plan-usage]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
