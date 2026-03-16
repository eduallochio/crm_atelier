import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getPool, sql } from '@/lib/db'
import { getPlanLimits } from '@/lib/plan-limits'

export async function GET() {
  try {
    const user = await requireAuth()
    const pool = await getPool()

    const [usageResult, limits] = await Promise.all([
      pool.request()
        .input('orgId', sql.UniqueIdentifier, user.organizationId)
        .query(`
          SELECT
            o.[plan],
            (SELECT COUNT(*) FROM org_clients       WHERE organization_id = @orgId) AS clients_count,
            (SELECT COUNT(*) FROM org_services      WHERE organization_id = @orgId) AS services_count,
            (SELECT COUNT(*) FROM org_service_orders WHERE organization_id = @orgId) AS orders_count
          FROM organizations o
          WHERE o.id = @orgId
        `),
      getPlanLimits(),
    ])

    const row = usageResult.recordset[0]

    return NextResponse.json({
      plan: row?.plan || 'free',
      usage: {
        clients:  Number(row?.clients_count  ?? 0),
        services: Number(row?.services_count ?? 0),
        orders:   Number(row?.orders_count   ?? 0),
      },
      limits: {
        clients:  limits.max_clients_free,
        services: limits.max_services_free,
        orders:   limits.max_orders_free,
        users:    limits.max_users_free,
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
