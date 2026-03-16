'use client'

import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { DollarSign, Package, Activity } from 'lucide-react'

interface Order {
  id: string
  status: string
  data_abertura: string
  data_conclusao?: string
  valor_total: number
  items?: { service_id: string }[]
}

interface Service {
  id: string
  nome: string
}

interface DashboardChartsProps {
  ordersData: Order[]
  servicesData: Service[]
}

interface ServiceSold {
  nome: string
  quantidade: number
}

const SERVICE_COLORS = ['#d4a85a', '#3b82f6', '#8b5cf6', '#ec4899', '#10b981']

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pendente:     { label: 'Pendente',     color: '#f59e0b' },
  em_andamento: { label: 'Em Andamento', color: '#3b82f6' },
  concluido:    { label: 'Concluído',    color: '#10b981' },
  cancelado:    { label: 'Cancelado',    color: '#ef4444' },
}

function RevenueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-popover border border-border rounded-xl shadow-lg px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-bold text-foreground">
        R$ {Number(payload[0].value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      </p>
    </div>
  )
}

function StatusTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-popover border border-border rounded-xl shadow-lg px-3 py-2">
      <p className="text-sm font-semibold text-foreground">{payload[0].name}</p>
      <p className="text-xs text-muted-foreground">{payload[0].value} ordens</p>
    </div>
  )
}

export function DashboardCharts({ ordersData, servicesData }: DashboardChartsProps) {
  const monthlyRevenue = useMemo(() => {
    const map: Record<string, { mes: string; valor: number; sortKey: number }> = {}
    for (const order of ordersData) {
      if (order.status !== 'concluido') continue
      const dateStr = (order.data_conclusao || order.data_abertura || '').split('T')[0]
      const [year, month] = dateStr.split('-').map(Number)
      if (!year || !month) continue
      const key = `${year}-${String(month).padStart(2, '0')}`
      const mes = new Date(year, month - 1, 1).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
      if (map[key]) map[key].valor += order.valor_total
      else map[key] = { mes, valor: order.valor_total, sortKey: year * 100 + month }
    }
    return Object.values(map)
      .sort((a, b) => a.sortKey - b.sortKey)
      .map(({ mes, valor }) => ({ mes, valor }))
  }, [ordersData])

  const servicesSold = useMemo((): ServiceSold[] => {
    return servicesData
      .map(s => ({
        nome: s.nome,
        quantidade: ordersData.reduce((count, order) => {
          return count + (order.items?.filter(i => i.service_id === s.id).length || 0)
        }, 0),
      }))
      .filter(s => s.quantidade > 0)
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5)
  }, [ordersData, servicesData])

  const ordersByStatus = useMemo(() => {
    return Object.entries(STATUS_CONFIG)
      .map(([status, cfg]) => ({
        name: cfg.label,
        value: ordersData.filter(o => o.status === status).length,
        color: cfg.color,
      }))
      .filter(s => s.value > 0)
  }, [ordersData])

  const totalRevenue = monthlyRevenue.reduce((s, m) => s + m.valor, 0)
  const peakMonth = monthlyRevenue.length
    ? monthlyRevenue.reduce((max, m) => (m.valor > max.valor ? m : max))
    : null
  const maxServiceQty = servicesSold[0]?.quantidade || 1
  const totalOrders = ordersData.length

  const yTickFormatter = (v: number) => {
    if (v === 0) return 'R$0'
    if (v >= 1000) return `R$${(v / 1000).toFixed(0)}k`
    return `R$${v}`
  }

  return (
    <div className="space-y-4">
      {/* ── Faturamento Mensal ── */}
      <div className="relative bg-card rounded-2xl overflow-hidden border border-border/60 shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-amber-500" />
        <div className="p-5 pb-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Faturamento Mensal
              </p>
              <p className="text-2xl font-bold text-foreground mt-1 leading-none">
                R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">acumulado no período</p>
            </div>
            <div className="flex items-center gap-4">
              {peakMonth && peakMonth.valor > 0 && (
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                    Mês pico
                  </p>
                  <p className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                    {peakMonth.mes}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    R$ {peakMonth.valor.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                  </p>
                </div>
              )}
              <div className="p-2 rounded-xl bg-amber-500 shadow-sm shrink-0">
                <DollarSign className="h-3.5 w-3.5 text-white" />
              </div>
            </div>
          </div>
          <div className="h-px bg-border/50 mt-4 mb-0" />
        </div>

        <div className="px-2 pb-4">
          {monthlyRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyRevenue} barCategoryGap="35%" margin={{ top: 12, right: 16, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d4a85a" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#d4a85a" stopOpacity={0.45} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  strokeOpacity={0.6}
                  vertical={false}
                />
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={yTickFormatter}
                  width={54}
                />
                <Tooltip
                  content={<RevenueTooltip />}
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5, radius: 6 } as any}
                />
                <Bar
                  dataKey="valor"
                  fill="url(#revenueGrad)"
                  radius={[6, 6, 0, 0]}
                  name="Faturamento"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <DollarSign className="h-10 w-10 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">Nenhuma ordem concluída ainda</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Serviços + Status ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Serviços Mais Vendidos — ranking visual */}
        <div className="relative bg-card rounded-2xl overflow-hidden border border-border/60 shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-blue-500" />
          <div className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Serviços Mais Vendidos
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {servicesSold.length > 0
                    ? `top ${servicesSold.length} com maior demanda`
                    : 'sem dados no período'}
                </p>
              </div>
              <div className="p-2 rounded-xl bg-blue-500 shadow-sm shrink-0">
                <Package className="h-3.5 w-3.5 text-white" />
              </div>
            </div>

            <div className="h-px bg-border/50 mb-4" />

            {servicesSold.length > 0 ? (
              <div className="space-y-4">
                {servicesSold.map((service, i) => {
                  const pct = (service.quantidade / maxServiceQty) * 100
                  const color = SERVICE_COLORS[i]
                  return (
                    <div key={service.nome}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="text-[10px] font-bold shrink-0 w-5 h-5 rounded-md flex items-center justify-center"
                            style={{ backgroundColor: color + '22', color }}
                          >
                            {i + 1}
                          </span>
                          <span className="text-[13px] font-medium text-foreground truncate">
                            {service.nome}
                          </span>
                        </div>
                        <span
                          className="text-[12px] font-bold shrink-0 ml-2 tabular-nums"
                          style={{ color }}
                        >
                          {service.quantidade}×
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, backgroundColor: color, opacity: 0.75 }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Package className="h-10 w-10 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground">Nenhum serviço vendido ainda</p>
              </div>
            )}
          </div>
        </div>

        {/* Ordens por Status — donut + legenda */}
        <div className="relative bg-card rounded-2xl overflow-hidden border border-border/60 shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-violet-500" />
          <div className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Ordens por Status
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {totalOrders} {totalOrders === 1 ? 'ordem' : 'ordens'} no total
                </p>
              </div>
              <div className="p-2 rounded-xl bg-violet-500 shadow-sm shrink-0">
                <Activity className="h-3.5 w-3.5 text-white" />
              </div>
            </div>

            <div className="h-px bg-border/50 mb-3" />

            {ordersByStatus.length > 0 ? (
              <div className="flex flex-col sm:flex-row items-center gap-5">
                {/* Donut */}
                <div className="relative shrink-0" style={{ width: 152, height: 152 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ordersByStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                        startAngle={90}
                        endAngle={-270}
                      >
                        {ordersByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<StatusTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-foreground leading-none tabular-nums">
                      {totalOrders}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">ordens</span>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex-1 w-full space-y-2.5">
                  {ordersByStatus.map(item => (
                    <div key={item.name} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-[12px] text-muted-foreground truncate">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[13px] font-bold text-foreground tabular-nums">
                          {item.value}
                        </span>
                        <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-right">
                          {((item.value / totalOrders) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Activity className="h-10 w-10 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground">Nenhuma ordem cadastrada ainda</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
