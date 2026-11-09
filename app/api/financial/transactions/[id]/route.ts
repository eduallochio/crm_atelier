import { NextResponse } from 'next/server'
import { requireAuth, assertPermission } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgTransactions } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
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

    const [transaction] = await db
      .select({
        id:             orgTransactions.id,
        receivableId:   orgTransactions.receivableId,
        payableId:      orgTransactions.payableId,
        serviceOrderId: orgTransactions.serviceOrderId,
      })
      .from(orgTransactions)
      .where(and(eq(orgTransactions.id, id), eq(orgTransactions.organizationId, user.organizationId)))

    if (!transaction) {
      return NextResponse.json({ error: 'Lançamento não encontrado' }, { status: 404 })
    }

    // Só permite apagar lançamentos avulsos — transações vinculadas a uma conta
    // a receber/pagar ou ordem de serviço refletem um registro real (pagamento,
    // baixa) e apagá-las deixaria esses outros registros com o status errado
    if (transaction.receivableId || transaction.payableId || transaction.serviceOrderId) {
      return NextResponse.json(
        { error: 'Este lançamento está vinculado a uma conta ou ordem de serviço e não pode ser excluído diretamente.' },
        { status: 409 }
      )
    }

    await db
      .delete(orgTransactions)
      .where(and(eq(orgTransactions.id, id), eq(orgTransactions.organizationId, user.organizationId)))

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    if ((error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Recurso disponível apenas no plano pago' }, { status: 403 })
    }
    logServerError('[DELETE /api/financial/transactions/:id]', error); console.error('[DELETE /api/financial/transactions/:id]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
