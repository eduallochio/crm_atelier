import { NextResponse } from 'next/server'
import { requireMaster } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { organizations, profiles, orgClients, plans } from '@/lib/db/schema'
import { eq, desc, sql as drizzleSql } from 'drizzle-orm'

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

    const rows = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        plan: organizations.plan,
        subscriptionStatus: organizations.subscriptionStatus,
        createdAt: organizations.createdAt,
        usersCount: drizzleSql<number>`(SELECT COUNT(*) FROM profiles WHERE profiles.organization_id = ${organizations.id})::int`,
        clientsCount: drizzleSql<number>`(SELECT COUNT(*) FROM org_clients WHERE org_clients.organization_id = ${organizations.id})::int`,
      })
      .from(organizations)
      .orderBy(desc(organizations.createdAt))

    const result = rows.map((row) => ({
      ...row,
      state: row.subscriptionStatus,
      mrr: planPrices[row.plan] ?? 0,
    }))

    return NextResponse.json(result)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[GET /api/admin/organizations]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
