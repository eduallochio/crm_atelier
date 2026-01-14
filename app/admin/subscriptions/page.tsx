import { Header } from '@/components/dashboard/header'
import { PlanCard } from '@/components/admin/plan-card'
import { ConversionFunnel } from '@/components/admin/conversion-funnel'
import { PlanStatsGrid } from '@/components/admin/plan-stats-grid'
import { Package, TrendingUp, Users, DollarSign } from 'lucide-react'

export default function AdminSubscriptionsPage() {
  // Mock data - em produção viria de hooks
  const plans = [
    {
      id: 'free',
      name: 'Free',
      color: 'gray',
      subscribers: 145,
      revenue: 0,
      conversionRate: 0,
      averageLifetime: '45 dias',
      features: ['Até 50 clientes', 'Ordens básicas', 'Suporte por email'],
    },
    {
      id: 'pro',
      name: 'Pro',
      color: 'blue',
      price: 99,
      subscribers: 38,
      revenue: 3762,
      conversionRate: 20.8,
      averageLifetime: '8 meses',
      features: ['Clientes ilimitados', 'Ordens avançadas', 'Suporte prioritário', 'Analytics'],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      color: 'purple',
      price: 299,
      subscribers: 7,
      revenue: 2093,
      conversionRate: 15.4,
      averageLifetime: '14 meses',
      features: [
        'Tudo do Pro',
        'Multi-usuários',
        'API Access',
        'Suporte dedicado',
        'SLA garantido',
      ],
    },
  ]

  const conversionData = {
    trial: 52,
    free: 145,
    pro: 38,
    enterprise: 7,
  }

  const stats = [
    {
      title: 'Total de Assinantes',
      value: '190',
      change: '+12.5%',
      trend: 'up' as const,
      icon: Users,
      color: 'blue',
    },
    {
      title: 'MRR Total',
      value: 'R$ 5.855',
      change: '+8.3%',
      trend: 'up' as const,
      icon: DollarSign,
      color: 'green',
    },
    {
      title: 'Taxa Conversão Free→Pro',
      value: '20.8%',
      change: '+2.1%',
      trend: 'up' as const,
      icon: TrendingUp,
      color: 'purple',
    },
    {
      title: 'Lifetime Value Médio',
      value: 'R$ 1.245',
      change: '+15.2%',
      trend: 'up' as const,
      icon: Package,
      color: 'orange',
    },
  ]

  return (
    <div>
      <Header
        title="Gestão de Planos"
        description="Gerencie planos, preços e assinaturas"
      />

      <div className="p-6 space-y-6">
        {/* Estatísticas Gerais */}
        <PlanStatsGrid stats={stats} />

        {/* Cards dos Planos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>

        {/* Funil de Conversão */}
        <ConversionFunnel data={conversionData} />

        {/* Estatísticas Detalhadas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tempo Médio em Cada Plano */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold mb-4">Tempo Médio em Cada Plano</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Trial</span>
                  <span className="text-sm text-muted-foreground">14 dias</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gray-500 rounded-full" style={{ width: '46%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Free</span>
                  <span className="text-sm text-muted-foreground">45 dias</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gray-500 rounded-full" style={{ width: '60%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Pro</span>
                  <span className="text-sm text-muted-foreground">8 meses</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '85%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Enterprise</span>
                  <span className="text-sm text-muted-foreground">14 meses</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Taxa de Upgrade/Downgrade */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold mb-4">Movimentação de Planos (Este Mês)</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-green-500 rounded-full" />
                  <span className="text-sm font-medium">Free → Pro</span>
                </div>
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                  +12 upgrades
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-green-500 rounded-full" />
                  <span className="text-sm font-medium">Pro → Enterprise</span>
                </div>
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                  +3 upgrades
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-red-500 rounded-full" />
                  <span className="text-sm font-medium">Pro → Free</span>
                </div>
                <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                  -2 downgrades
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-red-500 rounded-full" />
                  <span className="text-sm font-medium">Enterprise → Pro</span>
                </div>
                <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                  -1 downgrade
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
