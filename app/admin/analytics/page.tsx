'use client'

import { useEffect, useState } from 'react'
import { GrowthChart } from '@/components/admin/growth-chart'
import { ChurnAnalysis } from '@/components/admin/churn-analysis'
import { TopClients } from '@/components/admin/top-clients'

interface AnalyticsData {
  monthly: { month: string; users: number; revenue: number; growth: number }[]
  planDistribution: Record<string, number>
  churn: {
    rate: number
    trend: 'up' | 'down'
    cancelled: number
    total: number
    reasons: { reason: string; count: number; percentage: number }[]
  }
  topOrgs: {
    id: string
    name: string
    plan: string
    revenue: number
    clients_count: number
    orders_count: number
    growth: number
  }[]
}

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-gray-400', pro: 'bg-blue-500',
}
const PLAN_LABELS: Record<string, string> = {
  free: 'Free', pro: 'Pro',
}

export default function AdminAnalyticsPage() {
  const [data, setData]       = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const totalOrgs = data
    ? Object.values(data.planDistribution).reduce((a, b) => a + b, 0)
    : 0

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!data) {
    return <div className="text-center py-20 text-gray-400">Erro ao carregar dados de analytics</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Análises</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Dados reais do sistema</p>
      </div>

      {/* Distribuicao de Planos */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Distribuicao de Planos</h3>
        <div className="flex items-center gap-1 mb-4 h-8 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
          {Object.entries(data.planDistribution).map(([plan, count]) => {
            const pct = totalOrgs > 0 ? (count / totalOrgs) * 100 : 0
            return pct > 0 ? (
              <div
                key={plan}
                className={`${PLAN_COLORS[plan] || 'bg-gray-400'} h-full flex items-center justify-center text-xs text-white font-medium transition-all`}
                style={{ width: `${pct}%` }}
                title={`${PLAN_LABELS[plan] || plan}: ${count}`}
              >
                {pct > 8 ? `${Math.round(pct)}%` : ''}
              </div>
            ) : null
          })}
        </div>
        <div className="flex flex-wrap items-center gap-6">
          {Object.entries(data.planDistribution).map(([plan, count]) => (
            <div key={plan} className="flex items-center gap-2 text-sm">
              <div className={`w-3 h-3 rounded-full ${PLAN_COLORS[plan] || 'bg-gray-400'}`} />
              <span className="text-gray-600 dark:text-gray-400">{PLAN_LABELS[plan] || plan}:</span>
              <span className="font-semibold text-gray-900 dark:text-white">{count}</span>
            </div>
          ))}
          <div className="text-sm text-gray-500 dark:text-gray-400 ml-auto">
            Total: <strong className="text-gray-900 dark:text-white">{totalOrgs}</strong> organizacoes
          </div>
        </div>
      </div>

      {/* Crescimento Mensal */}
      <GrowthChart data={data.monthly} />

      {/* Churn + Top Orgs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChurnAnalysis data={data.churn} />
        <TopClients clients={data.topOrgs.map((o) => ({
          id:      o.id,
          name:    o.name,
          plan:    PLAN_LABELS[o.plan] || o.plan,
          revenue: o.revenue,
          growth:  o.growth,
        }))} />
      </div>

      {/* Tabela Top Orgs */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Organizacoes por Atividade</h3>
        {data.topOrgs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">#</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Organizacao</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Plano</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Clientes</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Ordens</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">MRR</th>
                </tr>
              </thead>
              <tbody>
                {data.topOrgs.map((org, i) => (
                  <tr key={org.id} className="border-b border-gray-50 dark:border-gray-800/40 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="py-3 px-4 text-gray-400 font-mono text-xs">{i + 1}</td>
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{org.name}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium text-white ${PLAN_COLORS[org.plan] || 'bg-gray-400'}`}>
                        {PLAN_LABELS[org.plan] || org.plan}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">{org.clients_count}</td>
                    <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">{org.orders_count}</td>
                    <td className="py-3 px-4 text-right font-medium text-gray-900 dark:text-white">
                      {org.revenue > 0 ? `R$ ${org.revenue.toFixed(2)}` : 'Gratis'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-400 py-8">Nenhuma organizacao encontrada</p>
        )}
      </div>
    </div>
  )
}
