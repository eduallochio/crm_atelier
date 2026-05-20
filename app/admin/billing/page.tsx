'use client'

import { useQuery } from '@tanstack/react-query'
import { Header } from '@/components/layouts/header'
import { BillingMetricsGrid } from '@/components/admin/billing-metrics-grid'
import { RevenueChart } from '@/components/admin/revenue-chart'
import { InvoicesTable } from '@/components/admin/invoices-table'
import { Card } from '@/components/ui/card'

interface DashboardData {
  totalOrganizations: number
  activeOrganizations: number
  trialOrganizations: number
  cancelledOrganizations: number
  freePlanCount: number
  proPlanCount: number
  newThisMonth: number
  mrrTotal: number
  churnRate: number
  planPrices: Record<string, number>
}

interface AnalyticsData {
  monthly: { month: string; users: number; revenue: number; growth: number }[]
  churn: { rate: number; cancelled: number; total: number }
}

function useBillingData() {
  return useQuery<DashboardData>({
    queryKey: ['admin-billing-dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/admin/dashboard')
      if (!res.ok) throw new Error('Erro ao carregar dados')
      return res.json()
    },
    staleTime: 60_000,
  })
}

function useAnalyticsData() {
  return useQuery<AnalyticsData>({
    queryKey: ['admin-billing-analytics'],
    queryFn: async () => {
      const res = await fetch('/api/admin/analytics')
      if (!res.ok) throw new Error('Erro ao carregar analytics')
      return res.json()
    },
    staleTime: 60_000,
  })
}

export default function AdminBillingPage() {
  const { data: dashboard, isLoading: dashLoading } = useBillingData()
  const { data: analytics, isLoading: analyticsLoading } = useAnalyticsData()

  const isLoading = dashLoading || analyticsLoading

  const metrics = [
    {
      title: 'MRR',
      value: dashboard ? `R$ ${dashboard.mrrTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0',
      change: `${dashboard?.proPlanCount ?? 0} org pro`,
      trend: 'up' as const,
      icon: 'DollarSign',
      color: 'green' as const,
    },
    {
      title: 'Novas Este Mês',
      value: String(dashboard?.newThisMonth ?? 0),
      change: `${dashboard?.totalOrganizations ?? 0} total`,
      trend: 'up' as const,
      icon: 'TrendingUp',
      color: 'blue' as const,
    },
    {
      title: 'Orgs Ativas',
      value: String(dashboard?.activeOrganizations ?? 0),
      change: `${dashboard?.trialOrganizations ?? 0} em trial`,
      trend: 'up' as const,
      icon: 'Clock',
      color: 'yellow' as const,
    },
    {
      title: 'Churn Rate',
      value: `${dashboard?.churnRate ?? 0}%`,
      change: `${dashboard?.cancelledOrganizations ?? 0} canceladas`,
      trend: 'down' as const,
      icon: 'AlertCircle',
      color: 'red' as const,
    },
  ]

  const revenueChartData = (analytics?.monthly ?? []).map(m => ({
    month: m.month,
    revenue: m.revenue,
    forecast: 0,
  }))

  const churn = analytics?.churn
  const churnTotal = churn?.total ?? 0
  const churnCancelled = churn?.cancelled ?? 0
  const churnActive = churnTotal - churnCancelled
  const pctActive    = churnTotal > 0 ? Math.round((churnActive    / churnTotal) * 100) : 0
  const pctCancelled = churnTotal > 0 ? Math.round((churnCancelled / churnTotal) * 100) : 0

  return (
    <div>
      <Header title="Faturamento Global" description="Gestão financeira e faturamento" />

      <div className="p-6 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <BillingMetricsGrid metrics={metrics} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RevenueChart data={revenueChartData} />

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Distribuição de Status</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Organizações Ativas</span>
                      <span className="text-sm text-muted-foreground">{churnActive} ({pctActive}%)</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pctActive}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Plano Free</span>
                      <span className="text-sm text-muted-foreground">
                        {dashboard?.freePlanCount ?? 0} ({churnTotal > 0 ? Math.round(((dashboard?.freePlanCount ?? 0) / churnTotal) * 100) : 0}%)
                      </span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-400 rounded-full transition-all"
                        style={{ width: churnTotal > 0 ? `${Math.round(((dashboard?.freePlanCount ?? 0) / churnTotal) * 100)}%` : '0%' }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Canceladas</span>
                      <span className="text-sm text-muted-foreground">{churnCancelled} ({pctCancelled}%)</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${pctCancelled}%` }} />
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <InvoicesTable invoices={[]} />
          </>
        )}
      </div>
    </div>
  )
}
