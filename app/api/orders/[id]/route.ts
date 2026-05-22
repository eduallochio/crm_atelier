import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logServerError } from '@/lib/log-error'
import {
  orgServiceOrders,
  orgServiceOrderItems,
  orgClients,
  usageMetrics,
  orgReceivables,
  orgTransactions,
  orgCashierSessions,
  orgCashierMovements,
  orgSystemPreferences,
  orgServiceOrderMaterials,
  orgStockExits,
  orgStockExitItems,
} from '@/lib/db/schema'
import { eq, and, desc, sql as drizzleSql } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth/session'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const [orderRow] = await db
      .select({
        id:                 orgServiceOrders.id,
        numero:             orgServiceOrders.numero,
        organizationId:     orgServiceOrders.organizationId,
        clientId:           orgServiceOrders.clientId,
        status:             orgServiceOrders.status,
        valorTotal:         orgServiceOrders.valorTotal,
        valorEntrada:       orgServiceOrders.valorEntrada,
        valorPago:          orgServiceOrders.valorPago,
        statusPagamento:    orgServiceOrders.statusPagamento,
        descontoValor:      orgServiceOrders.descontoValor,
        descontoPercentual: orgServiceOrders.descontoPercentual,
        dataAbertura:       orgServiceOrders.dataAbertura,
        dataPrevista:       orgServiceOrders.dataPrevista,
        dataConclusao:      orgServiceOrders.dataConclusao,
        formaPagamento:     orgServiceOrders.formaPagamento,
        observacoes:        orgServiceOrders.observacoes,
        notasInternas:      orgServiceOrders.notasInternas,
        createdAt:          orgServiceOrders.createdAt,
        clienteCId:         orgClients.id,
        clienteNome:        orgClients.nome,
        clienteTelefone:    orgClients.telefone,
        clienteEmail:       orgClients.email,
      })
      .from(orgServiceOrders)
      .leftJoin(orgClients, eq(orgClients.id, orgServiceOrders.clientId))
      .where(and(eq(orgServiceOrders.id, id), eq(orgServiceOrders.organizationId, user.organizationId)))

    if (!orderRow) {
      return NextResponse.json({ error: 'Ordem não encontrada' }, { status: 404 })
    }

    const items = await db
      .select()
      .from(orgServiceOrderItems)
      .where(eq(orgServiceOrderItems.orderId, id))

    const order = {
      id:                  orderRow.id,
      numero:              orderRow.numero,
      organization_id:     orderRow.organizationId,
      client_id:           orderRow.clientId,
      status:              orderRow.status,
      valor_total:         Number(orderRow.valorTotal ?? 0),
      valor_entrada:       Number(orderRow.valorEntrada ?? 0),
      valor_pago:          Number(orderRow.valorPago ?? 0),
      status_pagamento:    orderRow.statusPagamento,
      desconto_valor:      Number(orderRow.descontoValor ?? 0),
      desconto_percentual: Number(orderRow.descontoPercentual ?? 0),
      data_abertura:       orderRow.dataAbertura,
      data_prevista:       orderRow.dataPrevista,
      data_conclusao:      orderRow.dataConclusao,
      forma_pagamento:     orderRow.formaPagamento,
      observacoes:         orderRow.observacoes,
      notas_internas:      orderRow.notasInternas,
      fotos:               null,
      created_at:          orderRow.createdAt,
      client: orderRow.clienteCId
        ? { id: orderRow.clienteCId, nome: orderRow.clienteNome, telefone: orderRow.clienteTelefone, email: orderRow.clienteEmail }
        : null,
      items: items.map(i => ({
        id:             i.id,
        order_id:       i.orderId,
        service_id:     i.serviceId,
        service_nome:   i.serviceNome,
        quantidade:     Number(i.quantidade ?? 1),
        valor_unitario: Number(i.valorUnitario ?? 0),
        valor_total:    Number(i.valorTotal ?? 0),
        created_at:     i.createdAt,
      })),
    }

    return NextResponse.json(order)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[GET /api/orders/:id]', error); console.error('[GET /api/orders/:id]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { id } = await params

    const result = await db.transaction(async (tx) => {
      // Fetch current order
      const [order] = await tx
        .select({
          id:            orgServiceOrders.id,
          numero:        orgServiceOrders.numero,
          status:        orgServiceOrders.status,
          valorTotal:    orgServiceOrders.valorTotal,
          valorPago:     orgServiceOrders.valorPago,
          clientId:      orgServiceOrders.clientId,
          dataPrevista:  orgServiceOrders.dataPrevista,
          observacoes:   orgServiceOrders.observacoes,
          notasInternas: orgServiceOrders.notasInternas,
          formaPagamento: orgServiceOrders.formaPagamento,
          dataConclusao: orgServiceOrders.dataConclusao,
          clienteNome:   orgClients.nome,
        })
        .from(orgServiceOrders)
        .leftJoin(orgClients, eq(orgClients.id, orgServiceOrders.clientId))
        .where(and(eq(orgServiceOrders.id, id), eq(orgServiceOrders.organizationId, user.organizationId)))

      if (!order) {
        return { notFound: true }
      }

      const finalStatus = body.status ?? order.status
      const isBeingConcluded = body.status === 'concluido' && order.status !== 'concluido'
      const isBeingReopened = order.status === 'concluido' && body.status && body.status !== 'concluido'

      const toDateStr = (v: unknown): string | null => {
        if (!v) return null
        if (v instanceof Date) return v.toISOString().split('T')[0]
        return String(v).split('T')[0]
      }

      const finalDataPrevista = 'data_prevista' in body
        ? (body.data_prevista || null)
        : toDateStr(order.dataPrevista)
      const finalObservacoes = 'observacoes' in body ? (body.observacoes ?? null) : order.observacoes
      const finalNotasInternas = 'notas_internas' in body ? (body.notas_internas ?? null) : order.notasInternas
      const finalFormaPagamento = 'forma_pagamento' in body ? (body.forma_pagamento ?? null) : (order.formaPagamento ?? null)

      const dataConclusaoValue = isBeingConcluded
        ? new Date()
        : isBeingReopened
          ? null
          : order.dataConclusao

      // Update order
      const [updatedOrder] = await tx
        .update(orgServiceOrders)
        .set({
          status:         finalStatus,
          dataPrevista:   finalDataPrevista,
          observacoes:    finalObservacoes,
          notasInternas:  finalNotasInternas,
          formaPagamento: finalFormaPagamento,
          dataConclusao:  dataConclusaoValue,
        })
        .where(and(eq(orgServiceOrders.id, id), eq(orgServiceOrders.organizationId, user.organizationId)))
        .returning()

      let noCashierSession = false

      // Payment flow on conclusion
      if (finalStatus === 'concluido') {
        const paymentAction = body.payment_action as 'paid' | 'receivable' | undefined
        const saldoRestante = (Number(order.valorTotal) || 0) - (Number(order.valorPago) || 0)

        if (saldoRestante > 0) {
          if (paymentAction === 'paid') {
            // Mark OS as paid, save forma_pagamento if provided
            await tx
              .update(orgServiceOrders)
              .set({
                statusPagamento: 'pago',
                valorPago: String(order.valorTotal),
                ...(finalFormaPagamento ? { formaPagamento: finalFormaPagamento } : {}),
              })
              .where(and(eq(orgServiceOrders.id, id), eq(orgServiceOrders.organizationId, user.organizationId)))

            const descricaoOS = `OS #${order.numero} - ${order.clienteNome || 'Cliente'}`
            const hoje = new Date().toISOString().split('T')[0]

            // Insert financial transaction
            await tx.insert(orgTransactions).values({
              organizationId: user.organizationId,
              tipo:           'entrada',
              descricao:      descricaoOS,
              valor:          String(saldoRestante),
              dataTransacao:  hoje,
              observacoes:    'Pagamento recebido na conclusão da OS',
            })

            // Insert cashier movement if there's an open session
            const [openSession] = await tx
              .select({ id: orgCashierSessions.id })
              .from(orgCashierSessions)
              .where(and(
                eq(orgCashierSessions.organizationId, user.organizationId),
                eq(orgCashierSessions.status, 'aberto')
              ))
              .orderBy(desc(orgCashierSessions.createdAt))
              .limit(1)

            if (openSession) {
              await tx.insert(orgCashierMovements).values({
                organizationId: user.organizationId,
                sessaoId:       openSession.id,
                tipo:           'entrada',
                descricao:      descricaoOS,
                valor:          String(saldoRestante),
                referenciaId:   id,
                referenciaTipo: 'ordem_servico',
              })
            } else {
              noCashierSession = true
            }
          } else {
            // payment_action === 'receivable' or legacy fallback — create receivable if not exists
            const [existing] = await tx
              .select({ id: orgReceivables.id })
              .from(orgReceivables)
              .where(eq(orgReceivables.serviceOrderId, id))

            if (!existing) {
              const dataVencimento = new Date()
              dataVencimento.setDate(dataVencimento.getDate() + 7)
              const dataVencStr = dataVencimento.toISOString().split('T')[0]

              await tx.insert(orgReceivables).values({
                organizationId: user.organizationId,
                serviceOrderId: id,
                clientId:       order.clientId || null,
                descricao:      `OS #${order.numero} - ${order.clienteNome || 'Cliente'}`,
                valor:          String(saldoRestante),
                dataVencimento: dataVencStr,
                status:         'pendente',
                observacoes:    'Gerado automaticamente na conclusão da ordem de serviço',
              })
            }
          }
        }
      }

      // Stock exit on conclusion if inventory control is active
      if (isBeingConcluded) {
        const [pref] = await tx
          .select({ controlaEstoque: orgSystemPreferences.controlaEstoque })
          .from(orgSystemPreferences)
          .where(eq(orgSystemPreferences.organizationId, user.organizationId))

        if (pref?.controlaEstoque) {
          const materials = await tx
            .select()
            .from(orgServiceOrderMaterials)
            .where(eq(orgServiceOrderMaterials.orderId, id))

          const materiaisComProduto = materials.filter(m => m.productId)
          if (materiaisComProduto.length > 0) {
            const [stockExit] = await tx
              .insert(orgStockExits)
              .values({
                organizationId: user.organizationId,
                serviceOrderId: id,
                tipo:           'ordem_servico',
                observacoes:    `Baixa automática — OS #${order.numero}`,
              })
              .returning()

            await tx.insert(orgStockExitItems).values(
              materiaisComProduto.map(m => ({
                exitId:      stockExit.id,
                productId:   m.productId!,
                produtoNome: m.nome,
                quantidade:  String(m.quantidade),
                unidade:     m.unidade ?? 'un',
              }))
            )
          }
        }
      }

      return { updatedOrder, noCashierSession }
    })

    if ('notFound' in result) {
      return NextResponse.json({ error: 'Ordem não encontrada' }, { status: 404 })
    }

    return NextResponse.json({ ...result.updatedOrder, no_cashier_session: result.noCashierSession })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[PUT /api/orders/:id]', error); console.error('[PUT /api/orders/:id]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const [deleted] = await db
      .delete(orgServiceOrders)
      .where(and(eq(orgServiceOrders.id, id), eq(orgServiceOrders.organizationId, user.organizationId)))
      .returning({ id: orgServiceOrders.id })

    if (!deleted) {
      return NextResponse.json({ error: 'Ordem não encontrada' }, { status: 404 })
    }

    // Update metrics — decrement orders_count (not cumulative)
    await db
      .update(usageMetrics)
      .set({
        ordersCount: drizzleSql`greatest(${usageMetrics.ordersCount} - 1, 0)`,
        updatedAt:   new Date(),
      })
      .where(eq(usageMetrics.organizationId, user.organizationId))

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[DELETE /api/orders/:id]', error); console.error('[DELETE /api/orders/:id]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
