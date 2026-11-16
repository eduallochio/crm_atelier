import { NextResponse } from 'next/server'
import { requireMasterFast } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { organizations, orgClients, orgServiceOrders, profiles, campaignSends, campaignRuns } from '@/lib/db/schema'
import { sql, inArray, eq, and } from 'drizzle-orm'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { sendReengajamento } from '@/lib/email'
import { logServerError } from '@/lib/log-error'
import { listAllUsers } from '@/lib/supabase/list-all-users'

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
    // Só o owner — uma organização pode ter outros profiles (membros da
    // equipe), e o email de reengajamento deve ir sempre para quem criou a
    // conta, não para o primeiro profile encontrado
    const owners = await db
      .select({ id: profiles.id, organizationId: profiles.organizationId, fullName: profiles.fullName })
      .from(profiles)
      .where(and(inArray(profiles.organizationId, orgIds), eq(profiles.isOwner, true)))

    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const users = await listAllUsers(supabase)
    const emailMap: Record<string, string> = {}
    for (const u of users) emailMap[u.id] = u.email ?? ''

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
      .where(and(inArray(profiles.organizationId, [...validIds]), eq(profiles.isOwner, true)))

    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const users = await listAllUsers(supabase)
    const emailMap: Record<string, string> = {}
    for (const u of users) emailMap[u.id] = u.email ?? ''

    // Nome da organização pro resultado detalhado (ver results abaixo) —
    // já temos isso em orgs, sem precisar de outra query
    const orgNameById = new Map(orgs.map((o) => [o.id, o.name]))

    // Um registro por execução do disparo — histórico de campanhas (ver
    // GET /runs). Atualizado com os totais reais ao final do loop.
    const [run] = await db.insert(campaignRuns).values({ campaign: CAMPAIGN }).returning({ id: campaignRuns.id })

    // Resultado por organização — permite a tela mostrar exatamente quem
    // falhou e por quê, em vez de só o total agregado (ex: "3 enviados, 1
    // pulado" sem dizer qual dos 4 foi o pulado)
    const results: Array<{ organization_id: string; organization_name: string; status: 'sent' | 'failed'; error?: string }> = []

    let sent = 0
    for (const owner of owners) {
      const orgName = orgNameById.get(owner.organizationId) ?? 'Organização'
      const email = emailMap[owner.id]
      if (!email) {
        results.push({ organization_id: owner.organizationId, organization_name: orgName, status: 'failed', error: 'Email do dono não encontrado' })
        continue
      }
      try {
        const { id: resendEmailId } = await sendReengajamento(email, owner.fullName ?? 'por aí')
        sent++
        results.push({ organization_id: owner.organizationId, organization_name: orgName, status: 'sent' })
        try {
          await db.insert(campaignSends).values({
            organizationId: owner.organizationId,
            campaign: CAMPAIGN,
            runId: run.id,
            resendEmailId,
          })
        } catch (err) {
          logServerError('[campaigns/reengagement] registrar envio', err, { organizationId: owner.organizationId })
        }
      } catch (err) {
        logServerError('[campaigns/reengagement] enviar email', err, { organizationId: owner.organizationId })
        results.push({ organization_id: owner.organizationId, organization_name: orgName, status: 'failed', error: 'Falha ao enviar o email' })
      }
    }

    // Organizações válidas que não têm nenhum profile com is_owner=true (dado
    // inconsistente, ex: profile deletado) nunca entram no loop acima — sem
    // isso, elas contariam como "puladas" no total agregado sem aparecer na
    // lista detalhada de results, fazendo os dois números não baterem
    const ownerOrgIds = new Set(owners.map((o) => o.organizationId))
    for (const id of validIds) {
      if (!ownerOrgIds.has(id)) {
        results.push({ organization_id: id, organization_name: orgNameById.get(id) ?? 'Organização', status: 'failed', error: 'Nenhum responsável encontrado' })
      }
    }

    const skipped = organization_ids.length - sent
    await db.update(campaignRuns).set({ sentCount: sent, skippedCount: skipped }).where(eq(campaignRuns.id, run.id))

    return NextResponse.json({ sent, skipped, results })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    logServerError('[POST /api/admin/campaigns/reengagement]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
