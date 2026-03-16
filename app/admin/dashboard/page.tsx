'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, Users, DollarSign, BarChart3, AlertCircle } from 'lucide-react'
import { AdminMetricsCard } from '@/components/admin/admin-metrics-card'
import { AdminGrowthChart } from '@/components/admin/admin-growth-chart'
import { AdminRevenueChart } from '@/components/admin/admin-revenue-chart'
import { AdminPlanDistribution } from '@/components/admin/admin-plan-distribution'
import { AdminRecentActivity } from '@/components/admin/admin-recent-activity'

interface DashboardMetrics {
  totalOrganizations: number
  activeOrganizations: number
  trialOrganizations: number
  cancelledOrganizations: number
  freePlanCount: number
  proPlanCount: number
  newThisWeek: number
  newThisMonth: number
  totalUsers: number
  activeOrgsThisWeek: number
  mrrTotal: number
  churnRate: number
}

interface MonthlyData {
  month: string
  users: number
  revenue: number
  growth: number
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [monthly, setMonthly] = useState<MonthlyData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/dashboard').then((r) => r.json()),
      fetch('/api/admin/analytics').then((r) => r.json()),
    ])
      .then(([dashData, analyticsData]) => {
        setMetrics(dashData)
        if (Array.isArray(analyticsData.monthly)) setMonthly(analyticsData.monthly)
      })
      .catch((err) => {
        console.error('Erro ao carregar dashboard admin:', err)
        setError('Erro ao carregar dashboard')
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 dark:text-gray-400">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || !metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400">{error || 'Erro ao carregar dashboard'}</p>
        </div>
      </div>
    )
  }

  const conversionRate = metrics.totalOrganizations > 0
    ? (metrics.proPlanCount / metrics.totalOrganizations) * 100
    : 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Administrativo</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Visão geral da plataforma e métricas principais</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminMetricsCard
          title="Total de Organizações"
          value={metrics.totalOrganizations.toString()}
          icon={Users}
          trend={metrics.newThisMonth}
          trendLabel="este mês"
          color="blue"
        />
        <AdminMetricsCard
          title="Organizações Ativas"
          value={metrics.activeOrganizations.toString()}
          icon={TrendingUp}
          trend={metrics.newThisWeek}
          trendLabel="esta semana"
          color="green"
        />
        <AdminMetricsCard
          title="Em Trial"
          value={metrics.trialOrganizations.toString()}
          icon={BarChart3}
          color="yellow"
        />
        <AdminMetricsCard
          title="Canceladas"
          value={metrics.cancelledOrganizations.toString()}
          icon={AlertCircle}
          trend={-Math.round(metrics.churnRate)}
          trendLabel="taxa de rotatividade"
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminMetricsCard
          title="MRR (Receita Recorrente)"
          value={`R$ ${metrics.mrrTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          color="green"
          subtext={`${metrics.proPlanCount} clientes Pro`}
        />
        <AdminMetricsCard
          title="Taxa de Conversão"
          value={`${conversionRate.toFixed(1)}%`}
          icon={TrendingUp}
          color="purple"
          subtext={`${metrics.proPlanCount} de ${metrics.totalOrganizations}`}
        />
        <AdminMetricsCard
          title="Novos Assinantes"
          value={metrics.newThisMonth.toString()}
          icon={Users}
          trendLabel="este mês"
          color="blue"
        />
        <AdminMetricsCard
          title="Total de Usuários"
          value={metrics.totalUsers.toString()}
          icon={Users}
          subtext={`${metrics.activeOrgsThisWeek} organizações`}
          color="indigo"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdminGrowthChart monthly={monthly} />
        <AdminRevenueChart monthly={monthly} mrrTotal={metrics.mrrTotal} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdminPlanDistribution
          freePlanCount={metrics.freePlanCount}
          proPlanCount={metrics.proPlanCount}
        />
        <AdminRecentActivity />
      </div>
    </div>
  )
}
