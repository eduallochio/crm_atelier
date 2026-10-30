'use client'

import { useQuery } from '@tanstack/react-query'
import { Header } from '@/components/layouts/header'
import { BillingMetricsGrid } from '@/components/admin/billing-metrics-grid'
import { RevenueChart } from '@/components/admin/revenue-chart'
import { InvoicesTable } from '@/components/admin/invoices-table'
import { Card } from '@/components/ui/card'
import { Wallet } from 'lucide-react'

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

interface Invoice {
  id: string
  organizationName: string
  plan: string
  amount: number
  netAmount: number
  status: 'paid' | 'pending' | 'overdue' | 'failed'
  dueDate: string
  paidDate: string | null
  invoiceUrl: string | null
}

// Taxa de mensageria do Asaas (SMS/WhatsApp de notificação) — cobrada à parte,
// fora do objeto de pagamento da API, então não dá pra buscar automaticamente.
// Valor informado manualmente por Eduardo com base no painel Asaas.
const MESSAGING_FEE_PER_PAYMENT = 0.99

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

function useInvoicesData() {
  return useQuery<Invoice[]>({
    queryKey: ['admin-invoices'],
    queryFn: async () => {
      const res = await fetch('/api/admin/invoices')
      if (!res.ok) throw new Error('Erro ao carregar faturas')
      return res.json()
    },
    staleTime: 60_000,
  })
}

export default function AdminBillingPage() {
  const { data: dashboard, isLoading: dashLoading } = useBillingData()
  const { data: analytics, isLoading: analyticsLoading } = useAnalyticsData()
  const { data: invoices, isLoading: invoicesLoading } = useInvoicesData()

  const isLoading = dashLoading || analyticsLoading || invoicesLoading

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

  const paidInvoices = (invoices ?? []).filter((inv) => inv.status === 'paid')
  const totalReceivedNet = paidInvoices.reduce((sum, inv) => sum + inv.netAmount, 0)
  const totalMessagingFees = paidInvoices.length * MESSAGING_FEE_PER_PAYMENT
  const totalReceivedAfterMessaging = totalReceivedNet - totalMessagingFees

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

            <Card className="p-6 bg-gradient-to-br from-emerald-50 to-card dark:from-emerald-950/20 dark:to-card border-emerald-200 dark:border-emerald-900">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                  <Wallet className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Total Recebido (líquido, já com taxa Asaas descontada)</p>
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                    R$ {totalReceivedAfterMessaging.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    R$ {totalReceivedNet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} pós-processamento
                    {' − '}
                    R$ {totalMessagingFees.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de mensageria
                    {' '}({paidInvoices.length} {paidInvoices.length === 1 ? 'cobrança' : 'cobranças'} × R$ {MESSAGING_FEE_PER_PAYMENT.toFixed(2)})
                  </p>
                </div>
              </div>
            </Card>

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

            <InvoicesTable invoices={invoices ?? []} />
          </>
        )}
      </div>
    </div>
  )
}
