import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgTransactions } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET() {
  try {
    const user = await requireAuth()

    const rows = await db
      .select()
      .from(orgTransactions)
      .where(eq(orgTransactions.organizationId, user.organizationId))
      .orderBy(desc(orgTransactions.dataTransacao))

    // Expose dataTransacao also as `data` for backwards compat with existing hooks
    const mapped = rows.map((r) => ({ ...r, data: r.dataTransacao }))

    return NextResponse.json(mapped)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[GET /api/financial/transactions]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const valor = parseFloat(String(body.valor).replace(',', '.'))

    const [row] = await db
      .insert(orgTransactions)
      .values({
        organizationId:  user.organizationId,
        tipo:            body.tipo,
        descricao:       body.descricao,
        valor:           String(valor),
        dataTransacao:   body.data_transacao,
        categoryId:      body.category_id      || null,
        paymentMethodId: body.payment_method_id || null,
        receivableId:    body.receivable_id     || null,
        payableId:       body.payable_id        || null,
        observacoes:     body.observacoes       || null,
      })
      .returning()

    return NextResponse.json({ ...row, data: row.dataTransacao }, { status: 201 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[POST /api/financial/transactions]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
