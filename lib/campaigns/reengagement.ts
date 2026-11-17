import { db } from '@/lib/db'
import { organizations, orgClients, orgServiceOrders, profiles, campaignSends } from '@/lib/db/schema'
import { sql, inArray, eq, and } from 'drizzle-orm'
import { listAllUsers } from '@/lib/supabase/list-all-users'
import { SupabaseClient } from '@supabase/supabase-js'
import { CampaignCandidate } from './types'

export const CAMPAIGN_KEY = 'reengagement'

// Organização "cadastrou e nunca usou": zero clientes E zero ordens de
// serviço — os 6 serviços padrão do seed no signup não contam como uso
// real, então essa tabela fica de fora do critério de propósito.
export async function findReengagementCandidates(supabase: SupabaseClient): Promise<CampaignCandidate[]> {
  const orgs = await db
    .select({
      id:                      organizations.id,
      name:                    organizations.name,
      plan:                    organizations.plan,
      createdAt:               organizations.createdAt,
      firstPaymentConfirmedAt: organizations.firstPaymentConfirmedAt,
      clientes:                sql<number>`(select count(*) from ${orgClients} where ${orgClients.organizationId} = ${organizations.id})`,
      ordens:                  sql<number>`(select count(*) from ${orgServiceOrders} where ${orgServiceOrders.organizationId} = ${organizations.id})`,
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

  return orgs.map((org) => {
    const owner = owners.find((p) => p.organizationId === org.id)
    const isCandidate = Number(org.clientes) === 0 && Number(org.ordens) === 0
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
    }
  }).filter((r) => r.owner_email)
}
