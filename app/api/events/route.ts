import { NextRequest, NextResponse } from 'next/server'
import { getPool, sql } from '@/lib/db'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))

    const {
      event_type,
      session_id,
      page,
      referrer,
      utm_source,
      utm_medium,
      utm_campaign,
      metadata,
    } = body as {
      event_type?: string
      session_id?: string
      page?: string
      referrer?: string
      utm_source?: string
      utm_medium?: string
      utm_campaign?: string
      metadata?: unknown
    }

    if (!event_type) {
      return NextResponse.json({ ok: true })
    }

    // Hash do IP para conformidade LGPD
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') ?? ''
    const ip_hash = ip ? crypto.createHash('sha256').update(ip).digest('hex') : null

    const user_agent = (req.headers.get('user-agent') ?? '').slice(0, 500)

    // Limita metadata a 1000 chars
    let metadata_str: string | null = null
    if (metadata !== undefined && metadata !== null) {
      const raw = typeof metadata === 'string' ? metadata : JSON.stringify(metadata)
      metadata_str = raw.slice(0, 1000)
    }

    const pool = await getPool()
    await pool
      .request()
      .input('event_type',   sql.NVarChar(50),  (event_type  ?? '').slice(0, 50)  || null)
      .input('session_id',   sql.NVarChar(100), (session_id  ?? '').slice(0, 100) || null)
      .input('page',         sql.NVarChar(255), (page        ?? '').slice(0, 255) || null)
      .input('referrer',     sql.NVarChar(500), (referrer    ?? '').slice(0, 500) || null)
      .input('utm_source',   sql.NVarChar(100), (utm_source  ?? '').slice(0, 100) || null)
      .input('utm_medium',   sql.NVarChar(100), (utm_medium  ?? '').slice(0, 100) || null)
      .input('utm_campaign', sql.NVarChar(100), (utm_campaign ?? '').slice(0, 100) || null)
      .input('metadata',     sql.NVarChar(sql.MAX), metadata_str)
      .input('ip_hash',      sql.NVarChar(100), ip_hash)
      .input('user_agent',   sql.NVarChar(500), user_agent || null)
      .query(`
        INSERT INTO page_events
          (event_type, session_id, page, referrer, utm_source, utm_medium, utm_campaign, metadata, ip_hash, user_agent)
        VALUES
          (@event_type, @session_id, @page, @referrer, @utm_source, @utm_medium, @utm_campaign, @metadata, @ip_hash, @user_agent)
      `)
  } catch (error) {
    // Nunca retorna erro para não quebrar o frontend
    console.error('[POST /api/events]', error)
  }

  return NextResponse.json({ ok: true })
}
