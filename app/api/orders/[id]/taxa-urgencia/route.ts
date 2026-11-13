import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { orgServiceOrders, orgServiceOrderItems, orgServiceOrderEmbalagens, orgOrderSettings } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuth, assertPermission } from '@/lib/auth/session'
import { logServerError } from '@/lib/log-error'
import { calcularDesconto } from '@/lib/order-discount'
import { isFreePlanForFeatureGate } from '@/lib/plan-limits'

/**
 * PUT /api/orders/[id]/taxa-urgencia → define/remove a taxa de urgência da OS
 * e recalcula valor_total somando-a ao subtotal (itens + embalagens) antes do
 * desconto — mesmo padrão de /embalagens (lib/order-discount.ts), reusado
 * para não duplicar a regra de cálculo.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    assertPermission(user, 'ordens_servico')
    const { id } = await params
    const body = await request.json() as {
      ativa: boolean
      tipo?: 'percentual' | 'valor'
      percentual?: number
      valor?: number
    }

    if (await isFreePlanForFeatureGate(user.organizationId)) {
      return NextResponse.json({ error: 'Taxa de urgência disponível a partir do plano Pro' }, { status: 403 })
    }

    const [prefs] = await db
      .select({ usaTaxaUrgencia: orgOrderSettings.usaTaxaUrgencia })
      .from(orgOrderSettings)
      .where(eq(orgOrderSettings.organizationId, user.organizationId))
    if (!prefs?.usaTaxaUrgencia) {
      return NextResponse.json({ error: 'Taxa de urgência não está habilitada em Configurações' }, { status: 403 })
    }

    const result = await db.transaction(async (tx) => {
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
      if (orderRow.status !== 'pendente' && orderRow.status !== 'em_andamento') {
        throw new Error('ORDER_NOT_EDITABLE')
      }

      const ativa = !!body.ativa
      const tipo = body.tipo === 'valor' ? 'valor' : 'percentual'
      const percentual = ativa && tipo === 'percentual' ? Math.max(0, Number(body.percentual) || 0) : null
      const valorFixo = ativa && tipo === 'valor' ? Math.max(0, Number(body.valor) || 0) : null

      const itens = await tx
        .select({ valorTotal: orgServiceOrderItems.valorTotal })
        .from(orgServiceOrderItems)
        .where(eq(orgServiceOrderItems.orderId, id))
      const embalagens = await tx
        .select({ quantidade: orgServiceOrderEmbalagens.quantidade, precoUnitario: orgServiceOrderEmbalagens.precoUnitario })
        .from(orgServiceOrderEmbalagens)
        .where(eq(orgServiceOrderEmbalagens.orderId, id))

      const subtotalItens = itens.reduce((sum, i) => sum + Number(i.valorTotal ?? 0), 0)
      const subtotalEmbalagens = embalagens.reduce((sum, e) => sum + Number(e.precoUnitario ?? 0) * Number(e.quantidade ?? 1), 0)

      const valorUrgencia = !ativa
        ? 0
        : tipo === 'percentual'
          ? (subtotalItens + subtotalEmbalagens) * ((percentual ?? 0) / 100)
          : (valorFixo ?? 0)

      const subtotal = subtotalItens + subtotalEmbalagens + valorUrgencia

      const { descontoPercentual, descontoValor, valorTotal } = calcularDesconto(
        subtotal,
        Number(orderRow.descontoPercentual ?? 0),
        Number(orderRow.descontoValor ?? 0),
      )

      const valorPagoAtual = Number(orderRow.valorPago ?? 0)
      if (valorTotal < valorPagoAtual) {
        throw new Error(`VALUE_BELOW_PAID:${valorTotal.toFixed(2)}:${valorPagoAtual.toFixed(2)}`)
      }

      let statusPagamento: 'pendente' | 'parcial' | 'pago' = 'pendente'
      if (valorPagoAtual >= valorTotal && valorTotal > 0) {
        statusPagamento = 'pago'
      } else if (valorPagoAtual > 0) {
        statusPagamento = 'parcial'
      }

      const [updatedOrder] = await tx
        .update(orgServiceOrders)
        .set({
          taxaUrgenciaTipo:       ativa ? tipo : null,
          taxaUrgenciaPercentual: percentual != null ? String(percentual) : null,
          taxaUrgenciaValor:      ativa ? String(valorUrgencia) : null,
          valorTotal:             String(valorTotal),
          descontoValor:          String(descontoValor),
          descontoPercentual:     String(descontoPercentual),
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

      return updatedOrder
    })

    return NextResponse.json({
      taxa_urgencia_tipo:       result.taxaUrgenciaTipo,
      taxa_urgencia_percentual: result.taxaUrgenciaPercentual != null ? Number(result.taxaUrgenciaPercentual) : null,
      taxa_urgencia_valor:      result.taxaUrgenciaValor != null ? Number(result.taxaUrgenciaValor) : null,
      valor_total:              Number(result.valorTotal),
    })
  } catch (error) {
    const message = (error as Error).message
    if (message === 'UNAUTHORIZED')
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    if (message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    if (message === 'ORDER_NOT_FOUND')
      return NextResponse.json({ error: 'Ordem não encontrada' }, { status: 404 })
    if (message === 'ORDER_NOT_EDITABLE')
      return NextResponse.json({ error: 'Só é possível editar a taxa de urgência de uma ordem pendente ou em andamento' }, { status: 409 })
    if (message === 'CONCURRENT_UPDATE')
      return NextResponse.json({ error: 'A ordem foi alterada por outra ação enquanto você editava. Recarregue e tente novamente.' }, { status: 409 })
    if (message.startsWith('VALUE_BELOW_PAID:')) {
      const [, novoTotal, pago] = message.split(':')
      return NextResponse.json(
        { error: `Novo total R$ ${novoTotal} é menor que o valor já pago R$ ${pago}. Registre um estorno ou ajuste o desconto antes de reduzir o valor.` },
        { status: 400 }
      )
    }
    logServerError('[PUT /api/orders/[id]/taxa-urgencia]', error); console.error('[PUT /api/orders/[id]/taxa-urgencia]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
