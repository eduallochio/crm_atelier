'use client'

import { useMemo } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  TrendingUp, TrendingDown, Minus,
  Wallet, Users, Timer,
  AlertCircle, CheckCircle2, ArrowRight,
  Clock, Target,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

interface FinancialHealth {
  receivables_pending:  number
  receivables_overdue:  number
  payables_pending:     number
  payables_overdue:     number
  receivables_7d:       number
  payables_7d:          number
  pipeline_value:       number
  prev_month_revenue:   number
}

interface TopClient {
  id:              string
  nome:            string
  order_count:     number
  total_revenue:   number
  last_order_date: string
}

interface Order {
  id:               string
  status:           string
  valor_total:      number
  data_abertura:    string
  data_prevista?:   string
  data_conclusao?:  string
}

interface BusinessInsightsProps {
  orders:               Order[]
  financialHealth?:     FinancialHealth
  topClients:           TopClient[]
  inactiveClientsCount: number
  currentMonthRevenue:  number
  isLoading?:           boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const fmtShort = (v: number) => {
  if (v >= 1000) return `R$ ${(v / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 1 })}k`
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="relative bg-card rounded-2xl overflow-hidden border border-border/60 shadow-sm">
      <Skeleton className="absolute top-0 left-0 right-0 h-[3px] rounded-none" />
      <div className="p-5 space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-7 rounded-xl" />
        </div>
        <Skeleton className="h-7 w-32" />
        <Separator />
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-4" style={{ width: `${70 - i * 10}%` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Card 1: Saúde Financeira ──────────────────────────────────────────────────

function FinancialHealthCard({ fh, currentRevenue }: { fh: FinancialHealth; currentRevenue: number }) {
  const netFlow7d     = fh.receivables_7d - fh.payables_7d
  const totalReceive  = fh.receivables_pending + fh.receivables_overdue
  const totalPay      = fh.payables_pending + fh.payables_overdue
  const prevRev       = fh.prev_month_revenue
  const growth        = prevRev > 0 ? ((currentRevenue - prevRev) / prevRev) * 100 : null

  const GrowthIcon = growth === null ? Minus : growth > 0 ? TrendingUp : TrendingDown
  const growthColor = growth === null
    ? 'text-muted-foreground'
    : growth > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'

  return (
    <div className="relative bg-card rounded-2xl overflow-hidden border border-border/60 shadow-sm">
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-emerald-500" />
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Saúde Financeira
            </p>
            <p className="text-2xl font-bold text-foreground mt-1 leading-none">
              {fmtShort(fh.pipeline_value)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">em ordens abertas</p>
          </div>
          <div className="p-2 rounded-xl bg-emerald-500 shadow-sm shrink-0">
            <Wallet className="h-3.5 w-3.5 text-white" />
          </div>
        </div>

        <Separator className="mb-3" />

        {/* Rows */}
        <div className="space-y-2.5">
          {/* A receber */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-[12px] text-muted-foreground">A receber</span>
              {fh.receivables_overdue > 0 && (
                <span className="text-[10px] font-semibold text-red-500 bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 rounded-full">
                  {fmtShort(fh.receivables_overdue)} vencido
                </span>
              )}
            </div>
            <span className="text-[13px] font-bold text-foreground tabular-nums">
              {fmtShort(totalReceive)}
            </span>
          </div>

          {/* A pagar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
              <span className="text-[12px] text-muted-foreground">A pagar</span>
              {fh.payables_overdue > 0 && (
                <span className="text-[10px] font-semibold text-red-500 bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 rounded-full">
                  {fmtShort(fh.payables_overdue)} vencido
                </span>
              )}
            </div>
            <span className="text-[13px] font-bold text-foreground tabular-nums">
              {fmtShort(totalPay)}
            </span>
          </div>

          {/* Próximos 7 dias */}
          <div className={cn(
            'flex items-center justify-between rounded-xl px-3 py-2',
            netFlow7d >= 0
              ? 'bg-emerald-50 dark:bg-emerald-950/20'
              : 'bg-red-50 dark:bg-red-950/20',
          )}>
            <span className="text-[11px] font-medium text-muted-foreground">Fluxo próx. 7 dias</span>
            <span className={cn(
              'text-[12px] font-bold tabular-nums',
              netFlow7d >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400',
            )}>
              {netFlow7d >= 0 ? '+' : ''}{fmtShort(netFlow7d)}
            </span>
          </div>

          {/* Variação mensal */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">Vs. mês anterior</span>
            <div className="flex items-center gap-1">
              <GrowthIcon className={cn('h-3 w-3', growthColor)} />
              <span className={cn('text-[12px] font-semibold tabular-nums', growthColor)}>
                {growth === null
                  ? '—'
                  : `${growth > 0 ? '+' : ''}${Math.abs(growth).toFixed(1)}%`
                }
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-border/50">
          <Link href="/financeiro" className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
            Ver financeiro completo
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── Card 2: Top Clientes ──────────────────────────────────────────────────────

function TopClientsCard({
  topClients,
  inactiveCount,
}: {
  topClients: TopClient[]
  inactiveCount: number
}) {
  const maxRevenue = topClients[0]?.total_revenue || 1
  const CLIENT_COLORS = ['#d4a85a', '#3b82f6', '#8b5cf6', '#ec4899', '#10b981']

  return (
    <div className="relative bg-card rounded-2xl overflow-hidden border border-border/60 shadow-sm">
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-blue-500" />
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Top Clientes
            </p>
            <p className="text-2xl font-bold text-foreground mt-1 leading-none">
              {topClients.length}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">com receita gerada</p>
          </div>
          <div className="p-2 rounded-xl bg-blue-500 shadow-sm shrink-0">
            <Users className="h-3.5 w-3.5 text-white" />
          </div>
        </div>

        <Separator className="mb-3" />

        {topClients.length > 0 ? (
          <div className="space-y-3">
            {topClients.map((client, i) => {
              const pct = (client.total_revenue / maxRevenue) * 100
              const color = CLIENT_COLORS[i]
              return (
                <div key={client.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="text-[10px] font-bold shrink-0 w-5 h-5 rounded-md flex items-center justify-center"
                        style={{ backgroundColor: color + '22', color }}
                      >
                        {i + 1}
                      </span>
                      <span className="text-[12px] font-medium text-foreground truncate">
                        {client.nome}
                      </span>
                    </div>
                    <span
                      className="text-[11px] font-bold shrink-0 ml-2 tabular-nums"
                      style={{ color }}
                    >
                      {fmtShort(client.total_revenue)}
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: color, opacity: 0.7 }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Users className="h-8 w-8 text-muted-foreground/20" />
            <p className="text-xs text-muted-foreground">Sem dados de clientes ainda</p>
          </div>
        )}

        {/* Clientes inativos alerta */}
        {inactiveCount > 0 && (
          <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-[11px] text-muted-foreground">
                <span className="font-bold text-foreground">{inactiveCount}</span> clientes inativos (60+ dias)
              </span>
            </div>
            <Link href="/clientes" className="text-[10px] text-amber-600 hover:underline font-medium">
              Ver
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Card 3: Desempenho Operacional ────────────────────────────────────────────

function OperationalCard({ orders }: { orders: Order[] }) {
  const metrics = useMemo(() => {
    const concluded = orders.filter(
      o => o.status === 'concluido' && o.data_conclusao && o.data_abertura,
    )

    // Ticket médio
    const ticketMedio = concluded.length > 0
      ? concluded.reduce((s, o) => s + o.valor_total, 0) / concluded.length
      : 0

    // Tempo médio de conclusão (dias)
    const avgDays = concluded.length > 0
      ? concluded.reduce((sum, o) => {
          const open  = new Date(o.data_abertura).getTime()
          const close = new Date(o.data_conclusao!).getTime()
          return sum + Math.max(0, Math.ceil((close - open) / (1000 * 60 * 60 * 24)))
        }, 0) / concluded.length
      : 0

    // Taxa de entrega no prazo
    const withDeadline = concluded.filter(o => o.data_prevista)
    const onTime = withDeadline.filter(o => {
      return new Date(o.data_conclusao!) <= new Date(o.data_prevista!)
    })
    const onTimeRate = withDeadline.length > 0
      ? (onTime.length / withDeadline.length) * 100
      : null

    // Cancelamentos
    const cancelRate = orders.length > 0
      ? (orders.filter(o => o.status === 'cancelado').length / orders.length) * 100
      : 0

    // Ordens em aberto
    const openOrders = orders.filter(o =>
      o.status === 'pendente' || o.status === 'em_andamento',
    ).length

    return { ticketMedio, avgDays, onTimeRate, cancelRate, openOrders, concluded: concluded.length }
  }, [orders])

  const onTimeColor = metrics.onTimeRate === null
    ? 'text-muted-foreground'
    : metrics.onTimeRate >= 80
    ? 'text-emerald-600 dark:text-emerald-400'
    : metrics.onTimeRate >= 60
    ? 'text-amber-600 dark:text-amber-400'
    : 'text-red-500 dark:text-red-400'

  return (
    <div className="relative bg-card rounded-2xl overflow-hidden border border-border/60 shadow-sm">
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-violet-500" />
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Desempenho
            </p>
            <p className="text-2xl font-bold text-foreground mt-1 leading-none">
              {metrics.concluded}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">ordens concluídas</p>
          </div>
          <div className="p-2 rounded-xl bg-violet-500 shadow-sm shrink-0">
            <Timer className="h-3.5 w-3.5 text-white" />
          </div>
        </div>

        <Separator className="mb-3" />

        <div className="space-y-2.5">
          {/* Ticket médio */}
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-muted-foreground">Ticket médio</span>
            <span className="text-[13px] font-bold text-foreground tabular-nums">
              {metrics.ticketMedio > 0 ? fmtShort(metrics.ticketMedio) : '—'}
            </span>
          </div>

          {/* Tempo médio */}
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-muted-foreground">Tempo médio</span>
            <span className="text-[13px] font-bold text-foreground tabular-nums">
              {metrics.avgDays > 0 ? `${Math.round(metrics.avgDays)} dias` : '—'}
            </span>
          </div>

          {/* Taxa no prazo */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {metrics.onTimeRate !== null && metrics.onTimeRate >= 80
                ? <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                : <Clock className="h-3 w-3 text-amber-500" />
              }
              <span className="text-[12px] text-muted-foreground">Entrega no prazo</span>
            </div>
            <span className={cn('text-[13px] font-bold tabular-nums', onTimeColor)}>
              {metrics.onTimeRate !== null ? `${Math.round(metrics.onTimeRate)}%` : '—'}
            </span>
          </div>

          {/* Barra de taxa no prazo */}
          {metrics.onTimeRate !== null && (
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-700',
                  metrics.onTimeRate >= 80 ? 'bg-emerald-500'
                    : metrics.onTimeRate >= 60 ? 'bg-amber-400'
                    : 'bg-red-500',
                )}
                style={{ width: `${metrics.onTimeRate}%` }}
              />
            </div>
          )}

          {/* Ordens em aberto + cancelamento */}
          <div className="flex items-center gap-3 pt-1">
            <div className="flex-1 flex items-center justify-between rounded-xl bg-muted/40 px-3 py-1.5">
              <span className="text-[10px] text-muted-foreground">Em aberto</span>
              <span className="text-[12px] font-bold text-foreground">{metrics.openOrders}</span>
            </div>
            <div className="flex-1 flex items-center justify-between rounded-xl bg-muted/40 px-3 py-1.5">
              <span className="text-[10px] text-muted-foreground">Canceladas</span>
              <span className={cn(
                'text-[12px] font-bold',
                metrics.cancelRate > 10 ? 'text-red-500' : 'text-foreground',
              )}>
                {metrics.cancelRate.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-border/50">
          <Link href="/ordens-servico" className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
            Ver todas as ordens
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── Export ────────────────────────────────────────────────────────────────────

export function BusinessInsights({
  orders,
  financialHealth,
  topClients,
  inactiveClientsCount,
  currentMonthRevenue,
  isLoading,
}: BusinessInsightsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  const fh: FinancialHealth = financialHealth ?? {
    receivables_pending: 0, receivables_overdue: 0,
    payables_pending: 0,    payables_overdue: 0,
    receivables_7d: 0,      payables_7d: 0,
    pipeline_value: 0,      prev_month_revenue: 0,
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <FinancialHealthCard fh={fh} currentRevenue={currentMonthRevenue} />
      <TopClientsCard topClients={topClients} inactiveCount={inactiveClientsCount} />
      <OperationalCard orders={orders} />
    </div>
  )
}
