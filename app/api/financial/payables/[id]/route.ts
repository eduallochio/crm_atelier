import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgPayables, orgTransactions, orgDeletionLog } from '@/lib/db/schema'
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

    return NextResponse.json({
      id:              updated.id,
      organization_id: updated.organizationId,
      supplier_id:     updated.supplierId,
      category_id:     updated.categoryId,
      descricao:       updated.descricao,
      valor:           updated.valor,
      data_vencimento: updated.dataVencimento,
      data_pagamento:  updated.dataPagamento,
      categoria:       updated.categoria,
      forma_pagamento: updated.formaPagamento,
      observacoes:     updated.observacoes,
      status:          updated.status,
      created_at:      updated.createdAt,
      updated_at:      updated.updatedAt,
    })
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
  let organizationId: string | undefined
  try {
    const user = await requireAuth()
    organizationId = user.organizationId
    const { id } = await params

    // SELECT de verificação + log + exclusão na mesma transação — evita tanto
    // a corrida de duas exclusões concorrentes quanto gravar um log para uma
    // exclusão que falhou depois
    const row = await db.transaction(async (tx) => {
      const [payable] = await tx
        .select()
        .from(orgPayables)
        .where(and(eq(orgPayables.id, id), eq(orgPayables.organizationId, user.organizationId)))

      if (!payable) return null

      await tx.insert(orgDeletionLog).values({
        organizationId: user.organizationId,
        userId:         user.id,
        userEmail:      user.email,
        resourceType:   'payable',
        resourceId:     payable.id,
        snapshot: {
          descricao:      payable.descricao,
          valor:          payable.valor,
          status:         payable.status,
          dataVencimento: payable.dataVencimento,
        },
      })

      // Remove any linked transactions first (if payable was paid)
      await tx
        .delete(orgTransactions)
        .where(eq(orgTransactions.payableId, id))

      const [deleted] = await tx
        .delete(orgPayables)
        .where(
          and(
            eq(orgPayables.id, id),
            eq(orgPayables.organizationId, user.organizationId)
          )
        )
        .returning({ id: orgPayables.id })

      return deleted
    })

    if (!row) {
      return NextResponse.json({ error: 'Conta a pagar não encontrada' }, { status: 404 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[DELETE /api/financial/payables/:id]', error, undefined, organizationId); console.error('[DELETE /api/financial/payables/:id]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
