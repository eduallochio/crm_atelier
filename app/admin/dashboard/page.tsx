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

// Função auxiliar para dados vazios em desenvolvimento
function getMockMetrics(): DashboardMetrics {
  return {
    totalOrganizations: 0,
    activeOrganizations: 0,
    trialOrganizations: 0,
    cancelledOrganizations: 0,
    freePlanCount: 0,
    proPlanCount: 0,
    enterprisePlanCount: 0,
    newThisWeek: 0,
    newThisMonth: 0,
    totalUsers: 0,
    activeOrgsThisWeek: 0,
    mrrTotal: 0,
    churnRate: 0,
  }
}

export default function AdminDashboard() {
  const supabase = createClient()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // Buscar organizações diretamente
        const { data: orgs, error: orgsError } = await supabase
          .from('organizations')
          .select('id, plan, state, created_at')

        if (orgsError) {
          // Tabela ainda não existe - usar dados demo
          console.log('📊 Usando dados demo (tabela organizations não encontrada)')
          setMetrics(getMockMetrics())
          setLoading(false)
          return
        }

        const organizations = orgs || []
        
        // Calcular métricas manualmente
        const totalOrganizations = organizations.length
        const activeOrganizations = organizations.filter(o => o.state === 'active').length
        const trialOrganizations = organizations.filter(o => o.state === 'trial').length
        const cancelledOrganizations = organizations.filter(o => o.state === 'cancelled').length
        
        const freePlanCount = organizations.filter(o => o.plan === 'free').length
        const proPlanCount = organizations.filter(o => o.plan === 'pro').length
        const enterprisePlanCount = organizations.filter(o => o.plan === 'enterprise').length

        // Calcular novos desta semana/mês
        const now = Date.now()
        const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000
        const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000
        
        const newThisWeek = organizations.filter(o => 
          new Date(o.created_at).getTime() >= oneWeekAgo
        ).length
        const newThisMonth = organizations.filter(o => 
          new Date(o.created_at).getTime() >= oneMonthAgo
        ).length

        // Calcular MRR
        const mrrTotal = organizations
          .filter(o => o.state === 'active')
          .reduce((sum, org) => {
            const planPrice = org.plan === 'pro' ? 59.90 : org.plan === 'enterprise' ? 299.90 : 0
            return sum + planPrice
          }, 0)

        // Buscar total de usuários
        const { count: totalUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })

        // Buscar organizações com usuários
        const { data: activeProfiles } = await supabase
          .from('profiles')
          .select('organization_id')
          .not('organization_id', 'is', null)

        const activeOrgsThisWeek = new Set(
          (activeProfiles || []).map(p => p.organization_id)
        ).size

        // Calcular churn
        const cancelledRecently = organizations.filter(o => 
          o.state === 'cancelled' && 
          new Date(o.created_at).getTime() >= oneMonthAgo
        ).length
        const churnRate = totalOrganizations > 0 
          ? (cancelledRecently / totalOrganizations) * 100 
          : 0

        setMetrics({
          totalOrganizations,
          activeOrganizations,
          trialOrganizations,
          cancelledOrganizations,
          freePlanCount,
          proPlanCount,
          enterprisePlanCount,
          newThisWeek,
          newThisMonth,
          totalUsers: totalUsers || 0,
          activeOrgsThisWeek,
          mrrTotal,
          churnRate,
        })
      } catch (err) {
        console.log('📊 Usando dados demo:', err instanceof Error ? err.message : 'Erro desconhecido')
        // Usar dados mock em caso de erro
        setMetrics(getMockMetrics())
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
          subtext={`${metrics.activeOrgsThisWeek} organizações`}
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
