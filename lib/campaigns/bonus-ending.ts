import { db } from '@/lib/db'
import { organizations, profiles, campaignSends } from '@/lib/db/schema'
import { sql, inArray, eq, and, isNotNull } from 'drizzle-orm'
import { listAllUsers } from '@/lib/supabase/list-all-users'
import { SupabaseClient } from '@supabase/supabase-js'
import { CampaignCandidate } from './types'

export const CAMPAIGN_KEY = 'bonus-ending'

// Organização que já pagou pelo menos uma vez (firstPaymentConfirmedAt
// setado — não existe "trial" separado no schema, isso é o bônus
// promocional de 2 meses pelo preço de 1) e está com a assinatura ativa
// perto do próximo vencimento — um aviso antes da cobrança cheia cair.
export async function findBonusEndingCandidates(
  supabase: SupabaseClient,
  withinDays: number = 7
): Promise<CampaignCandidate[]> {
  const cutoffDate = new Date(Date.now() + withinDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const orgs = await db
    .select({
      id:                      organizations.id,
      name:                    organizations.name,
      plan:                    organizations.plan,
      createdAt:               organizations.createdAt,
      firstPaymentConfirmedAt: organizations.firstPaymentConfirmedAt,
      subscriptionNextDueDate: organizations.subscriptionNextDueDate,
      subscriptionStatus:      organizations.subscriptionStatus,
      lastCampaignSentAt:      sql<string | null>`(select max(${campaignSends.sentAt}) from ${campaignSends} where ${campaignSends.organizationId} = ${organizations.id} and ${campaignSends.campaign} = ${CAMPAIGN_KEY})`,
    })
    .from(organizations)
    .where(isNotNull(organizations.firstPaymentConfirmedAt))

  if (orgs.length === 0) return []

  const orgIds = orgs.map((o) => o.id)
  const owners = await db
    .select({ id: profiles.id, organizationId: profiles.organizationId, fullName: profiles.fullName })
    .from(profiles)
    .where(and(inArray(profiles.organizationId, orgIds), eq(profiles.isOwner, true)))

  const users = await listAllUsers(supabase)
  const emailMap: Record<string, string> = {}
  for (const u of users) emailMap[u.id] = u.email ?? ''

  const todayStr = new Date().toISOString().slice(0, 10)

  return orgs.map((org) => {
    const owner = owners.find((p) => p.organizationId === org.id)
    const isCandidate = org.subscriptionStatus === 'active' &&
      !!org.subscriptionNextDueDate &&
      org.subscriptionNextDueDate >= todayStr &&
      org.subscriptionNextDueDate <= cutoffDate
    return {
      organization_id: org.id,
      organization_name: org.name,
      plan: org.plan,
      created_at: org.createdAt!.toISOString(),
      owner_id: owner?.id ?? null,
      owner_name: owner?.fullName ?? null,
      owner_email: owner ? emailMap[owner.id] ?? null : null,
      ever_paid: true,
      last_campaign_sent_at: org.lastCampaignSentAt,
      is_candidate: isCandidate,
      extra: { subscription_next_due_date: org.subscriptionNextDueDate },
    }
  }).filter((r) => r.owner_email)
}
