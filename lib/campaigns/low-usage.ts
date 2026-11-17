import { db } from '@/lib/db'
import { organizations, orgClients, orgServiceOrders, profiles, campaignSends } from '@/lib/db/schema'
import { sql, inArray, eq, and } from 'drizzle-orm'
import { listAllUsers } from '@/lib/supabase/list-all-users'
import { SupabaseClient } from '@supabase/supabase-js'
import { CampaignCandidate } from './types'

export const CAMPAIGN_KEY = 'low-usage'

// Organização que JÁ usou de verdade (pelo menos 1 cliente ou 1 ordem de
// serviço cadastrado — diferente do reengajamento, que é pra quem nunca
// usou), mas sem atividade recente. "Atividade" = o cadastro mais recente
// em org_clients OU org_service_orders; não existe campo de "último
// acesso" centralizado no schema, então é derivado das tabelas operacionais.
export async function findLowUsageCandidates(
  supabase: SupabaseClient,
  minDaysInactive: number = 30
): Promise<CampaignCandidate[]> {
  const orgs = await db
    .select({
      id:                      organizations.id,
      name:                    organizations.name,
      plan:                    organizations.plan,
      createdAt:               organizations.createdAt,
      firstPaymentConfirmedAt: organizations.firstPaymentConfirmedAt,
      clientes:                sql<number>`(select count(*) from ${orgClients} where ${orgClients.organizationId} = ${organizations.id})`,
      ordens:                  sql<number>`(select count(*) from ${orgServiceOrders} where ${orgServiceOrders.organizationId} = ${organizations.id})`,
      // org_service_orders não tem createdAt — usa dataAbertura (campo
      // equivalente); dataConclusao também conta como atividade recente
      lastActivityAt:          sql<string | null>`greatest(
        coalesce((select max(${orgClients.createdAt}) from ${orgClients} where ${orgClients.organizationId} = ${organizations.id}), '1970-01-01'),
        coalesce((select max(${orgServiceOrders.dataAbertura}) from ${orgServiceOrders} where ${orgServiceOrders.organizationId} = ${organizations.id}), '1970-01-01'),
        coalesce((select max(${orgServiceOrders.dataConclusao}) from ${orgServiceOrders} where ${orgServiceOrders.organizationId} = ${organizations.id}), '1970-01-01')
      )`,
      lastCampaignSentAt:      sql<string | null>`(select max(${campaignSends.sentAt}) from ${campaignSends} where ${campaignSends.organizationId} = ${organizations.id} and ${campaignSends.campaign} = ${CAMPAIGN_KEY})`,
    })
    .from(organizations)

  if (orgs.length === 0) return []

  const orgIds = orgs.map((o) => o.id)
  const owners = await db
    .select({ id: profiles.id, organizationId: profiles.organizationId, fullName: profiles.fullName })
    .from(profiles)
    .where(and(inArray(profiles.organizationId, orgIds), eq(profiles.isOwner, true)))

  const users = await listAllUsers(supabase)
  const emailMap: Record<string, string> = {}
  for (const u of users) emailMap[u.id] = u.email ?? ''

  const cutoff = Date.now() - minDaysInactive * 24 * 60 * 60 * 1000

  return orgs.map((org) => {
    const owner = owners.find((p) => p.organizationId === org.id)
    const hasActivity = Number(org.clientes) > 0 || Number(org.ordens) > 0
    const lastActivityTime = org.lastActivityAt ? new Date(org.lastActivityAt).getTime() : null
    const isCandidate = hasActivity && lastActivityTime !== null && lastActivityTime < cutoff
    return {
      organization_id: org.id,
      organization_name: org.name,
      plan: org.plan,
      created_at: org.createdAt!.toISOString(),
      owner_id: owner?.id ?? null,
      owner_name: owner?.fullName ?? null,
      owner_email: owner ? emailMap[owner.id] ?? null : null,
      ever_paid: org.firstPaymentConfirmedAt !== null,
      last_campaign_sent_at: org.lastCampaignSentAt,
      is_candidate: isCandidate,
      extra: { last_activity_at: org.lastActivityAt },
    }
  }).filter((r) => r.owner_email)
}
