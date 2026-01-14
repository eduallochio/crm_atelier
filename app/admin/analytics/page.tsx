import { Header } from '@/components/layouts/header'
import { GrowthChart } from '@/components/admin/growth-chart'
import { ChurnAnalysis } from '@/components/admin/churn-analysis'
import { CohortAnalysis } from '@/components/admin/cohort-analysis'
import { TopClients } from '@/components/admin/top-clients'
import { FeatureUsage } from '@/components/admin/feature-usage'
import { Button } from '@/components/ui/button'
import { Download, Mail, Calendar } from 'lucide-react'

export default function AdminAnalyticsPage() {
  // TODO: Substituir por hooks reais:
  // const { growthData } = useGrowthData()
  // const { churnData } = useChurnData()
  // const { cohortData } = useCohortData()
  // const { topClients } = useTopClients()
  // const { featureUsage } = useFeatureUsage()

  const growthData = {
    monthly: [
      { month: 'Jan', users: 0, revenue: 0, growth: 0 },
      { month: 'Fev', users: 0, revenue: 0, growth: 0 },
      { month: 'Mar', users: 0, revenue: 0, growth: 0 },
      { month: 'Abr', users: 0, revenue: 0, growth: 0 },
      { month: 'Mai', users: 0, revenue: 0, growth: 0 },
      { month: 'Jun', users: 0, revenue: 0, growth: 0 },
    ],
  }

  const churnData = {
    rate: 0,
    trend: 'down' as const,
    reasons: [
      { reason: 'Preço alto', count: 0, percentage: 0 },
      { reason: 'Falta de recursos', count: 0, percentage: 0 },
      { reason: 'Mudança de negócio', count: 0, percentage: 0 },
      { reason: 'Satisfeito com período gratuito', count: 0, percentage: 0 },
      { reason: 'Concorrência', count: 0, percentage: 0 },
    ],
  }

  const cohortData: Array<{
    cohort: string
    month0: number
    month1: number
    month2: number
    month3: number
    month4: number
    month5: number
  }> = []

  const topClients: Array<{
    id: string
    name: string
    plan: string
    revenue: number
    growth: number
  }> = []

  const featureUsage = [
    { feature: 'Gestão de Clientes', free: 0, pro: 0, enterprise: 0 },
    { feature: 'Ordens de Serviço', free: 0, pro: 0, enterprise: 0 },
    { feature: 'Relatórios', free: 0, pro: 0, enterprise: 0 },
    { feature: 'API Access', free: 0, pro: 0, enterprise: 0 },
    { feature: 'Multi-usuários', free: 0, pro: 0, enterprise: 0 },
  ]

  return (
    <div>
      <Header
        title="Analytics"
        description="Relatórios e análises avançadas"
      />

      <div className="p-6 space-y-6">
        {/* Ações de Exportação */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          <div className="flex-1" />
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Agendar Relatório
          </Button>
          <Button variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            Enviar por Email
          </Button>
        </div>

        {/* Crescimento Mensal */}
        <GrowthChart data={growthData.monthly} />

        {/* Análise de Churn */}
        <ChurnAnalysis data={churnData} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Clientes */}
          <TopClients clients={topClients} />

          {/* Uso de Features */}
          <FeatureUsage features={featureUsage} />
        </div>

        {/* Análise de Cohorts */}
        <CohortAnalysis data={cohortData} />
      </div>
    </div>
  )
}
