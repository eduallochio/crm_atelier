import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { adminSystemSettings } from '@/lib/db/schema'
import { inArray } from 'drizzle-orm'

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
    const rows = await db
      .select({ key: adminSystemSettings.key, value: adminSystemSettings.value })
      .from(adminSystemSettings)
      .where(inArray(adminSystemSettings.key, KEYS))

    const data: Record<string, string> = {}
    for (const row of rows) data[row.key] = row.value

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    })
  } catch (error) {
    console.error('[GET /api/landing]', error)
    return NextResponse.json({}, { status: 200 }) // retorna vazio em vez de erro (usa defaults)
  }
}
