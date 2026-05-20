import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgPaymentMethods } from '@/lib/db/schema'
import { eq, asc } from 'drizzle-orm'

export async function GET() {
  try {
    const user = await requireAuth()

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
    console.error('[GET /api/financial/payment-methods]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
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
    console.error('[POST /api/financial/payment-methods]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
