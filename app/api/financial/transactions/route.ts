import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgTransactions, orgPaymentMethods } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'

export async function GET() {
  try {
    const user = await requireAuth()

    const rows = await db
      .select({
        id:              orgTransactions.id,
        organizationId:  orgTransactions.organizationId,
        tipo:            orgTransactions.tipo,
        descricao:       orgTransactions.descricao,
        valor:           orgTransactions.valor,
        dataTransacao:   orgTransactions.dataTransacao,
        categoryId:      orgTransactions.categoryId,
        paymentMethodId: orgTransactions.paymentMethodId,
        paymentMethodNome: orgPaymentMethods.nome,
        paymentMethodTipo: orgPaymentMethods.tipo,
        receivableId:    orgTransactions.receivableId,
        payableId:       orgTransactions.payableId,
        observacoes:     orgTransactions.observacoes,
        createdAt:       orgTransactions.createdAt,
      })
      .from(orgTransactions)
      .leftJoin(orgPaymentMethods, eq(orgPaymentMethods.id, orgTransactions.paymentMethodId))
      .where(eq(orgTransactions.organizationId, user.organizationId))
      .orderBy(desc(orgTransactions.dataTransacao))

    const mapped = rows.map((r) => ({
      id:                    r.id,
      organization_id:       r.organizationId,
      tipo:                  r.tipo,
      descricao:             r.descricao,
      valor:                 Number(r.valor),
      data_transacao:        r.dataTransacao ? String(r.dataTransacao) : null,
      data:                  r.dataTransacao ? String(r.dataTransacao) : null,
      category_id:           r.categoryId,
      payment_method_id:     r.paymentMethodId,
      payment_method_nome:   r.paymentMethodNome ?? null,
      payment_method_tipo:   r.paymentMethodTipo ?? null,
      receivable_id:         r.receivableId,
      payable_id:            r.payableId,
      observacoes:           r.observacoes,
      created_at:            r.createdAt ? r.createdAt.toISOString() : null,
    }))

    return NextResponse.json(mapped)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[GET /api/financial/transactions]', error); console.error('[GET /api/financial/transactions]', error)
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

    return NextResponse.json({
      id:                row.id,
      organization_id:   row.organizationId,
      tipo:              row.tipo,
      descricao:         row.descricao,
      valor:             Number(row.valor),
      data_transacao:    row.dataTransacao ? String(row.dataTransacao) : null,
      data:              row.dataTransacao ? String(row.dataTransacao) : null,
      category_id:       row.categoryId,
      payment_method_id: row.paymentMethodId,
      receivable_id:     row.receivableId,
      payable_id:        row.payableId,
      observacoes:       row.observacoes,
      created_at:        row.createdAt ? row.createdAt.toISOString() : null,
    }, { status: 201 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[POST /api/financial/transactions]', error); console.error('[POST /api/financial/transactions]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
