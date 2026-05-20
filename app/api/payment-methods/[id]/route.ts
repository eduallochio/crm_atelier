import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgPaymentMethods } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'

function mapRow(row: typeof orgPaymentMethods.$inferSelect) {
  return {
    id:              row.id,
    organization_id: row.organizationId,
    name:            row.nome,
    code:            row.tipo ?? '',
    enabled:         row.ativo,
    display_order:   row.sortOrder,
    created_at:      row.createdAt,
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { id } = await params

    const updated = await db
      .update(orgPaymentMethods)
      .set({
        nome:      body.name      ?? undefined,
        tipo:      body.code      ?? null,
        ativo:     body.enabled   !== undefined ? !!body.enabled : true,
        sortOrder: body.display_order ?? 0,
      })
      .where(
        and(
          eq(orgPaymentMethods.id, id),
          eq(orgPaymentMethods.organizationId, user.organizationId)
        )
      )
      .returning()

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    }

    return NextResponse.json(mapRow(updated[0]))
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[PUT /api/payment-methods/:id]', error); console.error('[PUT /api/payment-methods/:id]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    await db
      .delete(orgPaymentMethods)
      .where(
        and(
          eq(orgPaymentMethods.id, id),
          eq(orgPaymentMethods.organizationId, user.organizationId)
        )
      )

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[DELETE /api/payment-methods/:id]', error); console.error('[DELETE /api/payment-methods/:id]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
