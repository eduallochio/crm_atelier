import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { adminErrorLogs } from '@/lib/db/schema'
import { desc, eq, and } from 'drizzle-orm'
import { requireMaster, getSessionUser } from '@/lib/auth/session'

// Contador simples de tentativas por IP para evitar flood (in-memory, suficiente para serverless)
const errorFloodMap = new Map<string, { count: number; resetAt: number }>()
const FLOOD_LIMIT = 20
const FLOOD_WINDOW_MS = 60_000 // 1 minuto

function isFlooding(ip: string): boolean {
  const now = Date.now()
  const entry = errorFloodMap.get(ip)
  if (!entry || now > entry.resetAt) {
    errorFloodMap.set(ip, { count: 1, resetAt: now + FLOOD_WINDOW_MS })
    return false
  }
  entry.count++
  return entry.count > FLOOD_LIMIT
}

// POST — recebe erro do frontend
// Exige usuário autenticado OU token interno INTERNAL_ERROR_TOKEN
export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    if (isFlooding(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    // Aceita usuário autenticado ou token interno (para erros de SSR/server-side)
    const internalToken = request.headers.get('x-internal-token')
    const validInternal = internalToken && internalToken === process.env.INTERNAL_ERROR_TOKEN

    const user = await getSessionUser().catch(() => null)

    if (!user && !validInternal) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()

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

// DELETE — apaga todos os erros resolvidos
export async function DELETE() {
  try {
    await requireMaster()
    const result = await db
      .delete(adminErrorLogs)
      .where(eq(adminErrorLogs.resolved, true))
      .returning({ id: adminErrorLogs.id })
    return NextResponse.json({ deleted: result.length })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    if ((error as Error).message === 'FORBIDDEN')    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    console.error('[DELETE /api/admin/errors]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
