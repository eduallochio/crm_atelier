import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getPool, sql } from '@/lib/db'

export async function GET() {
  try {
    const user = await requireAuth()
    const pool = await getPool()

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const currentMonth = now.getMonth() + 1

    const result = await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .input('startOfMonth', sql.DateTime2, startOfMonth)
      .input('currentMonth', sql.Int, currentMonth)
      .query(`
        SELECT
          (SELECT COUNT(*) FROM org_clients WHERE organization_id = @orgId) AS total_clients,
          (SELECT COUNT(*) FROM org_clients WHERE organization_id = @orgId AND created_at >= @startOfMonth) AS new_this_month,
          (SELECT COUNT(*) FROM org_clients WHERE organization_id = @orgId AND telefone IS NOT NULL AND telefone <> '') AS with_phone,
          (SELECT COUNT(DISTINCT client_id) FROM org_service_orders
            WHERE organization_id = @orgId AND status IN ('pendente', 'em_andamento')) AS with_active_orders,
          (SELECT COUNT(*) FROM org_clients WHERE organization_id = @orgId
            AND data_nascimento IS NOT NULL AND MONTH(data_nascimento) = @currentMonth) AS birthday_this_month
      `)

    const row = result.recordset[0]
    return NextResponse.json({
      totalClients: row.total_clients,
      newThisMonth: row.new_this_month,
      withPhone: row.with_phone,
      withActiveOrders: row.with_active_orders,
      birthdayThisMonth: row.birthday_this_month,
    })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[GET /api/clients/stats]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
