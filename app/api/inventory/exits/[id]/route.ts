import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgStockExits, orgStockExitItems, organizations } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const [org] = await db
      .select({ plan: organizations.plan })
      .from(organizations)
      .where(eq(organizations.id, user.organizationId))
    if (org?.plan === 'free') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

    const [exit] = await db
      .select()
      .from(orgStockExits)
      .where(and(eq(orgStockExits.id, id), eq(orgStockExits.organizationId, user.organizationId)))

    if (!exit) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

    const items = await db
      .select()
      .from(orgStockExitItems)
      .where(eq(orgStockExitItems.exitId, id))

    return NextResponse.json({ ...exit, itens: items })
  } catch (error) {
    const msg = (error as Error).message
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    console.error('[GET /api/inventory/exits/[id]]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params

    // Items are deleted by CASCADE → trigger reverts stock automatically
    const [deleted] = await db
      .delete(orgStockExits)
      .where(and(eq(orgStockExits.id, id), eq(orgStockExits.organizationId, user.organizationId)))
      .returning({ id: orgStockExits.id })

    if (!deleted) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    const msg = (error as Error).message
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    console.error('[DELETE /api/inventory/exits/[id]]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
