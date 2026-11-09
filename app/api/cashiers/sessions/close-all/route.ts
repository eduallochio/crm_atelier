import { NextResponse } from 'next/server'
import { requireAuth, assertPermission } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgCashierSessions, orgCashierMovements, orgSystemPreferences } from '@/lib/db/schema'
import { eq, and, isNull, inArray } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'
import { requireProPlan } from '@/lib/plan-limits'
import { calcularSaldoEsperado } from '@/lib/cashier-balance'

// Fecha todas as sessões abertas da organização com saldo_real = saldo_esperado
export async function POST() {
  try {
    const user = await requireAuth()
    assertPermission(user, 'ordens_servico')
    await requireProPlan(user.organizationId)

    // Verifica se fechamento automático está habilitado
    const [prefs] = await db
      .select({ fechamentoAutomaticoCaixa: orgSystemPreferences.fechamentoAutomaticoCaixa })
      .from(orgSystemPreferences)
      .where(eq(orgSystemPreferences.organizationId, user.organizationId))
      .limit(1)

    if (prefs && prefs.fechamentoAutomaticoCaixa === false) {
      return NextResponse.json({ skipped: true, message: 'Fechamento automático desabilitado' })
    }

    // Busca todas as sessões abertas
    const sessoes = await db
      .select({ id: orgCashierSessions.id, saldoInicial: orgCashierSessions.saldoInicial })
      .from(orgCashierSessions)
      .where(and(
        eq(orgCashierSessions.organizationId, user.organizationId),
        eq(orgCashierSessions.status, 'aberto'),
        isNull(orgCashierSessions.dataFechamento),
      ))

    if (sessoes.length === 0) {
      return NextResponse.json({ closed: 0 })
    }

    const sessaoIds = sessoes.map(s => s.id)

    // Busca todos os movimentos de todas as sessões em uma única query —
    // filtro por organizationId como defesa em profundidade: sessaoIds já
    // vem só desta org, mas se um movimento com sessaoId correto e
    // organizationId de outra org existir (bug em outro ponto), não deve
    // contaminar o saldoEsperado calculado aqui
    const todosMovs = await db
      .select({ sessaoId: orgCashierMovements.sessaoId, tipo: orgCashierMovements.tipo, valor: orgCashierMovements.valor })
      .from(orgCashierMovements)
      .where(and(inArray(orgCashierMovements.sessaoId, sessaoIds), eq(orgCashierMovements.organizationId, user.organizationId)))

    const movsPorSessao = new Map<string, typeof todosMovs>()
    for (const mov of todosMovs) {
      const lista = movsPorSessao.get(mov.sessaoId) ?? []
      lista.push(mov)
      movsPorSessao.set(mov.sessaoId, lista)
    }

    const agora = new Date()

    await Promise.all(sessoes.map(async (sessao) => {
      const movs = movsPorSessao.get(sessao.id) ?? []
      const saldoEsperado = calcularSaldoEsperado(sessao.saldoInicial, movs)

      await db
        .update(orgCashierSessions)
        .set({
          status:                'fechado',
          dataFechamento:        agora,
          // saldoReal fica em branco de propósito — fechamento em lote não
          // conferiu dinheiro físico nenhum, então não existe valor "real" a
          // registrar. Preencher com o esperado mascararia qualquer furo de
          // caixa real do dia, já que sempre bateria "certinho"
          saldoReal:             null,
          saldoEsperado:         String(saldoEsperado),
          diferenca:             null,
          observacoesFechamento: 'Fechamento em lote (todos os caixas) — sem conferência de dinheiro físico, revisar quando possível',
          updatedAt:             agora,
        })
        // status='aberto' no WHERE evita que esta requisição sobrescreva
        // silenciosamente um fechamento que outra chamada concorrente (duplo
        // clique, ou overlap com o cron noturno) já tenha feito na mesma sessão
        .where(and(eq(orgCashierSessions.id, sessao.id), eq(orgCashierSessions.status, 'aberto')))
    }))

    return NextResponse.json({ closed: sessoes.length })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    if ((error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Recurso disponível apenas no plano pago' }, { status: 403 })
    }
    logServerError('[POST /api/cashiers/sessions/close-all]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
