import { NextResponse } from 'next/server'
import { requireMaster } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { organizations, plans } from '@/lib/db/schema'
import { eq, sql as drizzleSql } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireMaster()
    const { id } = await params

    const [rows, planRows] = await Promise.all([
      db
        .select({
          id: organizations.id,
          name: organizations.name,
          plan: organizations.plan,
          subscriptionStatus: organizations.subscriptionStatus,
          createdAt:          organizations.createdAt,
          email:              organizations.email,
          phone:              organizations.phone,
          cnpj:               organizations.cnpj,
          address:            organizations.address,
          city:               organizations.city,
          orgState:           organizations.state,
          zipCode:            organizations.zipCode,
          website:            organizations.website,
          lifetimeLicense:    organizations.lifetimeLicense,
          usersCount:   drizzleSql<number>`(SELECT COUNT(*) FROM profiles WHERE profiles.organization_id = ${organizations.id})::int`,
          clientsCount: drizzleSql<number>`(SELECT COUNT(*) FROM org_clients WHERE org_clients.organization_id = ${organizations.id})::int`,
        })
        .from(organizations)
        .where(eq(organizations.id, id))
        .limit(1),
      db.select({ slug: plans.slug, price: plans.price }).from(plans).where(eq(plans.isActive, true)),
    ])

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    }

    const planPrices: Record<string, number> = { free: 0 }
    for (const p of planRows) planPrices[p.slug] = parseFloat(p.price) || 0

    const row = rows[0]
    return NextResponse.json({
      id:               row.id,
      name:             row.name,
      plan:             row.plan,
      state:            (row.subscriptionStatus === 'inactive' ? 'active' : row.subscriptionStatus) ?? 'active',
      created_at:       row.createdAt,
      users_count:      row.usersCount,
      clients_count:    row.clientsCount,
      mrr:              planPrices[row.plan] ?? 0,
      email:            row.email,
      phone:            row.phone,
      cnpj:             row.cnpj,
      address:          row.address,
      city:             row.city,
      org_state:        row.orgState,
      zip_code:         row.zipCode,
      website:          row.website,
      lifetime_license: row.lifetimeLicense,
    })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[GET /api/admin/organizations/:id]', error); console.error('[GET /api/admin/organizations/:id]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
