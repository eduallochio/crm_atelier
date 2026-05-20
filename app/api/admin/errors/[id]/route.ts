import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { adminErrorLogs } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireMaster } from '@/lib/auth/session'

// PATCH — marcar como resolvido / reabrir
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireMaster()
    const { id } = await params
    const body = await request.json()

    const resolved: boolean = body.resolved === true
    await db
      .update(adminErrorLogs)
      .set({
        resolved,
        resolvedAt:     resolved ? new Date() : null,
        resolutionNote: body.resolution_note ?? null,
      })
      .where(eq(adminErrorLogs.id, id))

    return NextResponse.json({ ok: true })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    if ((error as Error).message === 'FORBIDDEN')    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    console.error('[PATCH /api/admin/errors/:id]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE — apagar erro
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireMaster()
    const { id } = await params
    await db.delete(adminErrorLogs).where(eq(adminErrorLogs.id, id))
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    if ((error as Error).message === 'FORBIDDEN')    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    console.error('[DELETE /api/admin/errors/:id]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
