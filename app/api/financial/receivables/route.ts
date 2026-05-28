import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgReceivables, orgPaymentMethods } from '@/lib/db/schema'
import { eq, desc, sql as drizzleSql } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'

export async function GET() {
  try {
    const user = await requireAuth()

    const rows = await db
      .select({
        id:              orgReceivables.id,
        organizationId:  orgReceivables.organizationId,
        serviceOrderId:  orgReceivables.serviceOrderId,
        clientId:        orgReceivables.clientId,
        categoryId:      orgReceivables.categoryId,
        paymentMethodId: orgReceivables.paymentMethodId,
        descricao:       orgReceivables.descricao,
        valor:           orgReceivables.valor,
        dataVencimento:  orgReceivables.dataVencimento,
        dataRecebimento: orgReceivables.dataRecebimento,
        observacoes:     orgReceivables.observacoes,
        createdAt:       orgReceivables.createdAt,
        updatedAt:       orgReceivables.updatedAt,
        formaPagamento:  orgPaymentMethods.nome,
        status: drizzleSql<string>`
          CASE
            WHEN ${orgReceivables.status} = 'pendente'
              AND ${orgReceivables.dataVencimento} < CURRENT_DATE
            THEN 'atrasado'
            ELSE ${orgReceivables.status}
          END
        `,
      })
      .from(orgReceivables)
      .leftJoin(orgPaymentMethods, eq(orgPaymentMethods.id, orgReceivables.paymentMethodId))
      .where(eq(orgReceivables.organizationId, user.organizationId))
      .orderBy(desc(orgReceivables.dataVencimento))

    return NextResponse.json(rows.map(r => ({
      id:               r.id,
      organization_id:  r.organizationId,
      service_order_id: r.serviceOrderId,
      client_id:        r.clientId,
      category_id:      r.categoryId,
      payment_method_id: r.paymentMethodId,
      descricao:        r.descricao,
      valor:            r.valor,
      data_vencimento:  r.dataVencimento,
      data_recebimento: r.dataRecebimento,
      observacoes:      r.observacoes,
      status:           r.status,
      forma_pagamento:  r.formaPagamento,
      created_at:       r.createdAt,
      updated_at:       r.updatedAt,
    })))
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[GET /api/financial/receivables]', error); console.error('[GET /api/financial/receivables]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const valor = parseFloat(String(body.valor || 0).replace(',', '.'))

    const [row] = await db
      .insert(orgReceivables)
      .values({
        organizationId:  user.organizationId,
        serviceOrderId:  body.service_order_id || null,
        clientId:        body.client_id || null,
        categoryId:      body.category_id || null,
        paymentMethodId: body.payment_method_id || null,
        descricao:       body.descricao,
        valor:           String(valor),
        dataVencimento:  body.data_vencimento,
        dataRecebimento: body.data_recebimento || null,
        status:          body.status || 'pendente',
        observacoes:     body.observacoes || null,
      })
      .returning()

    return NextResponse.json(row, { status: 201 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[POST /api/financial/receivables]', error); console.error('[POST /api/financial/receivables]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
