import { Header } from '@/components/layouts/header'
import { PlanCard } from '@/components/admin/plan-card'
import { ConversionFunnel } from '@/components/admin/conversion-funnel'
import { PlanStatsGrid } from '@/components/admin/plan-stats-grid'

export default function AdminSubscriptionsPage() {
  // TODO: Substituir por hooks reais:
  // const { stats } = useSubscriptionStats()
  // const { plans } = useSubscriptionPlans()
  // const { conversionData } = useConversionFunnel()
  // const { movements } = usePlanMovements()

  const plans = [
    {
      id: 'free',
      name: 'Free',
      color: 'gray',
      subscribers: 0,
      revenue: 0,
      conversionRate: 0,
      averageLifetime: '-',
      features: ['Até 50 clientes', 'Ordens básicas', 'Suporte por email'],
    },
    {
      id: 'pro',
      name: 'Pro',
      color: 'blue',
      price: 99,
      subscribers: 0,
      revenue: 0,
      conversionRate: 0,
      averageLifetime: '-',
      features: ['Clientes ilimitados', 'Ordens avançadas', 'Suporte prioritário', 'Analytics'],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      color: 'purple',
      price: 299,
      subscribers: 0,
      revenue: 0,
      conversionRate: 0,
      averageLifetime: '-',
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
    trial: 0,
    free: 0,
    pro: 0,
    enterprise: 0,
  }

  const stats: Array<{
    title: string
    value: string
    change: string
    trend: 'up' | 'down'
    icon: string
    color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow'
  }> = [
    {
      title: 'Total de Assinantes',
      value: '0',
      change: '0%',
      trend: 'up',
      icon: 'Users',
      color: 'blue',
    },
    {
      title: 'MRR Total',
      value: 'R$ 0',
      change: '0%',
      trend: 'up',
      icon: 'DollarSign',
      color: 'green',
    },
    {
      title: 'Taxa Conversão Free→Pro',
      value: '0%',
      change: '0%',
      trend: 'up',
      icon: 'TrendingUp',
      color: 'purple',
    },
    {
      title: 'Lifetime Value Médio',
      value: 'R$ 0',
      change: '0%',
      trend: 'up',
      icon: 'Package',
      color: 'orange',
    },
  ]

  const planTimeData = [
    { plan: 'Trial', time: '-', percentage: 0 },
    { plan: 'Free', time: '-', percentage: 0 },
    { plan: 'Pro', time: '-', percentage: 0 },
    { plan: 'Enterprise', time: '-', percentage: 0 },
  ]

  const movements = [
    { from: 'Free', to: 'Pro', count: 0, type: 'upgrade' },
    { from: 'Pro', to: 'Enterprise', count: 0, type: 'upgrade' },
    { from: 'Pro', to: 'Free', count: 0, type: 'downgrade' },
    { from: 'Enterprise', to: 'Pro', count: 0, type: 'downgrade' },
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
              {planTimeData.map((item) => (
                <div key={item.plan}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{item.plan}</span>
                    <span className="text-sm text-muted-foreground">{item.time}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.plan === 'Enterprise' ? 'bg-purple-500' :
                        item.plan === 'Pro' ? 'bg-blue-500' : 'bg-gray-500'
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Taxa de Upgrade/Downgrade */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold mb-4">Movimentação de Planos (Este Mês)</h3>
            <div className="space-y-4">
              {movements.map((movement, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    movement.type === 'upgrade'
                      ? 'bg-green-50 dark:bg-green-950/20'
                      : 'bg-red-50 dark:bg-red-950/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        movement.type === 'upgrade' ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    />
                    <span className="text-sm font-medium">
                      {movement.from} → {movement.to}
                    </span>
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      movement.type === 'upgrade'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {movement.type === 'upgrade' ? '+' : '-'}{movement.count}{' '}
                    {movement.type === 'upgrade' ? 'upgrades' : 'downgrades'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
