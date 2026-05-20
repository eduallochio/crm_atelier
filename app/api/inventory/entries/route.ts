import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgStockEntries, orgStockEntryItems, organizations } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'

async function checkPlan(organizationId: string) {
  const [org] = await db
    .select({ plan: organizations.plan })
    .from(organizations)
    .where(eq(organizations.id, organizationId))
  if (org?.plan === 'free') throw new Error('FORBIDDEN')
}

export async function GET() {
  try {
    const user = await requireAuth()
    await checkPlan(user.organizationId)

    const entries = await db
      .select()
      .from(orgStockEntries)
      .where(eq(orgStockEntries.organizationId, user.organizationId))
      .orderBy(desc(orgStockEntries.createdAt))

    const items = entries.length > 0
      ? await db
          .select()
          .from(orgStockEntryItems)
          .where(
            eq(
              orgStockEntryItems.entryId,
              // fetch all items for this org's entries via subquery-free approach
              // We'll filter in JS since Drizzle doesn't easily support IN(subquery) without raw
              orgStockEntryItems.entryId
            )
          )
          .then(async () => {
            // Fetch items for all entry ids
            const entryIds = entries.map(e => e.id)
            if (!entryIds.length) return []
            // Use individual queries batched — Drizzle inList
            const { inArray } = await import('drizzle-orm')
            return db
              .select()
              .from(orgStockEntryItems)
              .where(inArray(orgStockEntryItems.entryId, entryIds))
          })
      : []

    const entriesWithItems = entries.map(e => ({
      ...e,
      itens: items.filter(i => i.entryId === e.id),
    }))

    return NextResponse.json(entriesWithItems)
  } catch (error) {
    const msg = (error as Error).message
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    if (msg === 'FORBIDDEN') return NextResponse.json({ error: 'Recurso disponível apenas no plano pago' }, { status: 403 })
    logServerError('[GET /api/inventory/entries]', error); console.error('[GET /api/inventory/entries]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    await checkPlan(user.organizationId)

    const body = await request.json()
    const {
      tipo = 'entrada',
      supplierId,
      observacoes,
      itens = [],
    } = body

    if (!itens.length) return NextResponse.json({ error: 'Ao menos um item é obrigatório' }, { status: 400 })

    const [entry] = await db
      .insert(orgStockEntries)
      .values({
        organizationId: user.organizationId,
        supplierId: supplierId ?? null,
        tipo,
        observacoes: observacoes ?? null,
      })
      .returning()

    const insertedItems = await db
      .insert(orgStockEntryItems)
      .values(
        itens.map((item: {
          productId?: string
          quantidade: number
          valorUnitario?: number
          valorTotal?: number
        }) => ({
          entryId: entry.id,
          productId: item.productId ?? null,
          quantidade: Number(item.quantidade),
          valorUnitario: item.valorUnitario != null ? String(item.valorUnitario) : null,
          valorTotal: item.valorTotal != null ? String(item.valorTotal) : null,
        }))
      )
      .returning()

    return NextResponse.json({ ...entry, itens: insertedItems }, { status: 201 })
  } catch (error) {
    const msg = (error as Error).message
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    if (msg === 'FORBIDDEN') return NextResponse.json({ error: 'Recurso disponível apenas no plano pago' }, { status: 403 })
    logServerError('[POST /api/inventory/entries]', error); console.error('[POST /api/inventory/entries]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
