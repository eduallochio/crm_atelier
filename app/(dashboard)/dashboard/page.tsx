'use client'

import { useState } from 'react'
import { Header } from '@/components/layouts/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, FileText, DollarSign, TrendingUp, Plus, UserPlus } from 'lucide-react'
import { ClientDialog } from '@/components/forms/client-dialog'
import { ServiceOrderDialog } from '@/components/forms/service-order-dialog'
import { DashboardCharts } from '@/components/dashboard/dashboard-charts'
import { AnimatedStatCard } from '@/components/dashboard/animated-stat-card'
import { RecentActivity, Activity } from '@/components/dashboard/recent-activity'
import { UrgentOrders } from '@/components/dashboard/urgent-orders'
import { GlobalSearch } from '@/components/dashboard/global-search'
import { PeriodFilterSelect, PeriodFilter, filterDataByPeriod } from '@/components/dashboard/period-filter'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export default function DashboardPage() {
  const [clientDialogOpen, setClientDialogOpen] = useState(false)
  const [orderDialogOpen, setOrderDialogOpen] = useState(false)
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('30d')
  const supabase = createClient()

  // Buscar perfil do usuário
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data } = await supabase
        .from('profiles')
        .select('*, organization:organizations(*)')
        .eq('id', user.id)
        .single()

      return data
    },
  })

  // Buscar métricas
  const { data: metrics } = useQuery({
    queryKey: ['metrics', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return null
      
      const { data } = await supabase
        .from('usage_metrics')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .single()
      
      return data
    },
    enabled: !!profile?.organization_id,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 5 * 60 * 1000, // Atualizar a cada 5 minutos
  })

  // Buscar ordens para gráficos
  const { data: orders = [] } = useQuery({
    queryKey: ['orders-for-charts', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return []

      const { data } = await supabase
        .from('org_service_orders')
        .select('*, items:org_service_order_items(*), client:org_clients(*)')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })

      return data || []
    },
    enabled: !!profile?.organization_id,
    staleTime: 3 * 60 * 1000, // 3 minutos
  })

  // Buscar serviços para gráficos
  const { data: services = [] } = useQuery({
    queryKey: ['services-for-charts', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return []

      const { data } = await supabase
        .from('org_services')
        .select('*')
        .eq('organization_id', profile.organization_id)

      return data || []
    },
    enabled: !!profile?.organization_id,
    staleTime: 10 * 60 * 1000, // 10 minutos
  })

  // Buscar clientes para busca global
  const { data: clients = [] } = useQuery({
    queryKey: ['clients-search', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return []

      const { data } = await supabase
        .from('org_clients')
        .select('id, nome, email, telefone')
        .eq('organization_id', profile.organization_id)
        .limit(100)

      return data || []
    },
    enabled: !!profile?.organization_id,
    staleTime: 5 * 60 * 1000,
  })

  // Buscar atividades recentes
  const { data: recentActivities = [], isLoading: isLoadingActivities } = useQuery({
    queryKey: ['recent-activities', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return []

      const activities: Activity[] = []

      // Buscar últimos clientes cadastrados
      const { data: recentClients } = await supabase
        .from('org_clients')
        .select('id, nome, created_at')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (recentClients) {
        recentClients.forEach(client => {
          activities.push({
            id: `client-${client.id}`,
            type: 'client',
            title: 'Novo cliente cadastrado',
            description: client.nome,
            timestamp: client.created_at,
          })
        })
      }

      // Buscar últimas ordens criadas
      const { data: recentOrders } = await supabase
        .from('org_service_orders')
        .select('id, numero, created_at, status, client:org_clients!inner(nome)')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (recentOrders) {
        recentOrders.forEach(order => {
          const client = Array.isArray(order.client) ? order.client[0] : order.client
          activities.push({
            id: `order-${order.id}`,
            type: order.status === 'concluido' ? 'order_completed' : 'order',
            title: order.status === 'concluido' ? 'Ordem concluída' : 'Nova ordem criada',
            description: `${order.numero} - ${client?.nome || 'Cliente não informado'}`,
            timestamp: order.created_at,
            metadata: {
              orderNumber: order.numero,
              clientName: client?.nome,
              status: order.status,
            }
          })
        })
      }

      // Ordenar por data mais recente
      return activities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ).slice(0, 10) // Limitar a 10 atividades mais recentes

    },
    enabled: !!profile?.organization_id,
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchInterval: 2 * 60 * 1000, // Atualizar a cada 2 minutos
  })

  // Buscar ordens urgentes (próximas da data de entrega)
  const { data: urgentOrders = [], isLoading: isLoadingUrgent } = useQuery({
    queryKey: ['urgent-orders', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return []

      const today = new Date()
      const sevenDaysFromNow = new Date()
      sevenDaysFromNow.setDate(today.getDate() + 7)

      const { data } = await supabase
        .from('org_service_orders')
        .select('id, numero, data_entrega, status, valor_total, client:org_clients(nome)')
        .eq('organization_id', profile.organization_id)
        .in('status', ['pendente', 'em_andamento'])
        .not('data_entrega', 'is', null)
        .lte('data_entrega', sevenDaysFromNow.toISOString())
        .order('data_entrega', { ascending: true })
        .limit(5)

      // Garantir que client seja um objeto, não um array
      return (data || []).map(order => ({
        ...order,
        client: Array.isArray(order.client) ? order.client[0] : order.client
      }))
    },
    enabled: !!profile?.organization_id,
    staleTime: 60 * 1000, // 1 minuto
    refetchInterval: 60 * 1000, // Atualizar a cada 1 minuto (ordens urgentes precisam ser mais atualizadas)
  })

  // Calcular receita real do mês atual
  const calculateMonthlyRevenue = () => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const monthlyOrders = orders.filter(order => {
      if (order.status !== 'concluido' || !order.data_conclusao) return false
      
      const conclusionDate = new Date(order.data_conclusao)
      return conclusionDate.getMonth() === currentMonth && 
             conclusionDate.getFullYear() === currentYear
    })

    const total = monthlyOrders.reduce((sum, order) => sum + (order.valor_total || 0), 0)
    return total
  }

  const monthlyRevenue = calculateMonthlyRevenue()

  // Filtrar dados por período selecionado
  const filteredOrders = filterDataByPeriod(orders, periodFilter)

  const stats = [
    {
      name: 'Clientes Cadastrados',
      value: metrics?.clients_count || 0,
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30',
      iconBg: 'bg-blue-500 dark:bg-blue-600',
    },
    {
      name: 'Ordens de Serviço',
      value: metrics?.orders_count || 0,
      icon: FileText,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/30',
      iconBg: 'bg-green-500 dark:bg-green-600',
    },
    {
      name: 'Usuários',
      value: metrics?.users_count || 0,
      icon: TrendingUp,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/30',
      iconBg: 'bg-purple-500 dark:bg-purple-600',
    },
    {
      name: 'Receita do Mês',
      value: monthlyRevenue,
      icon: DollarSign,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/50 dark:to-yellow-900/30',
      iconBg: 'bg-yellow-500 dark:bg-yellow-600',
      isMonetary: true,
    },
  ]

  return (
    <div>
      <Header 
        title={`Bem-vindo, ${profile?.full_name || 'Usuário'}!`}
        description="Visão geral do seu ateliê"
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Busca Global e Ações Rápidas */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          <div className="flex-1 min-w-50">
            <GlobalSearch 
              clients={clients}
              orders={orders}
              services={services}
            />
          </div>
          <Button 
            onClick={() => setClientDialogOpen(true)}
            className="flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <UserPlus className="h-4 w-4" />
            Novo Cliente
          </Button>
          <Button 
            onClick={() => setOrderDialogOpen(true)}
            variant="outline"
            className="flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Nova Ordem
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <AnimatedStatCard
              key={stat.name}
              name={stat.name}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
              bgColor={stat.bgColor}
              iconBg={stat.iconBg}
              isMonetary={stat.isMonetary}
            />
          ))}
        </div>

        {/* Plano Info */}
        {profile?.organization?.plan === 'free' && (
          <Card className="bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-blue-900 dark:text-blue-400">Plano Gratuito</CardTitle>
            </CardHeader>
            <CardContent className="text-blue-800 dark:text-blue-300 text-sm space-y-2">
              <p>
                Você está usando {metrics?.clients_count || 0} de 50 clientes disponíveis.
              </p>
              <p className="text-xs">
                Faça upgrade para o plano Enterprise para clientes ilimitados e mais recursos.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Layout com 2 colunas para Activity e Urgent Orders */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          {/* Recent Activity */}
          <RecentActivity 
            activities={recentActivities}
            isLoading={isLoadingActivities}
          />

          {/* Urgent Orders */}
          <UrgentOrders 
            orders={urgentOrders}
            isLoading={isLoadingUrgent}
          />
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          <div className="xl:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Análise de Dados</h3>
              <PeriodFilterSelect value={periodFilter} onChange={setPeriodFilter} />
            </div>
            <DashboardCharts ordersData={filteredOrders} servicesData={services} />
          </div>
        </div>
      </div>

      {/* Diálogos */}
      <ClientDialog 
        open={clientDialogOpen} 
        onOpenChange={setClientDialogOpen} 
      />
      <ServiceOrderDialog 
        open={orderDialogOpen} 
        onOpenChange={setOrderDialogOpen} 
      />
    </div>
  )
}
