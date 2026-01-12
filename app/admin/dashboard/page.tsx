'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, Users, DollarSign, BarChart3, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
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
  enterprisePlanCount: number
  newThisWeek: number
  newThisMonth: number
  totalUsers: number
  activeOrgsThisWeek: number
  mrrTotal: number
  churnRate: number
}

export default function AdminDashboard() {
  const supabase = createClient()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // Buscar dados da view de métricas globais
        const { data, error: queryError } = await supabase
          .from('admin_global_metrics')
          .select('*')
          .single()

        if (queryError) throw queryError

        // Buscar MRR total
        const { data: mrrData, error: mrrError } = await supabase
          .from('organizations')
          .select('plan')
          .eq('status', 'active')

        if (mrrError) throw mrrError

        const mrrTotal = (mrrData || []).reduce((sum, org) => {
          const planPrice = org.plan === 'pro' ? 59.90 : org.plan === 'enterprise' ? 299.90 : 0
          return sum + planPrice
        }, 0)

        // Calcular churn rate (organizações canceladas nos últimos 30 dias)
        const { data: cancelledData, error: churnError } = await supabase
          .from('organizations')
          .select('id')
          .eq('status', 'cancelled')
          .gte('updated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

        if (churnError) throw churnError

        const churnRate = data.total_organizations > 0 
          ? (cancelledData?.length || 0) / data.total_organizations * 100 
          : 0

        setMetrics({
          totalOrganizations: data.total_organizations || 0,
          activeOrganizations: data.active_organizations || 0,
          trialOrganizations: data.trial_organizations || 0,
          cancelledOrganizations: data.cancelled_organizations || 0,
          freePlanCount: data.free_plan_count || 0,
          proPlanCount: data.pro_plan_count || 0,
          enterprisePlanCount: data.enterprise_plan_count || 0,
          newThisWeek: data.new_this_week || 0,
          newThisMonth: data.new_this_month || 0,
          totalUsers: data.total_users || 0,
          activeOrgsThisWeek: data.active_orgs_this_week || 0,
          mrrTotal,
          churnRate,
        })
      } catch (err) {
        console.error('Erro ao buscar métricas:', err)
        setError('Falha ao carregar métricas do dashboard')
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
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
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Administrativo</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Visão geral da plataforma e métricas principais</p>
      </div>

      {/* Linha 1 - Métricas de Organizações */}
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
          trendLabel="churn rate"
          color="red"
        />
      </div>

      {/* Linha 2 - Métricas Financeiras */}
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
          subtext={`${metrics.activeOrgsThisWeek} orgs ativas esta semana`}
          color="indigo"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdminGrowthChart 
          totalOrganizations={metrics.totalOrganizations}
          activeOrganizations={metrics.activeOrganizations}
        />
        <AdminRevenueChart mrrTotal={metrics.mrrTotal} />
      </div>

      {/* Distribuição de Planos e Atividade Recente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdminPlanDistribution
          freePlanCount={metrics.freePlanCount}
          proPlanCount={metrics.proPlanCount}
          enterprisePlanCount={metrics.enterprisePlanCount}
        />
        <AdminRecentActivity />
      </div>
    </div>
  )
}
