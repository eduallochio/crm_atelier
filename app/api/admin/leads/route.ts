import { NextRequest, NextResponse } from 'next/server'
import { requireMaster } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { promoLeads } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'

export async function GET() {
  try {
    await requireMaster()
    const rows = await db.select().from(promoLeads).orderBy(desc(promoLeads.createdAt))
    return NextResponse.json(rows)
  } catch (error) {
    const msg = (error as Error).message
    if (msg === 'UNAUTHORIZED' || msg === 'FORBIDDEN')
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    logServerError('[GET /api/admin/leads]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
