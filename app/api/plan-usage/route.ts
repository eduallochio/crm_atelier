import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { organizations, usageMetrics, orgServices, adminSystemSettings } from '@/lib/db/schema'
import { eq, inArray } from 'drizzle-orm'
import { hasLifetimeLicense } from '@/lib/plan-limits'

const DEFAULTS = {
  max_clients_free: 50,
  max_services_free: 20,
  max_orders_free: 250,
  max_users_free: 1,
}

async function getPlanLimits() {
  try {
    const rows = await db
      .select({ key: adminSystemSettings.key, value: adminSystemSettings.value })
      .from(adminSystemSettings)
      .where(
        inArray(adminSystemSettings.key, [
          'max_clients_free',
          'max_services_free',
          'max_orders_free',
          'max_users_free',
        ])
      )

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

    const [orgRows, metricsRows, servicesCount, limits, lifetime] = await Promise.all([
      db.select({ plan: organizations.plan })
        .from(organizations)
        .where(eq(organizations.id, orgId))
        .limit(1),
      db.select({
          totalClientsEver: usageMetrics.totalClientsEver,
          totalOrdersEver: usageMetrics.totalOrdersEver,
        })
        .from(usageMetrics)
        .where(eq(usageMetrics.organizationId, orgId))
        .limit(1),
      db.select({ count: eq(orgServices.organizationId, orgId) })
        .from(orgServices)
        .where(eq(orgServices.organizationId, orgId)),
      getPlanLimits(),
      hasLifetimeLicense(orgId),
    ])

    const plan = lifetime ? 'enterprise' : (orgRows[0]?.plan ?? 'free')
    const metrics = metricsRows[0]

    return NextResponse.json({
      plan,
      usage: {
        clients: Number(metrics?.totalClientsEver ?? 0),
        services: servicesCount.length,
        orders: Number(metrics?.totalOrdersEver ?? 0),
      },
      limits: {
        clients: limits.max_clients_free,
        services: limits.max_services_free,
        orders: limits.max_orders_free,
        users: limits.max_users_free,
      },
    })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[GET /api/plan-usage]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
