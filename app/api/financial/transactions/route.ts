import { NextResponse } from 'next/server'
import { requireAuth, assertPermission } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgTransactions, orgPaymentMethods, orgCashierSessions, orgCashiers, orgCashierMovements } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'
import { requireProPlan } from '@/lib/plan-limits'

// Só dinheiro e Pix passam fisicamente pela gaveta — cartão e boleto, embora
// entrem no extrato financeiro geral, não movimentam o caixa físico
const CASH_DRAWER_PAYMENT_TYPES = new Set(['dinheiro', 'pix'])

export async function GET() {
  try {
    const user = await requireAuth()
    assertPermission(user, 'financeiro')
    await requireProPlan(user.organizationId)

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
        serviceOrderId:  orgTransactions.serviceOrderId,
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
      service_order_id:      r.serviceOrderId,
      observacoes:           r.observacoes,
      created_at:            r.createdAt ? r.createdAt.toISOString() : null,
    }))

    return NextResponse.json(mapped)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    if ((error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Recurso disponível apenas no plano pago' }, { status: 403 })
    }
    logServerError('[GET /api/financial/transactions]', error); console.error('[GET /api/financial/transactions]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    assertPermission(user, 'financeiro')
    await requireProPlan(user.organizationId)
    const body = await request.json()

    const valor = parseFloat(String(body.valor).replace(',', '.'))

    // Insert da transação e do movimento de caixa na mesma transação de banco —
    // sem isso, uma falha no segundo insert deixaria o lançamento criado no
    // extrato geral mas a gaveta física silenciosamente fora de sincronia
    const row = await db.transaction(async (tx) => {
      const [inserted] = await tx
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

      // Lançamento avulso em dinheiro/Pix, com caixa aberto, também debita/credita
      // a gaveta física — sem isso o Fluxo de Caixa mostra a saída mas "Na gaveta
      // agora" nunca reflete esse dinheiro que realmente saiu/entrou nela
      if (body.payment_method_id && !body.receivable_id && !body.payable_id) {
        const [paymentMethod] = await tx
          .select({ tipo: orgPaymentMethods.tipo })
          .from(orgPaymentMethods)
          .where(and(eq(orgPaymentMethods.id, body.payment_method_id), eq(orgPaymentMethods.organizationId, user.organizationId)))
          .limit(1)

        if (paymentMethod && CASH_DRAWER_PAYMENT_TYPES.has(paymentMethod.tipo ?? '')) {
          const [openSession] = await tx
            .select({ id: orgCashierSessions.id })
            .from(orgCashierSessions)
            .leftJoin(orgCashiers, eq(orgCashiers.id, orgCashierSessions.caixaId))
            .where(and(eq(orgCashierSessions.organizationId, user.organizationId), eq(orgCashierSessions.status, 'aberto')))
            .orderBy(desc(orgCashiers.isDefault), desc(orgCashierSessions.createdAt))
            .limit(1)

          if (openSession) {
            await tx.insert(orgCashierMovements).values({
              organizationId:    user.organizationId,
              sessaoId:          openSession.id,
              tipo:              inserted.tipo,
              descricao:         inserted.descricao,
              valor:             String(valor),
              referenciaId:      inserted.id,
              referenciaTipo:    'lancamento_avulso',
              metodoPagamentoId: body.payment_method_id,
              usuarioId:         user.id,
            })
          }
        }
      }

      return inserted
    })

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
    if ((error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Recurso disponível apenas no plano pago' }, { status: 403 })
    }
    logServerError('[POST /api/financial/transactions]', error); console.error('[POST /api/financial/transactions]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
