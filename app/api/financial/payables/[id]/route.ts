import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgPayables, orgTransactions } from '@/lib/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'

const toDateStr = (v: unknown): string | null => {
  if (!v) return null
  if (v instanceof Date) return v.toISOString().split('T')[0]
  return String(v).split('T')[0]
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { id } = await params

    // Fetch current record for merge
    const [c] = await db
      .select()
      .from(orgPayables)
      .where(
        and(
          eq(orgPayables.id, id),
          eq(orgPayables.organizationId, user.organizationId)
        )
      )
      .limit(1)

    if (!c) {
      return NextResponse.json({ error: 'Conta a pagar não encontrada' }, { status: 404 })
    }

    const valor = body.valor
      ? parseFloat(String(body.valor).replace(',', '.'))
      : parseFloat(String(c.valor))

    const isBeingPaid = body.status === 'pago' && c.status !== 'pago'

    const supplierId = body.supplier_id !== undefined
      ? (body.supplier_id && body.supplier_id !== 'sem-fornecedor' ? body.supplier_id : null)
      : c.supplierId

    const categoryId = body.category_id !== undefined
      ? (body.category_id || null)
      : c.categoryId

    const [updated] = await db
      .update(orgPayables)
      .set({
        supplierId,
        categoryId,
        descricao:      body.descricao      ?? c.descricao,
        valor:          String(valor),
        dataVencimento: toDateStr(body.data_vencimento ?? c.dataVencimento) ?? c.dataVencimento,
        dataPagamento:  toDateStr(body.data_pagamento  ?? c.dataPagamento),
        status:         body.status         ?? c.status,
        categoria:      body.categoria      ?? c.categoria,
        formaPagamento: body.forma_pagamento ?? c.formaPagamento,
        observacoes:    body.observacoes    ?? c.observacoes,
        updatedAt:      new Date(),
      })
      .where(
        and(
          eq(orgPayables.id, id),
          eq(orgPayables.organizationId, user.organizationId)
        )
      )
      .returning()

    if (isBeingPaid) {
      const dataPagamento = toDateStr(body.data_pagamento) ?? new Date().toISOString().split('T')[0]

      await db.insert(orgTransactions).values({
        organizationId: user.organizationId,
        tipo:           'saida',
        descricao:      body.descricao ?? c.descricao,
        valor:          String(valor),
        dataTransacao:  dataPagamento,
        payableId:      id,
        categoryId,
        observacoes:    'Pagamento de conta a pagar',
      })
    }

    return NextResponse.json(updated)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[PUT /api/financial/payables/:id]', error); console.error('[PUT /api/financial/payables/:id]', error)
    return NextResponse.json({ error: 'Erro interno', details: (error as Error).message }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    // Remove any linked transactions first (if payable was paid)
    await db
      .delete(orgTransactions)
      .where(eq(orgTransactions.payableId, id))

    const [row] = await db
      .delete(orgPayables)
      .where(
        and(
          eq(orgPayables.id, id),
          eq(orgPayables.organizationId, user.organizationId)
        )
      )
      .returning({ id: orgPayables.id })

    if (!row) {
      return NextResponse.json({ error: 'Conta a pagar não encontrada' }, { status: 404 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[DELETE /api/financial/payables/:id]', error); console.error('[DELETE /api/financial/payables/:id]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
