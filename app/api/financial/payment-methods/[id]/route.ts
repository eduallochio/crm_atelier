import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgPaymentMethods } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const [row] = await db
      .delete(orgPaymentMethods)
      .where(
        and(
          eq(orgPaymentMethods.id, id),
          eq(orgPaymentMethods.organizationId, user.organizationId)
        )
      )
      .returning({ id: orgPaymentMethods.id })

    if (!row) {
      return NextResponse.json({ error: 'Método de pagamento não encontrado' }, { status: 404 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[DELETE /api/financial/payment-methods/:id]', error); console.error('[DELETE /api/financial/payment-methods/:id]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
