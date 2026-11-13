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
    // Para cada sessão, usa o referrer do primeiro page_view — é o que
    // define por onde aquele visitante chegou — e junta com os eventos de
    // conversão da mesma sessão (mesmo navegador, via localStorage) para
    // saber quantos desses visitantes de cada canal avançaram no funil,
    // não só quantos chegaram.
    //
    // Processado em JS (não em SQL raw com regexp_replace) para extrair o
    // domínio — mais simples de revisar e evita depender de escape de
    // regex dentro de template literal SQL.
    const rawEventsRows = await db
      .select({
        event:     pageEvents.event,
        sessionId: drizzleSql<string | null>`data->>'session_id'`,
        referrer:  drizzleSql<string | null>`data->>'referrer'`,
        createdAt: pageEvents.createdAt,
      })
      .from(pageEvents)
      .where(gte(pageEvents.createdAt, thirtyDaysAgo))

    function extractDomain(referrer: string): string | null {
      try {
        const host = new URL(referrer).hostname.toLowerCase()
        return host.startsWith('www.') ? host.slice(4) : host
      } catch {
        return null
      }
    }

    const ownDomain = 'meuateliersistema.com.br'
    const firstDomainBySession = new Map<string, string>()
    const ctaBySession = new Map<string, boolean>()
    const signupBySession = new Map<string, boolean>()

    // Ordena por data para pegar o PRIMEIRO page_view de cada sessão (igual
    // ao DISTINCT ON ... ORDER BY created_at ASC da versão anterior em SQL)
    const sortedRows = [...rawEventsRows].sort((a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0))

    for (const row of sortedRows) {
      const sessionId = row.sessionId
      if (!sessionId) continue

      if (row.event === 'cta_click') ctaBySession.set(sessionId, true)
      if (row.event === 'signup_completed') signupBySession.set(sessionId, true)

      if (row.event === 'page_view' && row.referrer && !firstDomainBySession.has(sessionId)) {
        const domain = extractDomain(row.referrer)
        if (domain && !domain.includes('localhost') && domain !== ownDomain) {
          firstDomainBySession.set(sessionId, domain)
        }
      }
    }

    const statsByDomain = new Map<string, { visitors: number; ctaClicks: number; signups: number }>()
    for (const [sessionId, domain] of firstDomainBySession) {
      const stats = statsByDomain.get(domain) ?? { visitors: 0, ctaClicks: 0, signups: 0 }
      stats.visitors += 1
      if (ctaBySession.get(sessionId)) stats.ctaClicks += 1
      if (signupBySession.get(sessionId)) stats.signups += 1
      statsByDomain.set(domain, stats)
    }

    // Assistentes de IA que geram link clicável nas respostas — visitante
    // real clicando num link sugerido pela IA, não a IA "acessando" o site
    const AI_ASSISTANT_DOMAINS = new Set([
      'chatgpt.com', 'chat.openai.com', 'perplexity.ai', 'gemini.google.com',
      'claude.ai', 'copilot.microsoft.com', 'bing.com',
    ])

    const top_referrers = [...statsByDomain.entries()]
      .sort((a, b) => b[1].visitors - a[1].visitors)
      .slice(0, 15)
      .map(([domain, stats]) => ({
        referrer:   domain,
        count:      stats.visitors,
        cta_clicks: stats.ctaClicks,
        signups:    stats.signups,
        is_ai:      AI_ASSISTANT_DOMAINS.has(domain),
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
