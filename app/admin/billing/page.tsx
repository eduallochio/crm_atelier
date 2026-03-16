import { Header } from '@/components/layouts/header'
import { BillingMetricsGrid } from '@/components/admin/billing-metrics-grid'
import { RevenueChart } from '@/components/admin/revenue-chart'
import { InvoicesTable } from '@/components/admin/invoices-table'
import { Card } from '@/components/ui/card'

interface Invoice {
  id: string
  clientName: string
  amount: number
  status: 'pending' | 'paid' | 'overdue'
  dueDate: string
  issueDate: string
  organizationName: string
  plan: string
}

export default function AdminBillingPage() {
  // TODO: Substituir por hooks reais:
  // const { metrics } = useBillingMetrics()
  // const { revenueData } = useRevenueData()
  // const { invoices, filters, setFilters } = useInvoices()

  const metrics = [
    {
      title: 'Receita Este Mês',
      value: 'R$ 0',
      target: 'R$ 10.000',
      progress: 0,
      change: '0%',
      trend: 'up' as const,
      icon: 'DollarSign',
      color: 'green' as const,
    },
    {
      title: 'Previsão Próximo Mês',
      value: 'R$ 0',
      change: '0%',
      trend: 'up' as const,
      icon: 'TrendingUp',
      color: 'blue' as const,
    },
    {
      title: 'Faturas Pendentes',
      value: '0',
      change: '0',
      trend: 'down' as const,
      icon: 'Clock',
      color: 'yellow' as const,
    },
    {
      title: 'Faturas Vencidas',
      value: '0',
      change: '0',
      trend: 'down' as const,
      icon: 'AlertCircle',
      color: 'red' as const,
    },
  ]

  const revenueData = {
    monthly: [
      { month: 'Jan', revenue: 0, forecast: 0 },
      { month: 'Fev', revenue: 0, forecast: 0 },
      { month: 'Mar', revenue: 0, forecast: 0 },
      { month: 'Abr', revenue: 0, forecast: 0 },
      { month: 'Mai', revenue: 0, forecast: 0 },
      { month: 'Jun', revenue: 0, forecast: 0 },
      { month: 'Jul', revenue: 0, forecast: 0 },
      { month: 'Ago', revenue: 0, forecast: 0 },
      { month: 'Set', revenue: 0, forecast: 0 },
      { month: 'Out', revenue: 0, forecast: 0 },
      { month: 'Nov', revenue: 0, forecast: 0 },
      { month: 'Dez', revenue: 0, forecast: 0 },
    ],
    paymentSuccess: {
      successful: 0,
      failed: 0,
      pending: 0,
    },
  }

  const invoices: Invoice[] = []

  return (
    <div>
      <Header
        title="Faturamento Global"
        description="Gestão financeira e faturamento"
      />

      <div className="p-6 space-y-6">
        {/* Métricas Principais */}
        <BillingMetricsGrid metrics={metrics} />

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Receita Mensal */}
          <RevenueChart data={revenueData.monthly} />

          {/* Taxa de Sucesso de Pagamentos */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Taxa de Sucesso de Pagamentos</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Pagamentos Bem-Sucedidos</span>
                  <span className="text-sm text-muted-foreground">
                    {revenueData.paymentSuccess.successful} (0%)
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: '0%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Pagamentos Falhados</span>
                  <span className="text-sm text-muted-foreground">
                    {revenueData.paymentSuccess.failed} (0%)
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: '0%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Pagamentos Pendentes</span>
                  <span className="text-sm text-muted-foreground">
                    {revenueData.paymentSuccess.pending} (0%)
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 rounded-full" style={{ width: '0%' }} />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabela de Faturas */}
        <InvoicesTable invoices={invoices} />
      </div>
    </div>
  )
}
