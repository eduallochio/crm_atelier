import { NextResponse } from 'next/server'
import { requireMasterFast } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { campaignRuns, campaignSends } from '@/lib/db/schema'
import { eq, desc, sql } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'

const CAMPAIGN = 'reengagement'

// GET — histórico de execuções do disparo, com taxa de abertura/clique
// calculada a partir de campaign_sends daquele run_id
export async function GET() {
  try {
    await requireMasterFast()

    // LEFT JOIN + GROUP BY em vez de subquery correlacionada: campaign_runs
    // e campaign_sends têm as duas uma coluna "id" — numa subquery sql`...`
    // com ${campaignRuns.id} dentro do WHERE, o Postgres resolve "id" pelo
    // escopo mais interno (campaign_sends.id, não campaign_runs.id), porque
    // o Drizzle não qualifica a coluna com o nome da tabela nesse contexto.
    // Isso fazia a comparação virar sempre falsa e a contagem sempre zero.
    const runs = await db
      .select({
        id:           campaignRuns.id,
        sentCount:    campaignRuns.sentCount,
        skippedCount: campaignRuns.skippedCount,
        createdAt:    campaignRuns.createdAt,
        openedCount:  sql<number>`count(*) filter (where ${campaignSends.openedAt} is not null)`,
        clickedCount: sql<number>`count(*) filter (where ${campaignSends.clickedAt} is not null)`,
      })
      .from(campaignRuns)
      .leftJoin(campaignSends, eq(campaignSends.runId, campaignRuns.id))
      .where(eq(campaignRuns.campaign, CAMPAIGN))
      .groupBy(campaignRuns.id, campaignRuns.sentCount, campaignRuns.skippedCount, campaignRuns.createdAt)
      .orderBy(desc(campaignRuns.createdAt))
      .limit(20)

    const result = runs.map((r) => ({
      id: r.id,
      sent_count: r.sentCount,
      skipped_count: r.skippedCount,
      opened_count: Number(r.openedCount),
      clicked_count: Number(r.clickedCount),
      created_at: r.createdAt,
    }))

    return NextResponse.json(result)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    logServerError('[GET /api/admin/campaigns/reengagement/runs]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
