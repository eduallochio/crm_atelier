import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgPaymentMethods } from '@/lib/db/schema'
import { eq, asc } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'
import { requireProPlan } from '@/lib/plan-limits'

export async function GET() {
  try {
    const user = await requireAuth()
    await requireProPlan(user.organizationId)

    const rows = await db
      .select()
      .from(orgPaymentMethods)
      .where(eq(orgPaymentMethods.organizationId, user.organizationId))
      .orderBy(asc(orgPaymentMethods.nome))

    return NextResponse.json(rows)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    if ((error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Recurso disponível apenas no plano pago' }, { status: 403 })
    }
    logServerError('[GET /api/financial/payment-methods]', error); console.error('[GET /api/financial/payment-methods]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    await requireProPlan(user.organizationId)
    const body = await request.json()

    const [row] = await db
      .insert(orgPaymentMethods)
      .values({
        organizationId: user.organizationId,
        nome:           body.nome,
        tipo:           body.tipo || null,
        ativo:          body.ativo !== false,
      })
      .returning()

    return NextResponse.json(row, { status: 201 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    if ((error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Recurso disponível apenas no plano pago' }, { status: 403 })
    }
    logServerError('[POST /api/financial/payment-methods]', error); console.error('[POST /api/financial/payment-methods]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
