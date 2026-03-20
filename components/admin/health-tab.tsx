'use client'

import { useEffect, useState } from 'react'
import {
  AlertTriangle, CheckCircle2, Info, XCircle,
  Activity, Clock, ShoppingBag, Users, DollarSign,
  TrendingUp, AlertCircle, BarChart3,
} from 'lucide-react'

interface HealthData {
  org: {
    id: string
    name: string
    plan: string
    state: string
    created_at: string
    days_since_creation: number
  }
  health: {
    score: number
    status: 'healthy' | 'at_risk' | 'critical'
    alerts: { type: 'warning' | 'danger' | 'info' | 'success'; message: string }[]
  }
  metrics: {
    clients_count: number
    orders_count: number
    orders_7d: number
    orders_30d: number
    orders_pending: number
    orders_in_progress: number
    orders_done: number
    users_count: number
    revenue_30d: number
    last_order_at: string | null
    last_client_at: string | null
  }
  limits: {
    clients: { used: number; max: number; pct: number }
    orders: { used: number; max: number; pct: number }
  } | null
  client_growth: { label: string; new_clients: number }[]
  recent_orders: {
    id: string
    status: string
    created_at: string
    total_price: number
    client_name: string | null
    service_name: string | null
  }[]
}

const STATUS_ORDER_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
}

const STATUS_ORDER_COLORS: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  em_andamento: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  concluido: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelado: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

function AlertIcon({ type }: { type: string }) {
  if (type === 'danger')  return <XCircle      className="w-4 h-4 text-red-500 shrink-0" />
  if (type === 'warning') return <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />
  if (type === 'info')    return <Info          className="w-4 h-4 text-blue-500 shrink-0" />
  return <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
}

function alertBg(type: string) {
  if (type === 'danger')  return 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900'
  if (type === 'warning') return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-900'
  if (type === 'info')    return 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900'
  return 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900'
}

function HealthGauge({ score, status }: { score: number; status: string }) {
  const color =
    status === 'healthy'  ? 'text-green-500'  :
    status === 'at_risk'  ? 'text-yellow-500' : 'text-red-500'

  const barColor =
    status === 'healthy'  ? 'bg-green-500'  :
    status === 'at_risk'  ? 'bg-yellow-500' : 'bg-red-500'

  const label =
    status === 'healthy'  ? 'Saudável'    :
    status === 'at_risk'  ? 'Em risco'    : 'Crítico'

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 flex flex-col items-center gap-4">
      <div className="flex items-center gap-2">
        <Activity className="w-5 h-5 text-gray-500" />
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Score de Saúde</span>
      </div>
      <div className={`text-6xl font-bold ${color}`}>{score}</div>
      <div className="w-full">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>0</span>
          <span>100</span>
        </div>
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
      <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
        status === 'healthy'  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
        status === 'at_risk'  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      }`}>{label}</span>
    </div>
  )
}

export function HealthTab({ organizationId }: { organizationId: string }) {
  const [data, setData] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/admin/organizations/${organizationId}/health`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error)
        setData(d)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [organizationId])

  if (loading) {
    return (
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="h-40 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="mt-6 flex items-center gap-2 text-red-500">
        <AlertCircle className="w-5 h-5" />
        <span className="text-sm">{error ?? 'Erro ao carregar dados de saúde'}</span>
      </div>
    )
  }

  const { health, metrics, limits, client_growth, recent_orders } = data
  const maxGrowth = client_growth.reduce((acc, g) => Math.max(acc, g.new_clients), 1)

  return (
    <div className="mt-6 space-y-6">
      {/* Top row: gauge + alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <HealthGauge score={health.score} status={health.status} />

        {/* Alertas */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Alertas
          </h3>
          <div className="space-y-2">
            {health.alerts.map((alert, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${alertBg(alert.type)}`}>
                <AlertIcon type={alert.type} />
                <span className="text-sm text-gray-700 dark:text-gray-300">{alert.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: <Users className="w-4 h-4" />, label: 'Clientes', value: metrics.clients_count, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' },
          { icon: <ShoppingBag className="w-4 h-4" />, label: 'Ordens total', value: metrics.orders_count, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/30' },
          { icon: <Clock className="w-4 h-4" />, label: 'Ordens (7 dias)', value: metrics.orders_7d, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/30' },
          { icon: <DollarSign className="w-4 h-4" />, label: 'Receita 30d', value: metrics.revenue_30d > 0 ? `R$ ${metrics.revenue_30d.toFixed(2)}` : 'R$ 0,00', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950/30' },
        ].map(card => (
          <div key={card.label} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center ${card.color} mb-3`}>
              {card.icon}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Status de ordens */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" /> Distribuição de Ordens
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Pendentes',     value: metrics.orders_pending,     color: 'bg-yellow-500' },
            { label: 'Em andamento',  value: metrics.orders_in_progress, color: 'bg-blue-500' },
            { label: 'Concluídas',    value: metrics.orders_done,        color: 'bg-green-500' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <div className={`w-2 h-2 rounded-full ${s.color}`} />
                <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Limite do plano free */}
      {limits && (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Limites do Plano Free</h3>
          <div className="space-y-4">
            {[
              { label: 'Clientes', ...limits.clients },
              { label: 'Ordens',   ...limits.orders },
            ].map(limit => (
              <div key={limit.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">{limit.label}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {limit.used} / {limit.max} <span className="text-gray-400">({limit.pct}%)</span>
                  </span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      limit.pct >= 90 ? 'bg-red-500' :
                      limit.pct >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${limit.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Crescimento de clientes (últimos 6 meses) */}
      {client_growth.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Novos Clientes (últimos 6 meses)
          </h3>
          <div className="flex items-end gap-2 h-28">
            {client_growth.map(g => {
              const pct = (g.new_clients / maxGrowth) * 100
              return (
                <div key={g.label} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{g.new_clients}</span>
                  <div className="w-full flex items-end" style={{ height: 72 }}>
                    <div
                      className="w-full bg-blue-500 rounded-t transition-all"
                      style={{ height: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 truncate w-full text-center">{g.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Ordens recentes */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Últimas Ordens</h3>
        {recent_orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Cliente</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Serviço</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Valor</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Data</th>
                </tr>
              </thead>
              <tbody>
                {recent_orders.map(order => (
                  <tr key={order.id} className="border-b border-gray-50 dark:border-gray-800/40 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="py-2 px-3 text-gray-900 dark:text-white">{order.client_name ?? '—'}</td>
                    <td className="py-2 px-3 text-gray-600 dark:text-gray-400">{order.service_name ?? '—'}</td>
                    <td className="py-2 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_ORDER_COLORS[order.status] ?? ''}`}>
                        {STATUS_ORDER_LABELS[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-medium text-gray-900 dark:text-white">
                      {order.total_price > 0 ? `R$ ${order.total_price.toFixed(2)}` : '—'}
                    </td>
                    <td className="py-2 px-3 text-right text-gray-500 dark:text-gray-400">
                      {new Date(order.created_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-400 py-6 text-sm">Nenhuma ordem registrada</p>
        )}
      </div>
    </div>
  )
}
