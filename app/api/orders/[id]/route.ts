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
  orgCashiers,
  orgSystemPreferences,
  orgServiceOrderEmbalagens,
  orgServices,
  orgStockExits,
  orgStockExitItems,
  orgProducts,
  orgPaymentMethods,
  orgDeletionLog,
} from '@/lib/db/schema'
import { eq, and, desc, inArray, count, sql as drizzleSql } from 'drizzle-orm'
import { requireAuth, assertPermission } from '@/lib/auth/session'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    assertPermission(user, 'ordens_servico')
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
      .leftJoin(orgClients, and(eq(orgClients.id, orgServiceOrders.clientId), eq(orgClients.organizationId, user.organizationId)))
      .where(and(eq(orgServiceOrders.id, id), eq(orgServiceOrders.organizationId, user.organizationId)))

    if (!orderRow) {
      return NextResponse.json({ error: 'Ordem não encontrada' }, { status: 404 })
    }

    const items = await db
      .select()
      .from(orgServiceOrderItems)
      .where(eq(orgServiceOrderItems.orderId, id))

    const embalagens = await db
      .select()
      .from(orgServiceOrderEmbalagens)
      .where(eq(orgServiceOrderEmbalagens.orderId, id))

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
        observacoes:    i.observacoes ?? null,
        created_at:     i.createdAt,
      })),
      embalagens: embalagens.map(e => ({
        id:             e.id,
        order_id:       e.orderId,
        product_id:     e.productId,
        nome:           e.nome,
        quantidade:     Number(e.quantidade ?? 1),
        unidade:        e.unidade,
        preco_unitario: e.precoUnitario != null ? Number(e.precoUnitario) : null,
        created_at:     e.createdAt,
      })),
    }

    return NextResponse.json(order)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    if ((error as Error).message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    logServerError('[GET /api/orders/:id]', error); console.error('[GET /api/orders/:id]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let organizationId: string | undefined
  try {
    const user = await requireAuth()
    assertPermission(user, 'ordens_servico')
    organizationId = user.organizationId
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
        .leftJoin(orgClients, and(eq(orgClients.id, orgServiceOrders.clientId), eq(orgClients.organizationId, user.organizationId)))
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
          status:            finalStatus,
          dataPrevista:      finalDataPrevista,
          observacoes:       finalObservacoes,
          notasInternas:     finalNotasInternas,
          formaPagamento:    finalFormaPagamento,
          dataConclusao:     dataConclusaoValue,
          ...(isBeingConcluded ? { concludedByUserId: user.id } : {}),
          ...(isBeingReopened ? { concludedByUserId: null } : {}),
        })
        .where(and(eq(orgServiceOrders.id, id), eq(orgServiceOrders.organizationId, user.organizationId)))
        .returning()

      let noCashierSession = false

      // Payment flow on conclusion
      if (finalStatus === 'concluido') {
        const paymentAction = body.payment_action as 'paid' | 'receivable' | 'undecided' | undefined
        const saldoRestante = (Number(order.valorTotal) || 0) - (Number(order.valorPago) || 0)

        // 'undecided': conclui sem lançar no caixa nem criar conta a receber — o
        // saldo fica em aberto na própria OS, decidível depois pelo badge "pendente"
        if (saldoRestante > 0 && paymentAction !== 'undecided') {
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
            // Usa data informada pelo usuário; fallback para hoje se não enviada
            const dataTransacao = body.payment_date || new Date().toISOString().split('T')[0]

            // Busca o payment_method_id pelo tipo (code) da forma de pagamento
            let paymentMethodId: string | null = null
            if (finalFormaPagamento) {
              const [pm] = await tx
                .select({ id: orgPaymentMethods.id })
                .from(orgPaymentMethods)
                .where(and(
                  eq(orgPaymentMethods.organizationId, user.organizationId),
                  eq(orgPaymentMethods.tipo, finalFormaPagamento)
                ))
                .limit(1)
              paymentMethodId = pm?.id ?? null
            }

            // Se a OS já tinha virado conta a receber (concluída sem pagamento), dá baixa nela agora:
            // sem isso a conta continuava em aberto e, ao ser recebida depois, o valor entrava duas vezes
            const openReceivables = await tx
              .update(orgReceivables)
              .set({ status: 'recebido', dataRecebimento: dataTransacao, ...(paymentMethodId ? { paymentMethodId } : {}), updatedAt: new Date() })
              .where(and(
                eq(orgReceivables.serviceOrderId, id),
                eq(orgReceivables.organizationId, user.organizationId),
                eq(orgReceivables.status, 'pendente'),
              ))
              .returning({ id: orgReceivables.id })

            // Insert financial transaction
            await tx.insert(orgTransactions).values({
              organizationId:  user.organizationId,
              tipo:            'entrada',
              descricao:       descricaoOS,
              valor:           String(saldoRestante),
              dataTransacao,
              paymentMethodId,
              receivableId:    openReceivables[0]?.id ?? null,
              serviceOrderId:  id,
              observacoes:     'Pagamento recebido na conclusão da OS',
            })

            // Lança no caixa marcado como padrão; se não houver sessão aberta
            // nele, cai para a sessão aberta mais recente da organização —
            // evita cair no caixa errado quando há mais de um aberto ao mesmo tempo
            const [openSession] = await tx
              .select({ id: orgCashierSessions.id })
              .from(orgCashierSessions)
              .leftJoin(orgCashiers, eq(orgCashiers.id, orgCashierSessions.caixaId))
              .where(and(
                eq(orgCashierSessions.organizationId, user.organizationId),
                eq(orgCashierSessions.status, 'aberto')
              ))
              .orderBy(desc(orgCashiers.isDefault), desc(orgCashierSessions.createdAt))
              .limit(1)

            if (openSession) {
              await tx.insert(orgCashierMovements).values({
                organizationId:    user.organizationId,
                sessaoId:          openSession.id,
                tipo:              'entrada',
                descricao:         descricaoOS,
                valor:             String(saldoRestante),
                referenciaId:      id,
                referenciaTipo:    'ordem_servico',
                metodoPagamentoId: paymentMethodId,
                usuarioId:         user.id,
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

      // Stock exit on conclusion if inventory control (materials) or
      // embalagem is active — são dois toggles independentes em
      // Configurações, cada um gerando sua própria saída de estoque
      if (isBeingConcluded) {
        const [pref] = await tx
          .select({ controlaEstoque: orgSystemPreferences.controlaEstoque, usaEmbalagem: orgSystemPreferences.usaEmbalagem })
          .from(orgSystemPreferences)
          .where(eq(orgSystemPreferences.organizationId, user.organizationId))

        if (pref?.controlaEstoque) {
          // Materiais não são mais digitados na OS — vêm da "receita" já
          // cadastrada em cada serviço (orgServices.materiaisJson),
          // multiplicada pela quantidade vendida de cada item. Itens cujo
          // serviço foi excluído (serviceId null) são ignorados em silêncio,
          // pois não há como recuperar quais materiais usar
          const items = await tx
            .select({ serviceId: orgServiceOrderItems.serviceId, quantidade: orgServiceOrderItems.quantidade })
            .from(orgServiceOrderItems)
            .where(eq(orgServiceOrderItems.orderId, id))

          const serviceIds = [...new Set(items.map(i => i.serviceId).filter((v): v is string => !!v))]

          if (serviceIds.length > 0) {
            const services = await tx
              .select({ id: orgServices.id, materiaisJson: orgServices.materiaisJson })
              .from(orgServices)
              .where(and(inArray(orgServices.id, serviceIds), eq(orgServices.organizationId, user.organizationId)))

            const materiaisPorServico = new Map(services.map(s => [s.id, (Array.isArray(s.materiaisJson) ? s.materiaisJson : []) as Array<{
              product_id?: string | null
              produto_nome: string
              quantidade: number
              unidade: string
            }>]))

            // Agrega por produto (ou por nome, se não tiver product_id) — mesma regra já usada na auto-população do formulário
            const agregados = new Map<string, { productId: string | null; nome: string; quantidade: number; unidade: string }>()
            for (const item of items) {
              if (!item.serviceId) continue
              const materiais = materiaisPorServico.get(item.serviceId) ?? []
              for (const m of materiais) {
                const key = m.product_id || `nome:${m.produto_nome}`
                const existing = agregados.get(key)
                const quantidade = Number(m.quantidade) * item.quantidade
                if (existing) {
                  existing.quantidade += quantidade
                } else {
                  agregados.set(key, { productId: m.product_id || null, nome: m.produto_nome, quantidade, unidade: m.unidade || 'un' })
                }
              }
            }

            const materiaisComProduto = [...agregados.values()].filter(m => m.productId)
            if (materiaisComProduto.length > 0) {
              // Filtra apenas produtos com estoque suficiente — produtos do tipo
              // "custo fixo" (quantidade_atual = 0, nunca tiveram entrada) são
              // ignorados silenciosamente, igual a serviços excluídos
              const prodIds = materiaisComProduto.map(m => m.productId!)
              const estoqueAtual = await tx
                .select({ id: orgProducts.id, quantidadeAtual: orgProducts.quantidadeAtual })
                .from(orgProducts)
                .where(inArray(orgProducts.id, prodIds))
              const estoqueMap = new Map(estoqueAtual.map(p => [p.id, Number(p.quantidadeAtual)]))
              const materiaisBaixar = materiaisComProduto.filter(m => {
                const atual = estoqueMap.get(m.productId!) ?? 0
                return atual >= m.quantidade
              })

              if (materiaisBaixar.length > 0) {
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
                  materiaisBaixar.map(m => ({
                    exitId:      stockExit.id,
                    productId:   m.productId!,
                    produtoNome: m.nome,
                    quantidade:  String(m.quantidade),
                    unidade:     m.unidade,
                  }))
                )
              }
            }
          }
        }

        if (pref?.usaEmbalagem) {
          const embalagens = await tx
            .select()
            .from(orgServiceOrderEmbalagens)
            .where(eq(orgServiceOrderEmbalagens.orderId, id))

          const embalagensComProduto = embalagens.filter(e => e.productId)
          if (embalagensComProduto.length > 0) {
            const [stockExit] = await tx
              .insert(orgStockExits)
              .values({
                organizationId: user.organizationId,
                serviceOrderId: id,
                tipo:           'ordem_servico',
                observacoes:    `Baixa automática (embalagem) — OS #${order.numero}`,
              })
              .returning()

            // Mesmo trigger handle_stock_exit_item já valida/atualiza o
            // saldo do produto — ver comentário acima sobre materiais
            await tx.insert(orgStockExitItems).values(
              embalagensComProduto.map(e => ({
                exitId:      stockExit.id,
                productId:   e.productId!,
                produtoNome: e.nome,
                quantidade:  String(e.quantidade),
                unidade:     e.unidade ?? 'un',
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
    const msg = (error as Error).message
    if (msg === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    // Trigger do banco (handle_stock_exit_item) bloqueia a baixa automática
    // de material se faltar estoque — a OS não é concluída nesse caso
    if (msg.includes('Estoque insuficiente')) {
      return NextResponse.json(
        { error: 'Não foi possível concluir: falta estoque de um ou mais materiais da OS.' },
        { status: 422 }
      )
    }
    logServerError('[PUT /api/orders/:id]', error, undefined, organizationId); console.error('[PUT /api/orders/:id]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let organizationId: string | undefined
  try {
    const user = await requireAuth()
    assertPermission(user, 'ordens_servico')
    organizationId = user.organizationId
    const { id } = await params

    // Buscar a OS antes de deletar para validar estado e fazer snapshot no log
    const [os] = await db
      .select({
        id:            orgServiceOrders.id,
        numero:        orgServiceOrders.numero,
        status:        orgServiceOrders.status,
        valorTotal:    orgServiceOrders.valorTotal,
        valorPago:     orgServiceOrders.valorPago,
        clientId:      orgServiceOrders.clientId,
        dataAbertura:  orgServiceOrders.dataAbertura,
      })
      .from(orgServiceOrders)
      .where(and(eq(orgServiceOrders.id, id), eq(orgServiceOrders.organizationId, user.organizationId)))
      .limit(1)

    if (!os) {
      return NextResponse.json({ error: 'Ordem não encontrada' }, { status: 404 })
    }

    // Bloquear deleção de OS concluída ou com pagamento registrado
    if (os.status === 'concluido' || Number(os.valorPago) > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir uma OS concluída ou com pagamento registrado. Cancele a OS em vez de excluir.' },
        { status: 409 }
      )
    }

    // Bloquear deleção de OS com recebível pendente
    const [recCount] = await db
      .select({ n: count() })
      .from(orgReceivables)
      .where(and(eq(orgReceivables.serviceOrderId, id), eq(orgReceivables.status, 'pendente')))

    if (Number(recCount?.n ?? 0) > 0) {
      return NextResponse.json(
        { error: 'Esta OS possui cobrança pendente. Quite ou cancele o recebível antes de excluir a OS.' },
        { status: 409 }
      )
    }

    // DELETE ... RETURNING é atômico — evita gravar log pra uma exclusão
    // concorrente que já aconteceu. A OS some com cascade (itens, materiais,
    // histórico), então sem esse log não sobra rastro de quem excluiu o quê
    const [deleted] = await db
      .delete(orgServiceOrders)
      .where(and(eq(orgServiceOrders.id, id), eq(orgServiceOrders.organizationId, user.organizationId)))
      .returning()

    if (!deleted) {
      return NextResponse.json({ error: 'Ordem não encontrada' }, { status: 404 })
    }

    await db.insert(orgDeletionLog).values({
      organizationId: user.organizationId,
      userId:         user.id,
      userEmail:      user.email,
      resourceType:   'service_order',
      resourceId:     deleted.id,
      snapshot: {
        numero:       deleted.numero,
        status:       deleted.status,
        valorTotal:   deleted.valorTotal,
        valorPago:    deleted.valorPago,
        clientId:     deleted.clientId,
        dataAbertura: deleted.dataAbertura,
      },
    })

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
    if ((error as Error).message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    logServerError('[DELETE /api/orders/:id]', error, undefined, organizationId); console.error('[DELETE /api/orders/:id]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
