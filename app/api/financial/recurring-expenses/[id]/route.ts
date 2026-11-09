import { NextResponse } from 'next/server'
import { requireAuth, assertPermission } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgRecurringExpenses } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'
import { requireProPlan } from '@/lib/plan-limits'

// PUT — pausa a repetição (ativo = false). Não apaga o template nem as contas já geradas.
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    assertPermission(user, 'financeiro')
    await requireProPlan(user.organizationId)
    const { id } = await params
    const body = await request.json()

    const [updated] = await db
      .update(orgRecurringExpenses)
      .set({ ativo: body.ativo ?? false, updatedAt: new Date() })
      .where(
        and(
          eq(orgRecurringExpenses.id, id),
          eq(orgRecurringExpenses.organizationId, user.organizationId)
        )
      )
      .returning({ id: orgRecurringExpenses.id, ativo: orgRecurringExpenses.ativo })

    if (!updated) {
      return NextResponse.json({ error: 'Despesa recorrente não encontrada' }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    if ((error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Recurso disponível apenas no plano pago' }, { status: 403 })
    }
    logServerError('[PUT /api/financial/recurring-expenses/:id]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
