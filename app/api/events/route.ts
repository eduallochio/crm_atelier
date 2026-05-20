import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pageEvents } from '@/lib/db/schema'
import { logServerError } from '@/lib/log-error'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))

    const {
      event_type,
      page,
      metadata,
    } = body as {
      event_type?: string
      page?: string
      metadata?: unknown
    }

    if (!event_type) {
      return NextResponse.json({ ok: true })
    }

    // Build data object for jsonb field
    const data: Record<string, unknown> = {}
    if (metadata !== undefined && metadata !== null) {
      data.metadata = typeof metadata === 'string' ? metadata : metadata
    }

    // Store referrer and utm fields in data jsonb
    if (body.session_id) data.session_id = String(body.session_id).slice(0, 100)
    if (body.referrer) data.referrer = String(body.referrer).slice(0, 500)
    if (body.utm_source) data.utm_source = String(body.utm_source).slice(0, 100)
    if (body.utm_medium) data.utm_medium = String(body.utm_medium).slice(0, 100)
    if (body.utm_campaign) data.utm_campaign = String(body.utm_campaign).slice(0, 100)

    const userAgent = (req.headers.get('user-agent') ?? '').slice(0, 500)
    if (userAgent) data.user_agent = userAgent

    await db.insert(pageEvents).values({
      event: event_type.slice(0, 50),
      page: (page ?? '').slice(0, 255) || 'unknown',
      data: Object.keys(data).length > 0 ? data : null,
    })
  } catch (error) {
    // Nunca retorna erro para não quebrar o frontend
    logServerError('[POST /api/events]', error); console.error('[POST /api/events]', error)
  }

  return NextResponse.json({ ok: true })
}
