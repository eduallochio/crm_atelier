import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { orgServiceOrderNotes, orgServiceOrders } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth/session'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const notes = await db
      .select({
        id:             orgServiceOrderNotes.id,
        orderId:        orgServiceOrderNotes.orderId,
        organizationId: orgServiceOrderNotes.organizationId,
        userEmail:      orgServiceOrderNotes.userEmail,
        nota:           orgServiceOrderNotes.nota,
        createdAt:      orgServiceOrderNotes.createdAt,
      })
      .from(orgServiceOrderNotes)
      .innerJoin(orgServiceOrders, eq(orgServiceOrders.id, orgServiceOrderNotes.orderId))
      .where(and(
        eq(orgServiceOrderNotes.orderId, id),
        eq(orgServiceOrders.organizationId, user.organizationId)
      ))
      .orderBy(desc(orgServiceOrderNotes.createdAt))

    return NextResponse.json(notes)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[GET /api/orders/:id/notes]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { id } = await params

    const [note] = await db
      .insert(orgServiceOrderNotes)
      .values({
        orderId:        id,
        organizationId: user.organizationId,
        userEmail:      user.email || '',
        nota:           body.nota,
      })
      .returning()

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[POST /api/orders/:id/notes]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
