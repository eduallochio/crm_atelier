import { NextResponse } from 'next/server'
import { requireMasterFast } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { organizations, orgClients, orgServiceOrders, profiles, campaignSends } from '@/lib/db/schema'
import { sql, inArray } from 'drizzle-orm'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { sendReengajamento } from '@/lib/email'
import { logServerError } from '@/lib/log-error'

const CAMPAIGN = 'reengagement'

// Busca TODAS as organizações, com o suficiente para calcular se são
// "inativas" (cadastraram e nunca usaram: zero clientes E zero ordens de
// serviço — os 6 serviços padrão do seed não contam como uso real) — a tela
// mostra todas, com essa marcação, e o filtro de visibilidade fica no client.
async function findAllOrgs() {
  return db
    .select({
      id:                      organizations.id,
      name:                    organizations.name,
      plan:                    organizations.plan,
      createdAt:               organizations.createdAt,
      firstPaymentConfirmedAt: organizations.firstPaymentConfirmedAt,
      clientes:                sql<number>`(select count(*) from ${orgClients} where ${orgClients.organizationId} = ${organizations.id})`,
      ordens:                  sql<number>`(select count(*) from ${orgServiceOrders} where ${orgServiceOrders.organizationId} = ${organizations.id})`,
      lastCampaignSentAt:      sql<string | null>`(select max(${campaignSends.sentAt}) from ${campaignSends} where ${campaignSends.organizationId} = ${organizations.id} and ${campaignSends.campaign} = ${CAMPAIGN})`,
    })
    .from(organizations)
}

function isInactive(r: { clientes: number; ordens: number }) {
  return Number(r.clientes) === 0 && Number(r.ordens) === 0
}

// GET — lista TODAS as organizações, com o email do owner e a marcação de
// quem é candidata à campanha (is_inactive)
export async function GET() {
  try {
    await requireMasterFast()

    const orgs = await findAllOrgs()
    if (orgs.length === 0) return NextResponse.json([])

    const orgIds = orgs.map((o) => o.id)
    const owners = await db
      .select({ id: profiles.id, organizationId: profiles.organizationId, fullName: profiles.fullName })
      .from(profiles)
      .where(inArray(profiles.organizationId, orgIds))

    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data } = await supabase.auth.admin.listUsers()
    const emailMap: Record<string, string> = {}
    if (data?.users) for (const u of data.users) emailMap[u.id] = u.email ?? ''

    const result = orgs.map((org) => {
      const owner = owners.find((p) => p.organizationId === org.id)
      return {
        organization_id: org.id,
        organization_name: org.name,
        plan: org.plan,
        created_at: org.createdAt,
        owner_name: owner?.fullName ?? null,
        owner_email: owner ? emailMap[owner.id] ?? null : null,
        ever_paid: org.firstPaymentConfirmedAt !== null,
        last_campaign_sent_at: org.lastCampaignSentAt,
        is_inactive: isInactive(org),
      }
    }).filter((r) => r.owner_email) // sem email não há pra quem enviar

    return NextResponse.json(result)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    logServerError('[GET /api/admin/campaigns/reengagement]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// POST — dispara o email para as organizações informadas (body: { organization_ids: string[] })
export async function POST(request: Request) {
  try {
    await requireMasterFast()
    const { organization_ids } = await request.json()
    if (!Array.isArray(organization_ids) || organization_ids.length === 0) {
      return NextResponse.json({ error: 'organization_ids vazio' }, { status: 400 })
    }

    // Revalida contra o critério no momento do envio — nunca envia para
    // organização que já usa o sistema de verdade, mesmo que o client peça
    // (ex: lista desatualizada, ou id de org ativa enviado por engano)
    const orgs = await findAllOrgs()
    const inactiveIds = orgs.filter(isInactive).map((o) => o.id)
    const validIds = new Set(inactiveIds.filter((id) => organization_ids.includes(id)))
    if (validIds.size === 0) {
      return NextResponse.json({ sent: 0, skipped: organization_ids.length })
    }

    const owners = await db
      .select({ id: profiles.id, organizationId: profiles.organizationId, fullName: profiles.fullName })
      .from(profiles)
      .where(inArray(profiles.organizationId, [...validIds]))

    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data } = await supabase.auth.admin.listUsers()
    const emailMap: Record<string, string> = {}
    if (data?.users) for (const u of data.users) emailMap[u.id] = u.email ?? ''

    let sent = 0
    for (const owner of owners) {
      const email = emailMap[owner.id]
      if (!email) continue
      try {
        await sendReengajamento(email, owner.fullName ?? 'por aí')
        sent++
        try {
          await db.insert(campaignSends).values({ organizationId: owner.organizationId, campaign: CAMPAIGN })
        } catch (err) {
          logServerError('[campaigns/reengagement] registrar envio', err, { organizationId: owner.organizationId })
        }
      } catch (err) {
        logServerError('[campaigns/reengagement] enviar email', err, { organizationId: owner.organizationId })
      }
    }

    return NextResponse.json({ sent, skipped: organization_ids.length - sent })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    logServerError('[POST /api/admin/campaigns/reengagement]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
