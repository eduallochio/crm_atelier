'use client'

import { useEffect, useState, useCallback } from 'react'
import { TrendingUp, Users, FileText, Package, RefreshCw } from 'lucide-react'
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface UsageTabProps {
  organization: {
    id: string
    name: string
    plan: 'free' | 'pro'
    created_at: string
  }
}

interface UsageData {
  totals: {
    clients: number
    orders: number
    services: number
    users: number
    ordersThisMonth: number
  }
  monthly: { month: string; newClients: number; newOrders: number }[]
  ordersByStatus: Record<string, number>
}

const STATUS_LABELS: Record<string, string> = {
  pendente:     'Pendente',
  em_andamento: 'Em andamento',
  concluido:    'Concluído',
  cancelado:    'Cancelado',
}

const STATUS_COLORS: Record<string, string> = {
  pendente:     'bg-yellow-500/20 text-yellow-400',
  em_andamento: 'bg-blue-500/20 text-blue-400',
  concluido:    'bg-emerald-500/20 text-emerald-400',
  cancelado:    'bg-red-500/20 text-red-400',
}

export function UsageTab({ organization }: UsageTabProps) {
  const [data, setData] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUsage = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/organizations/${organization.id}/usage`)
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [organization.id])

  useEffect(() => { fetchUsage() }, [fetchUsage])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        Carregando dados de uso...
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        Erro ao carregar dados de uso.
      </div>
    )
  }

  const { totals, monthly, ordersByStatus } = data

  return (
    <div className="space-y-6">
      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total de Clientes',  value: totals.clients,        icon: Users,    color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-100 dark:bg-blue-950' },
          { label: 'Total de Ordens',    value: totals.orders,         icon: FileText, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-950' },
          { label: 'Serviços Ativos',    value: totals.services,       icon: Package,  color: 'text-green-600 dark:text-green-400',  bg: 'bg-green-100 dark:bg-green-950' },
          { label: 'Ordens este mês',    value: totals.ordersThisMonth, icon: TrendingUp, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-950' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 ${bg} rounded-lg`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gráfico de crescimento mensal */}
      {monthly.length > 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Crescimento Mensal (últimos 6 meses)
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthly} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="newClients" name="Novos Clientes" fill="#3b82f6" radius={[4,4,0,0]} />
              <Bar dataKey="newOrders"  name="Novas Ordens"   fill="#8b5cf6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 text-center text-gray-500">
          Sem dados de crescimento mensal ainda.
        </div>
      )}

      {/* Ordens por status */}
      {Object.keys(ordersByStatus).length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Ordens por Status
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(ordersByStatus).map(([status, count]) => (
              <div key={status} className={`rounded-lg px-4 py-3 ${STATUS_COLORS[status] ?? 'bg-zinc-500/20 text-zinc-400'}`}>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-sm opacity-80">{STATUS_LABELS[status] ?? status}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
