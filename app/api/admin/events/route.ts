import { NextResponse } from 'next/server'
import { requireMaster } from '@/lib/auth/session'
import { getPool } from '@/lib/db'

export async function GET() {
  try {
    await requireMaster()
    const pool = await getPool()

    // ── Funil de conversão (últimos 30 dias) ────────────────────────────────
    const funnelResult = await pool.request().query(`
      SELECT event_type, COUNT(*) AS cnt
      FROM page_events
      WHERE created_at >= DATEADD(day, -30, GETDATE())
        AND event_type IN ('page_view', 'cta_click', 'signup_started', 'signup_completed')
      GROUP BY event_type
    `)

    const funnelMap: Record<string, number> = {}
    for (const row of funnelResult.recordset) {
      funnelMap[row.event_type as string] = Number(row.cnt)
    }

    const page_views        = funnelMap['page_view']        ?? 0
    const cta_clicks        = funnelMap['cta_click']        ?? 0
    const signup_started    = funnelMap['signup_started']   ?? 0
    const signup_completed  = funnelMap['signup_completed'] ?? 0
    const conversion_rate   = page_views > 0
      ? Math.round((signup_completed / page_views) * 10000) / 100
      : 0

    // ── Visitantes únicos por dia (últimos 14 dias) ──────────────────────────
    const dailyResult = await pool.request().query(`
      SELECT
        CAST(created_at AS DATE) AS [date],
        COUNT(DISTINCT session_id) AS visitors,
        SUM(CASE WHEN event_type = 'signup_completed' THEN 1 ELSE 0 END) AS signups
      FROM page_events
      WHERE created_at >= DATEADD(day, -14, GETDATE())
      GROUP BY CAST(created_at AS DATE)
      ORDER BY [date] ASC
    `)

    const daily_visitors = dailyResult.recordset.map((r) => ({
      date:     (r.date as Date).toISOString().slice(0, 10),
      visitors: Number(r.visitors),
      signups:  Number(r.signups),
    }))

    // ── Top referrers ────────────────────────────────────────────────────────
    const referrersResult = await pool.request().query(`
      SELECT TOP 10
        referrer,
        COUNT(*) AS cnt
      FROM page_events
      WHERE created_at >= DATEADD(day, -30, GETDATE())
        AND referrer IS NOT NULL
        AND referrer <> ''
      GROUP BY referrer
      ORDER BY cnt DESC
    `)

    const top_referrers = referrersResult.recordset.map((r) => ({
      referrer: r.referrer as string,
      count:    Number(r.cnt),
    }))

    // ── Top UTM sources ──────────────────────────────────────────────────────
    const sourcesResult = await pool.request().query(`
      SELECT TOP 10
        utm_source AS source,
        COUNT(*) AS cnt
      FROM page_events
      WHERE created_at >= DATEADD(day, -30, GETDATE())
        AND utm_source IS NOT NULL
        AND utm_source <> ''
      GROUP BY utm_source
      ORDER BY cnt DESC
    `)

    const top_sources = sourcesResult.recordset.map((r) => ({
      source: r.source as string,
      count:  Number(r.cnt),
    }))

    // ── Abandono de cadastro ─────────────────────────────────────────────────
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
    console.error('[GET /api/admin/events]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
