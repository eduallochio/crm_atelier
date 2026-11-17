import { NextResponse } from 'next/server'
import { requireMasterFast } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { profiles, campaignSends, campaignRuns } from '@/lib/db/schema'
import { inArray, eq, and } from 'drizzle-orm'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { logServerError } from '@/lib/log-error'
import { CAMPAIGN_TYPES, isCampaignType } from '@/lib/campaigns/registry'
import { listAllUsers } from '@/lib/supabase/list-all-users'

function getSupabase() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET — lista as organizações candidatas ao tipo de campanha, com a
// marcação de quem atende o critério (is_candidate); filtros extras (ex:
// dias sem atividade) vêm por query string
export async function GET(request: Request, { params }: { params: Promise<{ type: string }> }) {
  try {
    await requireMasterFast()
    const { type } = await params
    if (!isCampaignType(type)) {
      return NextResponse.json({ error: 'Tipo de campanha inválido' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const config = CAMPAIGN_TYPES[type]
    const options = config.parseFilters ? config.parseFilters(searchParams) : undefined

    const supabase = getSupabase()
    const result = await config.findCandidates(supabase, options)
    return NextResponse.json(result)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    logServerError('[GET /api/admin/campaigns/[type]]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// POST — dispara o email para as organizações informadas (body:
// { organization_ids: string[], content?: {...} } — content só é usado
// pela campanha de novidades, que não tem critério de filtro próprio)
export async function POST(request: Request, { params }: { params: Promise<{ type: string }> }) {
  try {
    await requireMasterFast()
    const { type } = await params
    if (!isCampaignType(type)) {
      return NextResponse.json({ error: 'Tipo de campanha inválido' }, { status: 400 })
    }
    const config = CAMPAIGN_TYPES[type]

    const body = await request.json()
    const { organization_ids, content } = body
    if (!Array.isArray(organization_ids) || organization_ids.length === 0) {
      return NextResponse.json({ error: 'organization_ids vazio' }, { status: 400 })
    }
    if (config.requiresContent && (!content || !content.titulo || !content.descricao || !content.ctaTexto || !content.ctaUrl)) {
      return NextResponse.json({ error: 'Conteúdo da campanha incompleto' }, { status: 400 })
    }

    const supabase = getSupabase()

    // Revalida contra o critério no momento do envio — nunca envia para
    // organização que não bate mais com o critério, mesmo que o client peça
    // (ex: lista desatualizada na tela)
    const candidates = await config.findCandidates(supabase)
    const candidateIds = candidates.filter((c) => c.is_candidate).map((c) => c.organization_id)
    const validIds = new Set(candidateIds.filter((id) => organization_ids.includes(id)))
    if (validIds.size === 0) {
      return NextResponse.json({ sent: 0, skipped: organization_ids.length, results: [] })
    }

    const owners = await db
      .select({ id: profiles.id, organizationId: profiles.organizationId, fullName: profiles.fullName })
      .from(profiles)
      .where(and(inArray(profiles.organizationId, [...validIds]), eq(profiles.isOwner, true)))

    const users = await listAllUsers(supabase)
    const emailMap: Record<string, string> = {}
    for (const u of users) emailMap[u.id] = u.email ?? ''

    const candidateById = new Map(candidates.map((c) => [c.organization_id, c]))

    const [run] = await db.insert(campaignRuns).values({ campaign: type }).returning({ id: campaignRuns.id })

    const results: Array<{ organization_id: string; organization_name: string; status: 'sent' | 'failed'; error?: string }> = []

    let sent = 0
    for (const owner of owners) {
      const candidate = candidateById.get(owner.organizationId)
      const orgName = candidate?.organization_name ?? 'Organização'
      const email = emailMap[owner.id]
      if (!email) {
        results.push({ organization_id: owner.organizationId, organization_name: orgName, status: 'failed', error: 'Email do dono não encontrado' })
        continue
      }
      try {
        const { id: resendEmailId } = await config.sendEmail({
          to: email,
          nome: owner.fullName ?? 'por aí',
          candidate,
          content,
        })
        sent++
        results.push({ organization_id: owner.organizationId, organization_name: orgName, status: 'sent' })
        try {
          await db.insert(campaignSends).values({
            organizationId: owner.organizationId,
            campaign: type,
            runId: run.id,
            resendEmailId,
          })
        } catch (err) {
          logServerError(`[campaigns/${type}] registrar envio`, err, { organizationId: owner.organizationId })
        }
      } catch (err) {
        logServerError(`[campaigns/${type}] enviar email`, err, { organizationId: owner.organizationId })
        results.push({ organization_id: owner.organizationId, organization_name: orgName, status: 'failed', error: 'Falha ao enviar o email' })
      }
    }

    // Organizações válidas sem profile is_owner=true (dado inconsistente)
    // nunca entram no loop acima — sem isso, contariam como "puladas" no
    // total agregado sem aparecer na lista detalhada de results
    const ownerOrgIds = new Set(owners.map((o) => o.organizationId))
    for (const id of validIds) {
      if (!ownerOrgIds.has(id)) {
        const orgName = candidateById.get(id)?.organization_name ?? 'Organização'
        results.push({ organization_id: id, organization_name: orgName, status: 'failed', error: 'Nenhum responsável encontrado' })
      }
    }

    const skipped = organization_ids.length - sent
    await db.update(campaignRuns).set({ sentCount: sent, skippedCount: skipped }).where(eq(campaignRuns.id, run.id))

    return NextResponse.json({ sent, skipped, results })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    logServerError('[POST /api/admin/campaigns/[type]]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
