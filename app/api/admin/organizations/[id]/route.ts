import { NextResponse } from 'next/server'
import { requireMasterFast } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { organizations, plans, profiles, orgClients } from '@/lib/db/schema'
import { eq, sql as drizzleSql } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'
import { getSubscription } from '@/lib/asaas'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireMasterFast()
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
          logoUrl:            organizations.logoUrl,
          instagram:          organizations.instagram,
          facebook:           organizations.facebook,
          twitter:            organizations.twitter,
          tiktok:             organizations.tiktok,
          kwai:               organizations.kwai,
          lifetimeLicense:    organizations.lifetimeLicense,
          subscriptionNextDueDate: organizations.subscriptionNextDueDate,
          asaasSubscriptionId:     organizations.asaasSubscriptionId,
          usersCount:   drizzleSql<number>`COUNT(DISTINCT ${profiles.id})::int`,
          clientsCount: drizzleSql<number>`COUNT(DISTINCT ${orgClients.id})::int`,
        })
        .from(organizations)
        .leftJoin(profiles, eq(profiles.organizationId, organizations.id))
        .leftJoin(orgClients, eq(orgClients.organizationId, organizations.id))
        .where(eq(organizations.id, id))
        .groupBy(organizations.id)
        .limit(1),
      db.select({ slug: plans.slug, price: plans.price }).from(plans).where(eq(plans.isActive, true)),
    ])

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    }

    const planPrices: Record<string, number> = { free: 0 }
    for (const p of planRows) planPrices[p.slug] = parseFloat(p.price) || 0

    const row = rows[0]

    // Receita mensal real: licença vitalícia não paga nada; organizações com
    // assinatura no Asaas podem ter valor diferente do preço de tabela (bônus
    // de 60 dias, cupom, desconto manual) — busca o valor real da assinatura
    // em vez do preço de tabela do plano. Assinatura anual é dividida por 12
    // para manter "mensal". Se a busca no Asaas falhar, cai pro preço de tabela.
    let mrr = planPrices[row.plan] ?? 0
    if (row.lifetimeLicense) {
      mrr = 0
    } else if (row.asaasSubscriptionId) {
      try {
        const subscription = await getSubscription(row.asaasSubscriptionId)
        mrr = subscription.cycle === 'YEARLY' ? subscription.value / 12 : subscription.value
      } catch (error) {
        logServerError('[GET /api/admin/organizations/:id] getSubscription', error)
      }
    }

    return NextResponse.json({
      id:               row.id,
      name:             row.name,
      plan:             row.plan,
      state:            (row.subscriptionStatus === 'inactive' ? 'active' : row.subscriptionStatus) ?? 'active',
      created_at:       row.createdAt,
      users_count:      row.usersCount,
      clients_count:    row.clientsCount,
      mrr,
      email:            row.email,
      phone:            row.phone,
      cnpj:             row.cnpj,
      address:          row.address,
      city:             row.city,
      org_state:        row.orgState,
      zip_code:         row.zipCode,
      website:          row.website,
      logo_url:         row.logoUrl,
      instagram:        row.instagram,
      facebook:         row.facebook,
      twitter:          row.twitter,
      tiktok:           row.tiktok,
      kwai:             row.kwai,
      lifetime_license: row.lifetimeLicense,
      subscription_next_due_date: row.subscriptionNextDueDate,
      has_asaas_subscription:     !!row.asaasSubscriptionId,
    })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[GET /api/admin/organizations/:id]', error); console.error('[GET /api/admin/organizations/:id]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
