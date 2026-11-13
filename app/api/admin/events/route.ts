import { NextResponse } from 'next/server'
import { requireMasterFast } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { pageEvents } from '@/lib/db/schema'
import { gte, sql as drizzleSql, count, isNotNull, ne } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'

export async function GET() {
  try {
    await requireMasterFast()

    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const fourteenDaysAgo = new Date(); fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    // Funnel de conversão (últimos 30 dias) — using event field
    const funnelRows = await db
      .select({
        event: pageEvents.event,
        cnt:   count(),
      })
      .from(pageEvents)
      .where(gte(pageEvents.createdAt, thirtyDaysAgo))
      .groupBy(pageEvents.event)

    const funnelMap: Record<string, number> = {}
    for (const row of funnelRows) {
      funnelMap[row.event] = Number(row.cnt)
    }

    const page_views       = funnelMap['page_view']        ?? 0
    const cta_clicks       = funnelMap['cta_click']        ?? 0
    const signup_started   = funnelMap['signup_started']   ?? 0
    const signup_completed = funnelMap['signup_completed'] ?? 0
    const conversion_rate  = page_views > 0
      ? Math.round((signup_completed / page_views) * 10000) / 100
      : 0

    // Visitantes únicos por dia (últimos 14 dias) — session_id stored in data jsonb
    const dailyRows = await db
      .select({
        date:    drizzleSql<string>`DATE_TRUNC('day', created_at)::date`,
        visitors: drizzleSql<number>`COUNT(DISTINCT data->>'session_id')::int`,
        signups:  drizzleSql<number>`COUNT(*) FILTER (WHERE event = 'signup_completed')::int`,
      })
      .from(pageEvents)
      .where(gte(pageEvents.createdAt, fourteenDaysAgo))
      .groupBy(drizzleSql`DATE_TRUNC('day', created_at)::date`)
      .orderBy(drizzleSql`DATE_TRUNC('day', created_at)::date ASC`)

    const daily_visitors = dailyRows.map((r) => ({
      date:     String(r.date).slice(0, 10),
      visitors: Number(r.visitors),
      signups:  Number(r.signups),
    }))

    // Top referrers — agrupado por domínio (não pela URL completa), para
    // "chatgpt.com/c/abc123" e "chatgpt.com/c/xyz789" somarem no mesmo
    // canal em vez de diluir a contagem em dezenas de linhas distintas.
    // Para cada sessão (data->>'session_id'), usa o referrer do primeiro
    // page_view — é o que define por onde aquele visitante chegou — e
    // junta com os eventos de conversão da mesma sessão (mesmo navegador,
    // via localStorage) para saber quantos desses visitantes de cada canal
    // avançaram no funil, não só quantos clicaram.
    const referrersResult = await db.execute(drizzleSql`
      WITH first_view AS (
        SELECT DISTINCT ON (data->>'session_id')
          data->>'session_id' AS session_id,
          lower(regexp_replace(data->>'referrer', '^https?://(www\.)?([^/]+).*$', '\2')) AS domain,
          created_at
        FROM page_events
        WHERE event = 'page_view'
          AND created_at >= ${thirtyDaysAgo}
          AND data->>'referrer' IS NOT NULL
          AND data->>'referrer' != ''
          AND data->>'referrer' NOT ILIKE '%localhost%'
          AND data->>'referrer' NOT ILIKE '%meuateliersistema.com.br%'
          AND data->>'session_id' IS NOT NULL
        ORDER BY data->>'session_id', created_at ASC
      ),
      session_events AS (
        SELECT
          data->>'session_id' AS session_id,
          bool_or(event = 'cta_click') AS clicked_cta,
          bool_or(event = 'signup_completed') AS completed_signup
        FROM page_events
        WHERE created_at >= ${thirtyDaysAgo}
          AND data->>'session_id' IS NOT NULL
        GROUP BY data->>'session_id'
      )
      SELECT
        fv.domain,
        COUNT(*)::int AS visitors,
        COUNT(*) FILTER (WHERE se.clicked_cta)::int AS cta_clicks,
        COUNT(*) FILTER (WHERE se.completed_signup)::int AS signups
      FROM first_view fv
      LEFT JOIN session_events se ON se.session_id = fv.session_id
      WHERE fv.domain IS NOT NULL AND fv.domain != ''
      GROUP BY fv.domain
      ORDER BY visitors DESC
      LIMIT 15
    `)

    // Assistentes de IA que geram link clicável nas respostas — visitante
    // real clicando num link sugerido pela IA, não a IA "acessando" o site
    const AI_ASSISTANT_DOMAINS = new Set([
      'chatgpt.com', 'chat.openai.com', 'perplexity.ai', 'gemini.google.com',
      'claude.ai', 'copilot.microsoft.com', 'bing.com',
    ])

    const referrersRows = Array.from(referrersResult) as Array<{ domain: string; visitors: number; cta_clicks: number; signups: number }>

    const top_referrers = referrersRows
      .map((r) => ({
        referrer:   r.domain,
        count:      Number(r.visitors),
        cta_clicks: Number(r.cta_clicks),
        signups:    Number(r.signups),
        is_ai:      AI_ASSISTANT_DOMAINS.has(r.domain),
      }))

    // Top UTM sources — stored in data->>'utm_source'
    const sourcesRows = await db
      .select({
        source: drizzleSql<string>`data->>'utm_source'`,
        cnt:    count(),
      })
      .from(pageEvents)
      .where(gte(pageEvents.createdAt, thirtyDaysAgo))
      .groupBy(drizzleSql`data->>'utm_source'`)
      .orderBy(drizzleSql`COUNT(*) DESC`)
      .limit(10)

    const top_sources = sourcesRows
      .filter((r) => r.source && r.source !== '')
      .map((r) => ({ source: r.source, count: Number(r.cnt) }))

    const started   = signup_started
    const completed = signup_completed
    const abandoned = Math.max(0, started - completed)
    const abandonment_rate = started > 0
      ? Math.round((abandoned / started) * 10000) / 100
      : 0

    return NextResponse.json({
      funnel: {
        page_views,
        cta_clicks,
        signup_started,
        signup_completed,
        conversion_rate,
      },
      daily_visitors,
      top_referrers,
      top_sources,
      signup_abandonment: {
        started,
        completed,
        abandoned,
        abandonment_rate,
      },
    })
  } catch (error) {
    if (
      (error as Error).message === 'UNAUTHORIZED' ||
      (error as Error).message === 'FORBIDDEN'
    ) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    logServerError('[GET /api/admin/events]', error); console.error('[GET /api/admin/events]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
