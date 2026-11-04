import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { orgCashierSessions, orgCashierMovements, orgSystemPreferences, organizations } from '@/lib/db/schema'
import { eq, and, isNull, inArray, or, ne } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'
import { validateCronSecret } from '@/lib/cron-auth'
import { calcularSaldoEsperado } from '@/lib/cashier-balance'

// GET — chamado pelo Vercel Cron (diário, à meia-noite). Fecha todas as
// sessões de caixa abertas de todas as organizações com saldo_real =
// saldo_esperado, respeitando a preferência fechamento_automatico_caixa de
// cada org. Substitui o antigo mecanismo via setTimeout no navegador
// (components/layouts/dashboard-shell.tsx), que só rodava se alguém
// estivesse com o app aberto exatamente à meia-noite — na prática, quase
// nunca disparava.
export async function GET(request: Request) {
  try {
    if (!process.env.CRON_SECRET) {
      logServerError('[cron/close-cashiers]', new Error('CRON_SECRET não configurado'))
      return NextResponse.json({ error: 'CRON_SECRET não configurado' }, { status: 500 })
    }
    if (!validateCronSecret(request.headers.get('authorization'))) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Sessões abertas de organizações que NÃO desativaram o fechamento
    // automático. Importante: org sem row em org_system_preferences deve
    // contar como habilitada (default da coluna é true) — em SQL,
    // "NULL != false" avalia para NULL (não true), então o WHERE excluiria
    // silenciosamente toda org sem preferência explícita se usássemos só
    // ne(...); por isso o isNull() explícito cobre esse caso também.
    const candidatas = await db
      .select({
        id:             orgCashierSessions.id,
        organizationId: orgCashierSessions.organizationId,
        saldoInicial:   orgCashierSessions.saldoInicial,
      })
      .from(orgCashierSessions)
      .leftJoin(orgSystemPreferences, eq(orgSystemPreferences.organizationId, orgCashierSessions.organizationId))
      .where(and(
        eq(orgCashierSessions.status, 'aberto'),
        isNull(orgCashierSessions.dataFechamento),
        or(isNull(orgSystemPreferences.fechamentoAutomaticoCaixa), ne(orgSystemPreferences.fechamentoAutomaticoCaixa, false)),
      ))

    if (candidatas.length === 0) {
      return NextResponse.json({ closed: 0 })
    }

    // Caixa é um módulo exclusivo do plano Pro+ — mesma checagem que a rota
    // manual (requireProPlan) fazia antes de fechar; sem isso, uma org no
    // Free com uma sessão esquecida aberta (ex: após downgrade) seria
    // tocada pelo cron mesmo não tendo acesso ao módulo
    const orgIds = [...new Set(candidatas.map(s => s.organizationId))]
    const orgsRows = await db
      .select({ id: organizations.id, plan: organizations.plan, lifetimeLicense: organizations.lifetimeLicense })
      .from(organizations)
      .where(inArray(organizations.id, orgIds))
    // org.lifetimeLicense já veio na mesma query acima — hasLifetimeLicense()
    // hoje só lê essa mesma coluna, então chamá-la de novo aqui seria um
    // round-trip redundante por organização
    const proOrgIds = new Set<string>()
    for (const org of orgsRows) {
      if (org.plan !== 'free' || org.lifetimeLicense) {
        proOrgIds.add(org.id)
      }
    }
    const sessoes = candidatas.filter(s => proOrgIds.has(s.organizationId))

    if (sessoes.length === 0) {
      return NextResponse.json({ closed: 0 })
    }

    const sessaoIds = sessoes.map(s => s.id)
    const orgIdBySessaoId = new Map(sessoes.map(s => [s.id, s.organizationId]))

    const todosMovs = await db
      .select({ sessaoId: orgCashierMovements.sessaoId, organizationId: orgCashierMovements.organizationId, tipo: orgCashierMovements.tipo, valor: orgCashierMovements.valor })
      .from(orgCashierMovements)
      .where(inArray(orgCashierMovements.sessaoId, sessaoIds))

    // Defesa em profundidade: este cron processa sessões de várias
    // organizações numa única query em lote, então um movimento cujo
    // organizationId não bate com o da sessão que seu sessaoId aponta
    // (nunca deveria existir, mas se existisse por um bug em outro ponto)
    // não pode contaminar o saldoEsperado de outra organização
    const movsPorSessao = new Map<string, typeof todosMovs>()
    for (const mov of todosMovs) {
      if (mov.organizationId !== orgIdBySessaoId.get(mov.sessaoId)) continue
      const lista = movsPorSessao.get(mov.sessaoId) ?? []
      lista.push(mov)
      movsPorSessao.set(mov.sessaoId, lista)
    }

    const agora = new Date()

    for (const sessao of sessoes) {
      const movs = movsPorSessao.get(sessao.id) ?? []
      const saldoEsperado = calcularSaldoEsperado(sessao.saldoInicial, movs)

      // Condição de status = 'aberto' no WHERE evita fechar de novo uma
      // sessão que outro disparo concorrente do cron já tenha fechado
      await db
        .update(orgCashierSessions)
        .set({
          status:                'fechado',
          dataFechamento:        agora,
          // saldoReal fica em branco de propósito — fechamento automático não
          // conferiu dinheiro físico nenhum, então não existe valor "real" a
          // registrar. Preencher com o esperado mascararia qualquer furo de
          // caixa real do dia, já que sempre bateria "certinho"
          saldoReal:             null,
          saldoEsperado:         String(saldoEsperado),
          diferenca:             null,
          observacoesFechamento: 'Fechamento automático à meia-noite — sem conferência de dinheiro físico, revisar quando possível',
          updatedAt:             agora,
        })
        .where(and(eq(orgCashierSessions.id, sessao.id), eq(orgCashierSessions.status, 'aberto')))
    }

    return NextResponse.json({ closed: sessoes.length })
  } catch (error) {
    logServerError('[GET /api/cron/close-cashiers]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
