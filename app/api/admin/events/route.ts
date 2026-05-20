import { NextResponse } from 'next/server'
import { requireMaster } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { pageEvents } from '@/lib/db/schema'
import { gte, sql as drizzleSql, count, isNotNull, ne } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'

export async function GET() {
  try {
    await requireMaster()

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

    // Top referrers — stored in data->>'referrer'
    const referrersRows = await db
      .select({
        referrer: drizzleSql<string>`data->>'referrer'`,
        cnt:      count(),
      })
      .from(pageEvents)
      .where(gte(pageEvents.createdAt, thirtyDaysAgo))
      .groupBy(drizzleSql`data->>'referrer'`)
      .orderBy(drizzleSql`COUNT(*) DESC`)
      .limit(10)

    const top_referrers = referrersRows
      .filter((r) => r.referrer && r.referrer !== '')
      .map((r) => ({ referrer: r.referrer, count: Number(r.cnt) }))

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
