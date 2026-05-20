import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { logServerError } from '@/lib/log-error'
import {
  organizations,
  orgClients,
  orgServiceOrders,
  profiles,
  orgReceivables,
  orgPayables,
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
    const [recentClients, recentOrders] = await Promise.all([
      db.select({ id: orgClients.id, nome: orgClients.nome, createdAt: orgClients.createdAt })
        .from(orgClients)
        .where(eq(orgClients.organizationId, orgId))
        .orderBy(desc(orgClients.createdAt))
        .limit(5),
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
    ])

    const activities = [
      ...recentClients.map((c) => ({
        id: `client-${c.id}`,
        type: 'client',
        title: 'Novo cliente cadastrado',
        description: c.nome,
        timestamp: c.createdAt?.toISOString() ?? '',
      })),
      ...recentOrders.map((o) => ({
        id: `order-${o.id}`,
        type: o.status === 'concluido' ? 'order_completed' : 'order',
        title: o.status === 'concluido' ? 'Ordem concluída' : 'Nova ordem criada',
        description: `${o.numero} - ${o.clientNome || 'Cliente não informado'}`,
        timestamp: o.createdAt?.toISOString() ?? '',
        metadata: {
          orderNumber: o.numero,
          clientName: o.clientNome,
          status: o.status,
        },
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)

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
        ...o,
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
