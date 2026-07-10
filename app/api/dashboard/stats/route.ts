import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { logServerError } from '@/lib/log-error'
import {
  organizations,
  orgClients,
  orgServiceOrders,
  orgServiceOrderHistory,
  orgTransactions,
  orgCashierSessions,
  orgProducts,
  orgStockEntries,
  orgSuppliers,
  orgPayables,
  profiles,
  orgReceivables,
} from '@/lib/db/schema'
import {
  eq,
  and,
  sql as drizzleSql,
  desc,
  asc,
  isNull,
  isNotNull,
  gte,
  lte,
  lt,
  or,
} from 'drizzle-orm'
import { hasLifetimeLicense } from '@/lib/plan-limits'

export async function GET() {
  try {
    const user = await requireAuth()
    const orgId = user.organizationId

    // ── Métricas reais contadas diretamente nas tabelas ──────────────────────
    const [clientsCount, ordersCount, usersCount] = await Promise.all([
      db.select({ count: drizzleSql<number>`count(*)::int` })
        .from(orgClients)
        .where(eq(orgClients.organizationId, orgId)),
      db.select({ count: drizzleSql<number>`count(*)::int` })
        .from(orgServiceOrders)
        .where(eq(orgServiceOrders.organizationId, orgId)),
      db.select({ count: drizzleSql<number>`count(*)::int` })
        .from(profiles)
        .where(eq(profiles.organizationId, orgId)),
    ])

    const metrics = {
      clients_count: clientsCount[0]?.count ?? 0,
      orders_count: ordersCount[0]?.count ?? 0,
      users_count: usersCount[0]?.count ?? 1,
    }

    // ── Receita do mês atual ─────────────────────────────────────────────────
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    const revenueResult = await db
      .select({ revenue: drizzleSql<string>`COALESCE(SUM(valor_total), 0)` })
      .from(orgServiceOrders)
      .where(
        and(
          eq(orgServiceOrders.organizationId, orgId),
          eq(orgServiceOrders.status, 'concluido'),
          isNotNull(orgServiceOrders.dataConclusao),
          gte(orgServiceOrders.dataConclusao, startOfMonth),
          lt(orgServiceOrders.dataConclusao, startOfNextMonth),
        )
      )

    const monthlyRevenue = parseFloat(revenueResult[0]?.revenue ?? '0')

    // ── Plano da organização ─────────────────────────────────────────────────
    const [orgResult, lifetime] = await Promise.all([
      db.select({ plan: organizations.plan })
        .from(organizations)
        .where(eq(organizations.id, orgId))
        .limit(1),
      hasLifetimeLicense(orgId),
    ])

    const plan = lifetime ? 'enterprise' : (orgResult[0]?.plan ?? 'free')

    // ── Atividades recentes ──────────────────────────────────────────────────
    const [
      recentClients,
      recentOrders,
      recentStatusChanges,
      recentPayments,
      recentCashierSessions,
      recentProducts,
      recentStockEntries,
      recentSuppliers,
      recentPayables,
    ] = await Promise.all([
      // Novos clientes
      db.select({ id: orgClients.id, nome: orgClients.nome, createdAt: orgClients.createdAt })
        .from(orgClients)
        .where(eq(orgClients.organizationId, orgId))
        .orderBy(desc(orgClients.createdAt))
        .limit(5),

      // Novas OS criadas
      db.select({
          id: orgServiceOrders.id,
          numero: orgServiceOrders.numero,
          createdAt: orgServiceOrders.createdAt,
          status: orgServiceOrders.status,
          clientNome: orgClients.nome,
        })
        .from(orgServiceOrders)
        .leftJoin(orgClients, eq(orgClients.id, orgServiceOrders.clientId))
        .where(eq(orgServiceOrders.organizationId, orgId))
        .orderBy(desc(orgServiceOrders.createdAt))
        .limit(5),

      // Mudanças de status de OS (ex: concluído, cancelado)
      db.select({
          id: orgServiceOrderHistory.id,
          orderId: orgServiceOrderHistory.orderId,
          campoAlterado: orgServiceOrderHistory.campoAlterado,
          valorAnterior: orgServiceOrderHistory.valorAnterior,
          valorNovo: orgServiceOrderHistory.valorNovo,
          createdAt: orgServiceOrderHistory.createdAt,
          numero: orgServiceOrders.numero,
          clientNome: orgClients.nome,
        })
        .from(orgServiceOrderHistory)
        .leftJoin(orgServiceOrders, eq(orgServiceOrders.id, orgServiceOrderHistory.orderId))
        .leftJoin(orgClients, eq(orgClients.id, orgServiceOrders.clientId))
        .where(and(
          eq(orgServiceOrderHistory.organizationId, orgId),
          eq(orgServiceOrderHistory.campoAlterado, 'status'),
        ))
        .orderBy(desc(orgServiceOrderHistory.createdAt))
        .limit(5),

      // Pagamentos recebidos (transações de entrada)
      db.select({
          id: orgTransactions.id,
          descricao: orgTransactions.descricao,
          valor: orgTransactions.valor,
          tipo: orgTransactions.tipo,
          createdAt: orgTransactions.createdAt,
        })
        .from(orgTransactions)
        .where(and(
          eq(orgTransactions.organizationId, orgId),
          eq(orgTransactions.tipo, 'entrada'),
        ))
        .orderBy(desc(orgTransactions.createdAt))
        .limit(5),

      // Abertura/fechamento de caixa
      db.select({
          id: orgCashierSessions.id,
          status: orgCashierSessions.status,
          dataAbertura: orgCashierSessions.dataAbertura,
          dataFechamento: orgCashierSessions.dataFechamento,
          updatedAt: orgCashierSessions.updatedAt,
        })
        .from(orgCashierSessions)
        .where(eq(orgCashierSessions.organizationId, orgId))
        .orderBy(desc(drizzleSql`COALESCE(${orgCashierSessions.updatedAt}, ${orgCashierSessions.dataAbertura})`))
        .limit(4),

      // Novos produtos cadastrados
      db.select({ id: orgProducts.id, nome: orgProducts.nome, createdAt: orgProducts.createdAt })
        .from(orgProducts)
        .where(eq(orgProducts.organizationId, orgId))
        .orderBy(desc(orgProducts.createdAt))
        .limit(3),

      // Entradas de estoque
      db.select({ id: orgStockEntries.id, observacoes: orgStockEntries.observacoes, createdAt: orgStockEntries.createdAt })
        .from(orgStockEntries)
        .where(eq(orgStockEntries.organizationId, orgId))
        .orderBy(desc(orgStockEntries.createdAt))
        .limit(3),

      // Novos fornecedores
      db.select({ id: orgSuppliers.id, nome: orgSuppliers.nome, createdAt: orgSuppliers.createdAt })
        .from(orgSuppliers)
        .where(eq(orgSuppliers.organizationId, orgId))
        .orderBy(desc(orgSuppliers.createdAt))
        .limit(3),

      // Contas a pagar cadastradas
      db.select({ id: orgPayables.id, descricao: orgPayables.descricao, valor: orgPayables.valor, createdAt: orgPayables.createdAt })
        .from(orgPayables)
        .where(eq(orgPayables.organizationId, orgId))
        .orderBy(desc(orgPayables.createdAt))
        .limit(3),
    ])

    const statusLabels: Record<string, string> = {
      pendente: 'Pendente',
      em_andamento: 'Em andamento',
      concluido: 'Concluído',
      cancelado: 'Cancelado',
    }

    const activities = [
      ...recentClients.map((c) => ({
        id: `client-${c.id}`,
        type: 'client' as const,
        title: 'Novo cliente cadastrado',
        description: c.nome ?? '',
        timestamp: c.createdAt?.toISOString() ?? '',
      })),

      ...recentOrders.map((o) => ({
        id: `order-${o.id}`,
        type: 'order' as const,
        title: 'Nova OS criada',
        description: `#${String(o.numero ?? 0).padStart(6, '0')} — ${o.clientNome || 'Cliente não informado'}`,
        timestamp: o.createdAt?.toISOString() ?? '',
      })),

      ...recentStatusChanges.map((h) => ({
        id: `history-${h.id}`,
        type: h.valorNovo === 'concluido' ? 'order_completed' as const
            : h.valorNovo === 'cancelado' ? 'order_cancelled' as const
            : 'order_status' as const,
        title: `OS ${statusLabels[h.valorNovo ?? ''] ?? h.valorNovo}`,
        description: `#${String(h.numero ?? 0).padStart(6, '0')} — ${h.clientNome || 'Cliente não informado'}`,
        timestamp: h.createdAt?.toISOString() ?? '',
      })),

      ...recentPayments.map((t) => ({
        id: `payment-${t.id}`,
        type: 'payment' as const,
        title: 'Pagamento recebido',
        description: `${t.descricao ?? 'Sem descrição'} — R$ ${Number(t.valor).toFixed(2)}`,
        timestamp: t.createdAt?.toISOString() ?? '',
      })),

      ...recentCashierSessions.map((s) => ({
        id: `cashier-${s.id}`,
        type: s.status === 'fechado' ? 'cashier_close' as const : 'cashier_open' as const,
        title: s.status === 'fechado' ? 'Caixa fechado' : 'Caixa aberto',
        description: s.status === 'fechado'
          ? s.dataFechamento ? new Date(s.dataFechamento).toLocaleString('pt-BR') : ''
          : s.dataAbertura ? new Date(s.dataAbertura).toLocaleString('pt-BR') : '',
        timestamp: s.updatedAt?.toISOString() ?? s.dataAbertura?.toISOString() ?? '',
      })),

      ...recentProducts.map((p) => ({
        id: `product-${p.id}`,
        type: 'product' as const,
        title: 'Produto cadastrado',
        description: p.nome ?? '',
        timestamp: p.createdAt?.toISOString() ?? '',
      })),

      ...recentStockEntries.map((e) => ({
        id: `stock-${e.id}`,
        type: 'stock' as const,
        title: 'Entrada de estoque',
        description: e.observacoes ?? 'Reposição de materiais',
        timestamp: e.createdAt?.toISOString() ?? '',
      })),

      ...recentSuppliers.map((s) => ({
        id: `supplier-${s.id}`,
        type: 'supplier' as const,
        title: 'Fornecedor cadastrado',
        description: s.nome ?? '',
        timestamp: s.createdAt?.toISOString() ?? '',
      })),

      ...recentPayables.map((p) => ({
        id: `payable-${p.id}`,
        type: 'payable' as const,
        title: 'Conta a pagar lançada',
        description: `${p.descricao ?? 'Sem descrição'} — R$ ${Number(p.valor).toFixed(2)}`,
        timestamp: p.createdAt?.toISOString() ?? '',
      })),
    ]
      .filter((a) => a.timestamp)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 15)

    // ── Saúde financeira ─────────────────────────────────────────────────────
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const next7d = new Date(today)
    next7d.setDate(next7d.getDate() + 7)
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const startOfCurrMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      receivablesPending,
      receivablesOverdue,
      payablesPending,
      payablesOverdue,
      receivables7d,
      payables7d,
      pipelineValue,
      prevMonthRevenue,
    ] = await Promise.all([
      db.select({ total: drizzleSql<string>`COALESCE(SUM(valor), 0)` })
        .from(orgReceivables)
        .where(and(
          eq(orgReceivables.organizationId, orgId),
          eq(orgReceivables.status, 'pendente'),
          gte(orgReceivables.dataVencimento, today.toISOString().slice(0, 10)),
        )),
      db.select({ total: drizzleSql<string>`COALESCE(SUM(valor), 0)` })
        .from(orgReceivables)
        .where(and(
          eq(orgReceivables.organizationId, orgId),
          eq(orgReceivables.status, 'pendente'),
          lt(orgReceivables.dataVencimento, today.toISOString().slice(0, 10)),
        )),
      db.select({ total: drizzleSql<string>`COALESCE(SUM(valor), 0)` })
        .from(orgPayables)
        .where(and(
          eq(orgPayables.organizationId, orgId),
          eq(orgPayables.status, 'pendente'),
          gte(orgPayables.dataVencimento, today.toISOString().slice(0, 10)),
        )),
      db.select({ total: drizzleSql<string>`COALESCE(SUM(valor), 0)` })
        .from(orgPayables)
        .where(and(
          eq(orgPayables.organizationId, orgId),
          eq(orgPayables.status, 'pendente'),
          lt(orgPayables.dataVencimento, today.toISOString().slice(0, 10)),
        )),
      db.select({ total: drizzleSql<string>`COALESCE(SUM(valor), 0)` })
        .from(orgReceivables)
        .where(and(
          eq(orgReceivables.organizationId, orgId),
          eq(orgReceivables.status, 'pendente'),
          gte(orgReceivables.dataVencimento, today.toISOString().slice(0, 10)),
          lte(orgReceivables.dataVencimento, next7d.toISOString().slice(0, 10)),
        )),
      db.select({ total: drizzleSql<string>`COALESCE(SUM(valor), 0)` })
        .from(orgPayables)
        .where(and(
          eq(orgPayables.organizationId, orgId),
          eq(orgPayables.status, 'pendente'),
          gte(orgPayables.dataVencimento, today.toISOString().slice(0, 10)),
          lte(orgPayables.dataVencimento, next7d.toISOString().slice(0, 10)),
        )),
      db.select({ total: drizzleSql<string>`COALESCE(SUM(valor_total), 0)` })
        .from(orgServiceOrders)
        .where(and(
          eq(orgServiceOrders.organizationId, orgId),
          drizzleSql`status IN ('pendente', 'em_andamento')`,
        )),
      db.select({ total: drizzleSql<string>`COALESCE(SUM(valor_total), 0)` })
        .from(orgServiceOrders)
        .where(and(
          eq(orgServiceOrders.organizationId, orgId),
          eq(orgServiceOrders.status, 'concluido'),
          gte(orgServiceOrders.dataConclusao, startOfPrevMonth),
          lt(orgServiceOrders.dataConclusao, startOfCurrMonth),
        )),
    ])

    const financialHealth = {
      receivables_pending: parseFloat(receivablesPending[0]?.total ?? '0'),
      receivables_overdue: parseFloat(receivablesOverdue[0]?.total ?? '0'),
      payables_pending: parseFloat(payablesPending[0]?.total ?? '0'),
      payables_overdue: parseFloat(payablesOverdue[0]?.total ?? '0'),
      receivables_7d: parseFloat(receivables7d[0]?.total ?? '0'),
      payables_7d: parseFloat(payables7d[0]?.total ?? '0'),
      pipeline_value: parseFloat(pipelineValue[0]?.total ?? '0'),
      prev_month_revenue: parseFloat(prevMonthRevenue[0]?.total ?? '0'),
    }

    // ── Top clientes por receita ─────────────────────────────────────────────
    const topClients = await db
      .select({
        id: orgClients.id,
        nome: orgClients.nome,
        order_count: drizzleSql<number>`count(${orgServiceOrders.id})::int`,
        total_revenue: drizzleSql<string>`COALESCE(SUM(${orgServiceOrders.valorTotal}), 0)`,
        last_order_date: drizzleSql<string>`MAX(${orgServiceOrders.createdAt})`,
      })
      .from(orgClients)
      .innerJoin(
        orgServiceOrders,
        and(
          eq(orgServiceOrders.clientId, orgClients.id),
          eq(orgServiceOrders.organizationId, orgId),
          eq(orgServiceOrders.status, 'concluido'),
        )
      )
      .where(eq(orgClients.organizationId, orgId))
      .groupBy(orgClients.id, orgClients.nome)
      .orderBy(drizzleSql`SUM(${orgServiceOrders.valorTotal}) DESC`)
      .limit(5)

    // ── Clientes inativos (sem ordem nos últimos 60 dias) ────────────────────
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

    const inactiveResult = await db
      .select({ count: drizzleSql<number>`count(*)::int` })
      .from(orgClients)
      .where(
        and(
          eq(orgClients.organizationId, orgId),
          drizzleSql`NOT EXISTS (
            SELECT 1 FROM org_service_orders o
            WHERE o.client_id = ${orgClients.id}
              AND o.organization_id = ${orgId}
              AND o.created_at >= ${sixtyDaysAgo.toISOString()}
          )`,
        )
      )

    const inactiveClientsCount = inactiveResult[0]?.count ?? 0

    // ── Ordens urgentes (próximas 7 dias, pendente/em_andamento) ────────────
    const deadline = new Date()
    deadline.setDate(deadline.getDate() + 7)

    const urgentOrders = await db
      .select({
        id: orgServiceOrders.id,
        numero: orgServiceOrders.numero,
        dataPrevista: orgServiceOrders.dataPrevista,
        status: orgServiceOrders.status,
        valorTotal: orgServiceOrders.valorTotal,
        clientNome: orgClients.nome,
      })
      .from(orgServiceOrders)
      .leftJoin(orgClients, eq(orgClients.id, orgServiceOrders.clientId))
      .where(
        and(
          eq(orgServiceOrders.organizationId, orgId),
          drizzleSql`${orgServiceOrders.status} IN ('pendente', 'em_andamento')`,
          isNotNull(orgServiceOrders.dataPrevista),
          lte(orgServiceOrders.dataPrevista, deadline.toISOString().slice(0, 10)),
        )
      )
      .orderBy(asc(orgServiceOrders.dataPrevista))
      .limit(5)

    return NextResponse.json({
      metrics,
      monthly_revenue: monthlyRevenue,
      plan,
      recent_activities: activities,
      urgent_orders: urgentOrders.map((o) => ({
        id: o.id,
        numero: o.numero,
        data_prevista: o.dataPrevista,
        status: o.status,
        valor_total: Number(o.valorTotal ?? 0),
        client: { nome: o.clientNome },
      })),
      financial_health: financialHealth,
      top_clients: topClients,
      inactive_clients_count: inactiveClientsCount,
    })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[GET /api/dashboard/stats]', error); console.error('[GET /api/dashboard/stats]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
