import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

const KEYS = [
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
    const pool = await getPool()
    const inClause = KEYS.map((k) => `'${k}'`).join(',')
    const result = await pool.request().query(
      `SELECT [key], value FROM admin_system_settings WHERE [key] IN (${inClause})`
    )
    const data: Record<string, string> = {}
    for (const row of result.recordset) data[row.key as string] = row.value as string
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    })
  } catch (error) {
    console.error('[GET /api/landing]', error)
    return NextResponse.json({}, { status: 200 }) // retorna vazio em vez de erro (usa defaults)
  }
}
