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

    // ── Totais ──────────────────────────────────────────────────────────────
    const totalsResult = await pool.request()
      .input('orgId', sql.UniqueIdentifier, id)
      .query(`
        SELECT
          (SELECT COUNT(*) FROM org_clients        WHERE organization_id = @orgId AND deleted_at IS NULL) AS total_clients,
          (SELECT COUNT(*) FROM org_service_orders WHERE organization_id = @orgId)                        AS total_orders,
          (SELECT COUNT(*) FROM org_services       WHERE organization_id = @orgId AND is_active = 1)      AS total_services,
          (SELECT COUNT(*) FROM users              WHERE organization_id = @orgId)                        AS total_users,
          (SELECT COUNT(*) FROM org_service_orders
           WHERE organization_id = @orgId
             AND MONTH(created_at) = MONTH(GETDATE())
             AND YEAR(created_at)  = YEAR(GETDATE()))                                                     AS orders_this_month
      `)

    const t = totalsResult.recordset[0]

    // ── Crescimento mensal (últimos 6 meses) ─────────────────────────────────
    const monthlyResult = await pool.request()
      .input('orgId', sql.UniqueIdentifier, id)
      .query(`
        SELECT
          FORMAT(ym, 'MMM', 'pt-BR') AS month_label,
          FORMAT(ym, 'yyyy-MM')       AS ym,
          SUM(new_clients)            AS new_clients,
          SUM(new_orders)             AS new_orders
        FROM (
          SELECT
            DATEFROMPARTS(YEAR(created_at), MONTH(created_at), 1) AS ym,
            1 AS new_clients, 0 AS new_orders
          FROM org_clients
          WHERE organization_id = @orgId
            AND created_at >= DATEADD(month, -6, GETDATE())
            AND deleted_at IS NULL
          UNION ALL
          SELECT
            DATEFROMPARTS(YEAR(created_at), MONTH(created_at), 1) AS ym,
            0 AS new_clients, 1 AS new_orders
          FROM org_service_orders
          WHERE organization_id = @orgId
            AND created_at >= DATEADD(month, -6, GETDATE())
        ) AS combined
        GROUP BY DATEFROMPARTS(YEAR(ym), MONTH(ym), 1),
                 FORMAT(ym, 'MMM', 'pt-BR'),
                 FORMAT(ym, 'yyyy-MM')
        ORDER BY ym ASC
      `)

    // ── Ordens por status ────────────────────────────────────────────────────
    const statusResult = await pool.request()
      .input('orgId', sql.UniqueIdentifier, id)
      .query(`
        SELECT status, COUNT(*) AS cnt
        FROM org_service_orders
        WHERE organization_id = @orgId
        GROUP BY status
      `)

    const statusMap: Record<string, number> = {}
    for (const r of statusResult.recordset) {
      statusMap[r.status as string] = Number(r.cnt)
    }

    return NextResponse.json({
      totals: {
        clients:        Number(t.total_clients),
        orders:         Number(t.total_orders),
        services:       Number(t.total_services),
        users:          Number(t.total_users),
        ordersThisMonth:Number(t.orders_this_month),
      },
      monthly: monthlyResult.recordset.map((r) => ({
        month:      r.month_label as string,
        newClients: Number(r.new_clients),
        newOrders:  Number(r.new_orders),
      })),
      ordersByStatus: statusMap,
    })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    console.error('[GET /api/admin/organizations/:id/usage]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
