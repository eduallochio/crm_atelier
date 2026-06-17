import { NextResponse } from 'next/server'
import { requireMaster } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { organizations, profiles, orgClients, plans } from '@/lib/db/schema'
import { eq, desc, sql as drizzleSql, count } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'

export async function GET() {
  try {
    await requireMaster()

    // Preços reais da tabela plans
    const planRows = await db
      .select({ slug: plans.slug, price: plans.price })
      .from(plans)
      .where(eq(plans.isActive, true))

    const planPrices: Record<string, number> = { free: 0, pro: 0 }
    for (const p of planRows) {
      planPrices[p.slug] = parseFloat(p.price) || 0
    }

    // Busca contagens via JOIN + GROUP BY (evita N+1 correlated subqueries)
    const rows = await db.execute(drizzleSql`
      SELECT
        o.id,
        o.name,
        o.plan,
        o.subscription_status AS "subscriptionStatus",
        o.created_at          AS "createdAt",
        COUNT(DISTINCT p.id)::int  AS "usersCount",
        COUNT(DISTINCT c.id)::int  AS "clientsCount"
      FROM organizations o
      LEFT JOIN profiles    p ON p.organization_id = o.id
      LEFT JOIN org_clients c ON c.organization_id = o.id
      GROUP BY o.id, o.name, o.plan, o.subscription_status, o.created_at
      ORDER BY o.created_at DESC
    `) as any[]

    const result = (rows as any[]).map((row) => ({
      id:                 row.id,
      name:               row.name,
      plan:               row.plan,
      subscriptionStatus: row.subscriptionStatus,
      createdAt:          row.createdAt,
      usersCount:         Number(row.usersCount ?? 0),
      clientsCount:       Number(row.clientsCount ?? 0),
      state:              row.subscriptionStatus,
      mrr:                planPrices[row.plan] ?? 0,
    }))

    return NextResponse.json(result)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[GET /api/admin/organizations]', error); console.error('[GET /api/admin/organizations]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
