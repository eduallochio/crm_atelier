import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgReceivables, orgTransactions, orgServiceOrders } from '@/lib/db/schema'
import { eq, and, sql as drizzleSql } from 'drizzle-orm'

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
      .from(orgReceivables)
      .where(
        and(
          eq(orgReceivables.id, id),
          eq(orgReceivables.organizationId, user.organizationId)
        )
      )
      .limit(1)

    if (!c) {
      return NextResponse.json({ error: 'Conta a receber não encontrada' }, { status: 404 })
    }

    const valor = body.valor
      ? parseFloat(String(body.valor).replace(',', '.'))
      : parseFloat(String(c.valor))

    const isBeingReceived = body.status === 'recebido' && c.status !== 'recebido'

    const [updated] = await db
      .update(orgReceivables)
      .set({
        serviceOrderId:  body.service_order_id  ?? c.serviceOrderId,
        clientId:        body.client_id         ?? c.clientId,
        categoryId:      body.category_id       ?? c.categoryId,
        paymentMethodId: body.payment_method_id ?? c.paymentMethodId,
        descricao:       body.descricao         ?? c.descricao,
        valor:           String(valor),
        dataVencimento:  toDateStr(body.data_vencimento  ?? c.dataVencimento)  ?? c.dataVencimento,
        dataRecebimento: toDateStr(body.data_recebimento ?? c.dataRecebimento),
        status:          body.status            ?? c.status,
        observacoes:     body.observacoes       ?? c.observacoes,
        updatedAt:       new Date(),
      })
      .where(
        and(
          eq(orgReceivables.id, id),
          eq(orgReceivables.organizationId, user.organizationId)
        )
      )
      .returning()

    if (isBeingReceived) {
      const today = new Date().toISOString().split('T')[0]
      const dataRecebimento = toDateStr(body.data_recebimento) ?? today

      await db.insert(orgTransactions).values({
        organizationId:  user.organizationId,
        tipo:            'entrada',
        descricao:       body.descricao         ?? c.descricao,
        valor:           String(valor),
        dataTransacao:   dataRecebimento,
        receivableId:    id,
        paymentMethodId: body.payment_method_id ?? c.paymentMethodId,
        categoryId:      body.category_id       ?? c.categoryId,
        observacoes:     'Recebimento de conta a receber',
      })

      if (c.serviceOrderId) {
        await db
          .update(orgServiceOrders)
          .set({
            valorPago: drizzleSql`COALESCE(${orgServiceOrders.valorPago}, 0) + ${String(valor)}`,
            statusPagamento: drizzleSql`
              CASE
                WHEN COALESCE(${orgServiceOrders.valorPago}, 0) + ${String(valor)} >= ${orgServiceOrders.valorTotal} THEN 'pago'
                WHEN COALESCE(${orgServiceOrders.valorPago}, 0) + ${String(valor)} > 0 THEN 'parcial'
                ELSE 'pendente'
              END
            `,
          })
          .where(eq(orgServiceOrders.id, c.serviceOrderId))
      }
    }

    return NextResponse.json(updated)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[PUT /api/financial/receivables/:id]', error)
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

    const [rec] = await db
      .select({
        id:            orgReceivables.id,
        serviceOrderId: orgReceivables.serviceOrderId,
        valor:         orgReceivables.valor,
        status:        orgReceivables.status,
      })
      .from(orgReceivables)
      .where(
        and(
          eq(orgReceivables.id, id),
          eq(orgReceivables.organizationId, user.organizationId)
        )
      )
      .limit(1)

    if (!rec) {
      return NextResponse.json({ error: 'Conta a receber não encontrada' }, { status: 404 })
    }

    await db
      .delete(orgReceivables)
      .where(
        and(
          eq(orgReceivables.id, id),
          eq(orgReceivables.organizationId, user.organizationId)
        )
      )

    // If receivable was received and linked to a service order, restore valor_pago
    if (rec.serviceOrderId && rec.status === 'recebido') {
      const valor = parseFloat(String(rec.valor))
      await db
        .update(orgServiceOrders)
        .set({
          valorPago: drizzleSql`GREATEST(COALESCE(${orgServiceOrders.valorPago}, 0) - ${String(valor)}, 0)`,
          statusPagamento: drizzleSql`
            CASE
              WHEN GREATEST(COALESCE(${orgServiceOrders.valorPago}, 0) - ${String(valor)}, 0) <= 0 THEN 'pendente'
              WHEN GREATEST(COALESCE(${orgServiceOrders.valorPago}, 0) - ${String(valor)}, 0) < ${orgServiceOrders.valorTotal} THEN 'parcial'
              ELSE 'pago'
            END
          `,
        })
        .where(eq(orgServiceOrders.id, rec.serviceOrderId))
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[DELETE /api/financial/receivables/:id]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
