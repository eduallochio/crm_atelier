import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgStockEntries, orgStockEntryItems, organizations } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const [org] = await db
      .select({ plan: organizations.plan })
      .from(organizations)
      .where(eq(organizations.id, user.organizationId))
    if (org?.plan === 'free') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const [entry] = await db
      .select()
      .from(orgStockEntries)
      .where(and(eq(orgStockEntries.id, id), eq(orgStockEntries.organizationId, user.organizationId)))

    if (!entry) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

    const items = await db
      .select()
      .from(orgStockEntryItems)
      .where(eq(orgStockEntryItems.entryId, id))

    return NextResponse.json({ ...entry, itens: items })
  } catch (error) {
    const msg = (error as Error).message
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    logServerError('[GET /api/inventory/entries/[id]]', error); console.error('[GET /api/inventory/entries/[id]]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
