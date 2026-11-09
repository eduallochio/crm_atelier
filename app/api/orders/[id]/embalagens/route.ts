import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { orgServiceOrderEmbalagens, orgServiceOrderItems, orgServiceOrders, orgSystemPreferences, orgProducts } from '@/lib/db/schema'
import { eq, and, asc, inArray } from 'drizzle-orm'
import { requireAuth, assertPermission } from '@/lib/auth/session'
import { logServerError } from '@/lib/log-error'
import { calcularDesconto } from '@/lib/order-discount'

/** GET /api/orders/[id]/embalagens → list embalagens for the order */
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    assertPermission(user, 'ordens_servico')
    const { id } = await params

    // Verify order belongs to org
    const [order] = await db
      .select({ id: orgServiceOrders.id })
      .from(orgServiceOrders)
      .where(and(eq(orgServiceOrders.id, id), eq(orgServiceOrders.organizationId, user.organizationId)))

    if (!order) {
      return NextResponse.json({ error: 'Ordem não encontrada' }, { status: 404 })
    }

    const embalagens = await db
      .select()
      .from(orgServiceOrderEmbalagens)
      .where(eq(orgServiceOrderEmbalagens.orderId, id))
      .orderBy(asc(orgServiceOrderEmbalagens.createdAt))

    return NextResponse.json(embalagens.map(e => ({
      id:             e.id,
      order_id:       e.orderId,
      product_id:     e.productId,
      nome:           e.nome,
      quantidade:     Number(e.quantidade ?? 1),
      unidade:        e.unidade,
      preco_unitario: e.precoUnitario != null ? Number(e.precoUnitario) : null,
      created_at:     e.createdAt,
    })))
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED')
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    if ((error as Error).message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    logServerError('[GET /api/orders/[id]/embalagens]', error); console.error('[GET /api/orders/[id]/embalagens]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

/**
 * PUT /api/orders/[id]/embalagens → substitui todas as embalagens da OS
 * (delete-all + re-insert, mesmo padrão de /materials). Quando a preferência
 * embalagem_soma_total está ligada, o valor de cada embalagem (preço de
 * custo do produto no momento da gravação × quantidade) é somado ao
 * subtotal da OS junto com os itens de serviço, antes de calcular o
 * desconto — reusa calcularDesconto() (lib/order-discount.ts), a mesma
 * função usada em /items e no POST de criação da OS, para não duplicar essa
 * regra de negócio.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    assertPermission(user, 'ordens_servico')
    const { id } = await params
    const body = await request.json()
    const embalagens: Array<{
      product_id?: string | null
      nome: string
      quantidade: number
      unidade?: string
    }> = body.embalagens ?? []

    // Verify order belongs to org
    const [order] = await db
      .select({ id: orgServiceOrders.id })
      .from(orgServiceOrders)
      .where(and(eq(orgServiceOrders.id, id), eq(orgServiceOrders.organizationId, user.organizationId)))

    if (!order) {
      return NextResponse.json({ error: 'Ordem não encontrada' }, { status: 404 })
    }

    const [prefs] = await db
      .select({ embalagemSomaTotal: orgSystemPreferences.embalagemSomaTotal })
      .from(orgSystemPreferences)
      .where(eq(orgSystemPreferences.organizationId, user.organizationId))
    const somaTotal = !!prefs?.embalagemSomaTotal

    const valid = embalagens.filter(e => e.nome && e.quantidade && e.quantidade > 0)

    // Busca o preço de custo atual dos produtos referenciados — snapshot
    // gravado em cada embalagem, para o valor da OS não mudar
    // retroativamente se o preço do produto for editado depois
    const productIds = [...new Set(valid.map(e => e.product_id).filter((v): v is string => !!v))]
    const precoPorProduto = new Map<string, number>()
    if (productIds.length > 0) {
      const owned = await db
        .select({ id: orgProducts.id, precoCusto: orgProducts.precoCusto })
        .from(orgProducts)
        .where(and(inArray(orgProducts.id, productIds), eq(orgProducts.organizationId, user.organizationId)))
      for (const p of owned) {
        precoPorProduto.set(p.id, Number(p.precoCusto ?? 0))
      }
    }

    const result = await db.transaction(async (tx) => {
      // valorPago/status lidos dentro da transaction (não antes), mesmo
      // motivo do /items: evita decidir edição/bloqueio com base em estado
      // que pode ter mudado entre a leitura e o commit
      const [orderRow] = await tx
        .select({
          status: orgServiceOrders.status,
          valorPago: orgServiceOrders.valorPago,
          descontoPercentual: orgServiceOrders.descontoPercentual,
          descontoValor: orgServiceOrders.descontoValor,
        })
        .from(orgServiceOrders)
        .where(and(eq(orgServiceOrders.id, id), eq(orgServiceOrders.organizationId, user.organizationId)))

      if (!orderRow) {
        throw new Error('ORDER_NOT_FOUND')
      }

      await tx
        .delete(orgServiceOrderEmbalagens)
        .where(eq(orgServiceOrderEmbalagens.orderId, id))

      const insertedEmbalagens = valid.length > 0
        ? await tx.insert(orgServiceOrderEmbalagens).values(
            valid.map(e => {
              const precoUnitario = e.product_id ? (precoPorProduto.get(e.product_id) ?? 0) : 0
              return {
                orderId:       id,
                productId:     e.product_id || null,
                nome:          e.nome,
                quantidade:    String(e.quantidade),
                unidade:       e.unidade || 'un',
                precoUnitario: String(precoUnitario),
              }
            })
          ).returning()
        : []

      // Recalcula o total da OS somando embalagens, só quando a preferência
      // está ligada. Mudar o total de uma OS já concluída/cancelada
      // dessincronizaria caixa/financeiro/estoque já lançados contra o
      // valor original — mesma regra de bloqueio do /items (ORDER_NOT_EDITABLE)
      if (somaTotal) {
        if (orderRow.status !== 'pendente' && orderRow.status !== 'em_andamento') {
          throw new Error('ORDER_NOT_EDITABLE')
        }

        const itens = await tx
          .select({ valorTotal: orgServiceOrderItems.valorTotal })
          .from(orgServiceOrderItems)
          .where(eq(orgServiceOrderItems.orderId, id))

        const subtotalItens = itens.reduce((sum, i) => sum + Number(i.valorTotal ?? 0), 0)
        const subtotalEmbalagens = valid.reduce((sum, e) => {
          const preco = e.product_id ? (precoPorProduto.get(e.product_id) ?? 0) : 0
          return sum + preco * Number(e.quantidade)
        }, 0)
        const subtotal = subtotalItens + subtotalEmbalagens

        const { descontoPercentual, descontoValor, valorTotal } = calcularDesconto(
          subtotal,
          Number(orderRow.descontoPercentual ?? 0),
          Number(orderRow.descontoValor ?? 0),
        )

        const valorPagoAtual = Number(orderRow.valorPago ?? 0)
        if (valorTotal < valorPagoAtual) {
          throw new Error(`VALUE_BELOW_PAID:${valorTotal.toFixed(2)}:${valorPagoAtual.toFixed(2)}`)
        }

        // status_pagamento segue a mesma derivação do /items, com o
        // valor_pago existente (não mexido aqui) comparado contra o novo total
        let statusPagamento: 'pendente' | 'parcial' | 'pago' = 'pendente'
        if (valorPagoAtual >= valorTotal && valorTotal > 0) {
          statusPagamento = 'pago'
        } else if (valorPagoAtual > 0) {
          statusPagamento = 'parcial'
        }

        // valorPago/status no WHERE como optimistic lock — ver comentário
        // equivalente em /items sobre pgBouncer/transaction mode não suportar FOR UPDATE
        const [updatedOrder] = await tx
          .update(orgServiceOrders)
          .set({
            valorTotal: String(valorTotal),
            descontoValor: String(descontoValor),
            descontoPercentual: String(descontoPercentual),
            statusPagamento,
          })
          .where(and(
            eq(orgServiceOrders.id, id),
            eq(orgServiceOrders.organizationId, user.organizationId),
            eq(orgServiceOrders.valorPago, orderRow.valorPago),
            eq(orgServiceOrders.status, orderRow.status),
          ))
          .returning()

        if (!updatedOrder) {
          throw new Error('CONCURRENT_UPDATE')
        }
      }

      return insertedEmbalagens
    })

    return NextResponse.json(result.map(e => ({
      id:             e.id,
      order_id:       e.orderId,
      product_id:     e.productId,
      nome:           e.nome,
      quantidade:     Number(e.quantidade ?? 1),
      unidade:        e.unidade,
      preco_unitario: e.precoUnitario != null ? Number(e.precoUnitario) : null,
    })))
  } catch (error) {
    const message = (error as Error).message
    if (message === 'UNAUTHORIZED')
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    if (message === 'ORDER_NOT_FOUND')
      return NextResponse.json({ error: 'Ordem não encontrada' }, { status: 404 })
    if (message === 'ORDER_NOT_EDITABLE')
      return NextResponse.json({ error: 'Só é possível editar a embalagem de uma ordem pendente ou em andamento' }, { status: 409 })
    if (message === 'CONCURRENT_UPDATE')
      return NextResponse.json({ error: 'A ordem foi alterada por outra ação enquanto você editava. Recarregue e tente novamente.' }, { status: 409 })
    if (message.startsWith('VALUE_BELOW_PAID:')) {
      const [, novoTotal, pago] = message.split(':')
      return NextResponse.json(
        { error: `Novo total R$ ${novoTotal} é menor que o valor já pago R$ ${pago}. Registre um estorno ou ajuste o desconto antes de reduzir o valor.` },
        { status: 400 }
      )
    }
    logServerError('[PUT /api/orders/[id]/embalagens]', error); console.error('[PUT /api/orders/[id]/embalagens]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
