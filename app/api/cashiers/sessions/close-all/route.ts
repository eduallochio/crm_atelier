import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgCashierSessions, orgCashierMovements, orgSystemPreferences } from '@/lib/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'

// Fecha todas as sessões abertas da organização com saldo_real = saldo_esperado
export async function POST() {
  try {
    const user = await requireAuth()

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

    for (const sessao of sessoes) {
      // Calcula saldo esperado
      const movs = await db
        .select({ tipo: orgCashierMovements.tipo, valor: orgCashierMovements.valor })
        .from(orgCashierMovements)
        .where(eq(orgCashierMovements.sessaoId, sessao.id))

      const entradas  = movs.filter(m => m.tipo === 'entrada').reduce((s, m) => s + Number(m.valor), 0)
      const saidas    = movs.filter(m => m.tipo === 'saida').reduce((s, m) => s + Number(m.valor), 0)
      const sangrias  = movs.filter(m => m.tipo === 'sangria').reduce((s, m) => s + Number(m.valor), 0)
      const reforcos  = movs.filter(m => m.tipo === 'reforco').reduce((s, m) => s + Number(m.valor), 0)
      const saldoEsperado = Number(sessao.saldoInicial) + entradas - saidas - sangrias + reforcos

      await db
        .update(orgCashierSessions)
        .set({
          status:                  'fechado',
          dataFechamento:          new Date(),
          saldoReal:               String(saldoEsperado),
          observacoesFechamento:   'Fechamento automático à meia-noite',
          updatedAt:               new Date(),
        })
        .where(eq(orgCashierSessions.id, sessao.id))
    }

    return NextResponse.json({ closed: sessoes.length })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[POST /api/cashiers/sessions/close-all]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
