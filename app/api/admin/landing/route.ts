import { NextResponse } from 'next/server'
import { requireMaster } from '@/lib/auth/session'
import { getPool, sql } from '@/lib/db'

const ALLOWED_KEYS = [
  'hero_title', 'hero_subtitle', 'hero_cta_primary', 'hero_cta_secondary',
  'features_title', 'features_subtitle',
  'how_it_works_title',
  'stats_orgs', 'stats_clients', 'stats_orders',
  'footer_tagline',
  'testimonials_json',
  'features_json',
  'how_it_works_json',
  'faq_json',
]

export async function GET() {
  try {
    await requireMaster()
    const pool = await getPool()
    const inClause = ALLOWED_KEYS.map((k) => `'${k}'`).join(',')
    const result = await pool.request().query(
      `SELECT [key], value FROM admin_system_settings WHERE [key] IN (${inClause})`
    )
    const data: Record<string, string> = {}
    for (const row of result.recordset) data[row.key as string] = row.value as string
    return NextResponse.json(data)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    console.error('[GET /api/admin/landing]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    await requireMaster()
    const body = await request.json()
    const pool = await getPool()

    for (const [key, value] of Object.entries(body)) {
      if (!ALLOWED_KEYS.includes(key)) continue
      await pool.request()
        .input('k', sql.NVarChar, key)
        .input('v', sql.NVarChar, String(value))
        .query(`
          UPDATE admin_system_settings SET value = @v, updated_at = GETDATE() WHERE [key] = @k
          IF @@ROWCOUNT = 0
            INSERT INTO admin_system_settings ([key], value, updated_at) VALUES (@k, @v, GETDATE())
        `)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    console.error('[PUT /api/admin/landing]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
