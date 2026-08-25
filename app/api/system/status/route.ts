import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { adminSystemSettings } from '@/lib/db/schema'
import { inArray } from 'drizzle-orm'

let cache: { maintenanceMode: boolean; enableSignup: boolean; at: number } | null = null
const CACHE_TTL_MS = 30_000

export async function GET() {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return NextResponse.json(cache, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
    })
  }

  try {
    const rows = await db
      .select({ key: adminSystemSettings.key, value: adminSystemSettings.value })
      .from(adminSystemSettings)
      .where(inArray(adminSystemSettings.key, ['maintenance_mode', 'enable_signup']))

    const map: Record<string, string> = {}
    for (const row of rows) map[row.key] = row.value

    const result = {
      maintenanceMode: map.maintenance_mode === 'true',
      enableSignup: map.enable_signup !== 'false',
      at: Date.now(),
    }

    cache = result
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
    })
  } catch {
    return NextResponse.json({ maintenanceMode: false, enableSignup: true })
  }
}
