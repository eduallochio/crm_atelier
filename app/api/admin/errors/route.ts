import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { adminErrorLogs } from '@/lib/db/schema'
import { desc, eq, and, isNull } from 'drizzle-orm'
import { requireMaster } from '@/lib/auth/session'
import { getSessionUser } from '@/lib/auth/session'
import { createClient as createServiceClient } from '@supabase/supabase-js'

// POST — recebe erro do frontend (não exige auth, usa service role para gravar)
export async function POST(request: Request) {
  try {
    const body = await request.json()

    const user = await getSessionUser().catch(() => null)

    await db.insert(adminErrorLogs).values({
      organizationId: user?.organizationId ?? null,
      userId:         user?.id ?? null,
      message:        String(body.message ?? 'Unknown error').slice(0, 2000),
      stack:          body.stack ? String(body.stack).slice(0, 5000) : null,
      componentStack: body.componentStack ? String(body.componentStack).slice(0, 3000) : null,
      errorType:      body.errorType ?? 'runtime',
      severity:       body.severity ?? 'error',
      url:            body.url ? String(body.url).slice(0, 500) : null,
      userAgent:      request.headers.get('user-agent')?.slice(0, 300) ?? null,
      extra:          body.extra ?? null,
    })

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/admin/errors]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// GET — lista erros (somente master)
export async function GET(request: Request) {
  try {
    await requireMaster()

    const { searchParams } = new URL(request.url)
    const resolved = searchParams.get('resolved')
    const limit = Math.min(Number(searchParams.get('limit') ?? 100), 200)

    const conditions = []
    if (resolved === 'false') conditions.push(eq(adminErrorLogs.resolved, false))
    if (resolved === 'true')  conditions.push(eq(adminErrorLogs.resolved, true))

    const rows = await db
      .select()
      .from(adminErrorLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(adminErrorLogs.createdAt))
      .limit(limit)

    return NextResponse.json(rows)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    if ((error as Error).message === 'FORBIDDEN')    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    console.error('[GET /api/admin/errors]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
