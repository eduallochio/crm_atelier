import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { orgServiceOrders, orgServiceOrderItems, orgServices } from '@/lib/db/schema'
import { eq, and, asc, inArray } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth/session'
import { logServerError } from '@/lib/log-error'
import { calcularDesconto } from '@/lib/order-discount'

/** GET /api/orders/[id]/items → lista os itens da OS */
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const [order] = await db
      .select({ id: orgServiceOrders.id })
      .from(orgServiceOrders)
      .where(and(eq(orgServiceOrders.id, id), eq(orgServiceOrders.organizationId, user.organizationId)))

    if (!order) {
      return NextResponse.json({ error: 'Ordem não encontrada' }, { status: 404 })
    }

    const items = await db
      .select()
      .from(orgServiceOrderItems)
      .where(eq(orgServiceOrderItems.orderId, id))
      .orderBy(asc(orgServiceOrderItems.createdAt))

    return NextResponse.json(items.map(i => ({
      id:             i.id,
      order_id:       i.orderId,
      service_id:     i.serviceId,
      service_nome:   i.serviceNome,
      quantidade:     Number(i.quantidade ?? 1),
      valor_unitario: Number(i.valorUnitario ?? 0),
      valor_total:    Number(i.valorTotal ?? 0),
      observacoes:    i.observacoes,
    })))
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED')
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    logServerError('[GET /api/orders/[id]/items]', error); console.error('[GET /api/orders/[id]/items]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

/**
 * PUT /api/orders/[id]/items → substitui todos os itens da OS (delete-all +
 * re-insert, mesmo padrão já usado em [id]/materials) e recalcula valor_total
 * a partir dos itens enviados + desconto — mesma fórmula do POST /api/orders.
 *
 * Bloqueia a edição se o novo valor_total ficar menor que o valor_pago já
 * registrado: o dinheiro já lançado no caixa/financeiro não é mexido aqui,
 * então reduzir o total abaixo do que já foi pago deixaria a OS com "troco"
 * sem nenhum fluxo definido para isso — o usuário precisa resolver isso
 * separadamente (estorno/desconto) antes de reduzir o valor.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const body = await request.json()

    const items: Array<{
      service_id?: string | null
      service_nome: string
      quantidade: number
      valor_unitario: number
      valor_total: number
      observacoes?: string | null
    }> = body.items ?? []

    if (!items.length) {
      return NextResponse.json({ error: 'Ao menos um item é obrigatório' }, { status: 400 })
    }

    // Rejeita quantidade/valor_unitario inválidos em vez de coagir
    // silenciosamente para 1 — mesmo padrão de app/api/inventory/entries e
    // exits para a mesma classe de input invalido. A UI (order-items-dialog)
    // já impede isso no client, mas uma chamada direta à API não deveria
    // conseguir contornar a validação.
    for (const item of items) {
      if (!Number.isFinite(Number(item.quantidade)) || Number(item.quantidade) <= 0) {
        return NextResponse.json({ error: 'Quantidade deve ser maior que zero' }, { status: 400 })
      }
      if (!Number.isFinite(Number(item.valor_unitario)) || Number(item.valor_unitario) < 0) {
        return NextResponse.json({ error: 'Valor unitário inválido' }, { status: 400 })
      }
    }

    // Valida que todo service_id referenciado pertence a esta org — sem
    // esse filtro, um service_id de outra organização passaria e o item
    // ficaria associado a um serviço fora do tenant. Também busca o nome
    // oficial do catálogo para usar no lugar do service_nome do body: o
    // valor_unitario pode ser legitimamente customizado por item (mesmo
    // comportamento do POST /api/orders), mas o nome exibido não deveria
    // divergir do serviço real vinculado.
    const serviceIds = [...new Set(items.map(i => i.service_id).filter((v): v is string => !!v))]
    const serviceNameById = new Map<string, string>()
    if (serviceIds.length) {
      const owned = await db
        .select({ id: orgServices.id, nome: orgServices.nome })
        .from(orgServices)
        .where(and(inArray(orgServices.id, serviceIds), eq(orgServices.organizationId, user.organizationId)))
      if (owned.length !== serviceIds.length) {
        return NextResponse.json({ error: 'Um ou mais serviços não encontrados' }, { status: 400 })
      }
      for (const s of owned) serviceNameById.set(s.id, s.nome)
    }

    // valor_total de cada item é sempre recalculado aqui (quantidade × valor
    // unitário) — nunca confia no valor_total que o cliente mandou, senão um
    // caller poderia subfaturar a OS mandando um valor_total divergente.
    // quantidade/valor_unitario já foram validados como positivos acima.
    const itemTotals = items.map(item => Number(item.quantidade) * Number(item.valor_unitario))
    const subtotal = itemTotals.reduce((sum, v) => sum + v, 0)

    const { descontoPercentual, descontoValor, valorTotal: novoValorTotal } =
      calcularDesconto(subtotal, body.desconto_percentual, body.desconto_valor)

    const result = await db.transaction(async (tx) => {
      // valorPago/status são lidos aqui dentro da transaction, não antes —
      // lê-los fora deixaria uma janela entre a leitura e o commit em que um
      // pagamento concorrente ou conclusão da OS poderia mudar esse estado
      // sem que esta transação percebesse, gravando um statusPagamento ou
      // bloqueio de edição baseado em dados já obsoletos
      const [order] = await tx
        .select({ id: orgServiceOrders.id, valorPago: orgServiceOrders.valorPago, status: orgServiceOrders.status })
        .from(orgServiceOrders)
        .where(and(eq(orgServiceOrders.id, id), eq(orgServiceOrders.organizationId, user.organizationId)))

      if (!order) {
        throw new Error('ORDER_NOT_FOUND')
      }

      // Itens só são editáveis enquanto a OS está pendente/em andamento — uma
      // vez concluída ela pode já ter dinheiro lançado no caixa/financeiro
      // (org_transactions) e estoque baixado (org_stock_exits) vinculados ao
      // valor/itens originais; editar depois disso dessincronizaria esses
      // registros do novo total sem deixar rastro do que mudou. Cancelada
      // segue a mesma regra (OS encerrada/histórica).
      if (order.status !== 'pendente' && order.status !== 'em_andamento') {
        throw new Error('ORDER_NOT_EDITABLE')
      }

      const valorPagoAtual = Number(order.valorPago ?? 0)
      if (novoValorTotal < valorPagoAtual) {
        throw new Error(`VALUE_BELOW_PAID:${novoValorTotal.toFixed(2)}:${valorPagoAtual.toFixed(2)}`)
      }

      // status_pagamento segue a mesma derivação do POST, com o valor_pago
      // existente (não mexido aqui) comparado contra o novo total
      let statusPagamento: 'pendente' | 'parcial' | 'pago' = 'pendente'
      if (valorPagoAtual >= novoValorTotal && novoValorTotal > 0) {
        statusPagamento = 'pago'
      } else if (valorPagoAtual > 0) {
        statusPagamento = 'parcial'
      }

      await tx
        .delete(orgServiceOrderItems)
        .where(eq(orgServiceOrderItems.orderId, id))

      const insertedItems = await tx
        .insert(orgServiceOrderItems)
        .values(
          items.map((item, index) => ({
            orderId:       id,
            serviceId:     item.service_id || null,
            serviceNome:   item.service_id ? (serviceNameById.get(item.service_id) ?? item.service_nome) : item.service_nome,
            quantidade:    Number(item.quantidade),
            valorUnitario: String(Number(item.valor_unitario)),
            valorTotal:    String(itemTotals[index]),
            observacoes:   item.observacoes || null,
          }))
        )
        .returning()

      // valorPago/status no WHERE funcionam como um optimistic lock: sem
      // FOR UPDATE (incompatível com pgBouncer em transaction mode), duas
      // requisições concorrentes poderiam ler o mesmo valorPago obsoleto
      // dentro de suas próprias transações antes de qualquer commit. Exigir
      // que esses campos ainda estejam no valor lido faz o UPDATE afetar
      // zero linhas se algo mudou entre a leitura e o commit — aí a request
      // perdedora é rejeitada em vez de sobrescrever silenciosamente.
      const [updatedOrder] = await tx
        .update(orgServiceOrders)
        .set({
          valorTotal:         String(novoValorTotal),
          descontoValor:      String(descontoValor),
          descontoPercentual: String(descontoPercentual),
          statusPagamento,
        })
        .where(and(
          eq(orgServiceOrders.id, id),
          eq(orgServiceOrders.organizationId, user.organizationId),
          eq(orgServiceOrders.valorPago, order.valorPago),
          eq(orgServiceOrders.status, order.status),
        ))
        .returning()

      if (!updatedOrder) {
        throw new Error('CONCURRENT_UPDATE')
      }

      return { updatedOrder, insertedItems }
    })

    return NextResponse.json({
      valor_total:         Number(result.updatedOrder.valorTotal),
      desconto_valor:       Number(result.updatedOrder.descontoValor),
      desconto_percentual:  Number(result.updatedOrder.descontoPercentual),
      status_pagamento:     result.updatedOrder.statusPagamento,
      items: result.insertedItems.map(i => ({
        id:             i.id,
        order_id:       i.orderId,
        service_id:     i.serviceId,
        service_nome:   i.serviceNome,
        quantidade:     Number(i.quantidade ?? 1),
        valor_unitario: Number(i.valorUnitario ?? 0),
        valor_total:    Number(i.valorTotal ?? 0),
        observacoes:    i.observacoes,
      })),
    })
  } catch (error) {
    const message = (error as Error).message
    if (message === 'UNAUTHORIZED')
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    if (message === 'ORDER_NOT_FOUND')
      return NextResponse.json({ error: 'Ordem não encontrada' }, { status: 404 })
    if (message === 'ORDER_NOT_EDITABLE')
      return NextResponse.json({ error: 'Só é possível editar os itens de uma ordem pendente ou em andamento' }, { status: 409 })
    if (message === 'CONCURRENT_UPDATE')
      return NextResponse.json({ error: 'A ordem foi alterada por outra ação enquanto você editava. Recarregue e tente novamente.' }, { status: 409 })
    if (message.startsWith('VALUE_BELOW_PAID:')) {
      const [, novoTotal, pago] = message.split(':')
      return NextResponse.json(
        { error: `Novo total R$ ${novoTotal} é menor que o valor já pago R$ ${pago}. Registre um estorno ou ajuste o desconto antes de reduzir o valor.` },
        { status: 400 }
      )
    }
    logServerError('[PUT /api/orders/[id]/items]', error); console.error('[PUT /api/orders/[id]/items]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
