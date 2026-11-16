import { NextResponse } from 'next/server'
import { requireMasterFast } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { organizations, orgClients, orgServiceOrders, profiles, campaignSends } from '@/lib/db/schema'
import { eq, sql, inArray } from 'drizzle-orm'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { sendReengajamento } from '@/lib/email'
import { logServerError } from '@/lib/log-error'

const CAMPAIGN = 'reengagement'

// Organização "cadastrou e nunca usou": zero clientes E zero ordens de
// serviço. Os serviços padrão criados no seed do signup não contam como
// uso real, então essa tabela fica de fora do critério de propósito.
async function findInactiveOrgs() {
  const rows = await db
    .select({
      id:                      organizations.id,
      name:                    organizations.name,
      createdAt:               organizations.createdAt,
      firstPaymentConfirmedAt: organizations.firstPaymentConfirmedAt,
      clientes:                sql<number>`(select count(*) from ${orgClients} where ${orgClients.organizationId} = ${organizations.id})`,
      ordens:                  sql<number>`(select count(*) from ${orgServiceOrders} where ${orgServiceOrders.organizationId} = ${organizations.id})`,
      lastCampaignSentAt:      sql<string | null>`(select max(${campaignSends.sentAt}) from ${campaignSends} where ${campaignSends.organizationId} = ${organizations.id} and ${campaignSends.campaign} = ${CAMPAIGN})`,
    })
    .from(organizations)
    .where(eq(organizations.plan, 'free'))

  return rows.filter((r) => Number(r.clientes) === 0 && Number(r.ordens) === 0)
}

// GET — lista as organizações candidatas à campanha, com o email do owner
export async function GET() {
  try {
    await requireMasterFast()

    const inactive = await findInactiveOrgs()
    if (inactive.length === 0) return NextResponse.json([])

    const orgIds = inactive.map((o) => o.id)
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

    const result = inactive.map((org) => {
      const owner = owners.find((p) => p.organizationId === org.id)
      return {
        organization_id: org.id,
        organization_name: org.name,
        created_at: org.createdAt,
        owner_name: owner?.fullName ?? null,
        owner_email: owner ? emailMap[owner.id] ?? null : null,
        ever_paid: org.firstPaymentConfirmedAt !== null,
        last_campaign_sent_at: org.lastCampaignSentAt,
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

    // Revalida contra o critério no momento do envio — evita reenviar para
    // quem passou a ter clientes/ordens entre o GET e o clique no botão
    const inactive = await findInactiveOrgs()
    const validIds = new Set(inactive.map((o) => o.id).filter((id) => organization_ids.includes(id)))
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
