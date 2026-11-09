import { NextResponse } from 'next/server'
import { requireAuth, assertPermission } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgPaymentMethods, orgTransactions, orgReceivables, orgCashierMovements } from '@/lib/db/schema'
import { eq, and, count } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'
import { requireProPlan } from '@/lib/plan-limits'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    assertPermission(user, 'financeiro')
    await requireProPlan(user.organizationId)
    const { id } = await params

    // Verificar se o método está em uso antes de deletar
    const [txCount, recCount, movCount] = await Promise.all([
      db.select({ n: count() }).from(orgTransactions).where(eq(orgTransactions.paymentMethodId, id)),
      db.select({ n: count() }).from(orgReceivables).where(eq(orgReceivables.paymentMethodId, id)),
      db.select({ n: count() }).from(orgCashierMovements).where(eq(orgCashierMovements.metodoPagamentoId, id)),
    ])

    const totalUsos = Number(txCount[0]?.n ?? 0) + Number(recCount[0]?.n ?? 0) + Number(movCount[0]?.n ?? 0)
    if (totalUsos > 0) {
      return NextResponse.json(
        { error: `Este método de pagamento está em uso em ${totalUsos} registro(s) e não pode ser excluído. Desative-o em vez de deletar.` },
        { status: 409 }
      )
    }

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
    if ((error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Recurso disponível apenas no plano pago' }, { status: 403 })
    }
    logServerError('[DELETE /api/financial/payment-methods/:id]', error); console.error('[DELETE /api/financial/payment-methods/:id]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
