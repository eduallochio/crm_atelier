import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { plans } from '@/lib/db/schema'
import { sql as drizzleSql } from 'drizzle-orm'

export async function GET() {
  try {
    const result = await db.select({ count: drizzleSql<number>`count(*)` }).from(plans)
    return NextResponse.json({
      ok: true,
      database: 'Supabase (Drizzle ORM)',
      plansCount: Number(result[0]?.count ?? 0),
    })
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 })
  }
}
