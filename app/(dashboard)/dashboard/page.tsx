'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, FileText, DollarSign, Plus, UserPlus } from 'lucide-react'
import { ClientDialog } from '@/components/forms/client-dialog'
import { ServiceOrderDialog } from '@/components/forms/service-order-dialog'
import { DashboardCharts } from '@/components/dashboard/dashboard-charts'
import { AnimatedStatCard } from '@/components/dashboard/animated-stat-card'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { UrgentOrders } from '@/components/dashboard/urgent-orders'
import { BusinessInsights } from '@/components/dashboard/business-insights'
import { GlobalSearch } from '@/components/dashboard/global-search'
import { PeriodFilterSelect, PeriodFilter, filterDataByPeriod } from '@/components/dashboard/period-filter'
import { MonthlyGoal } from '@/components/dashboard/monthly-goal'
import { useQuery } from '@tanstack/react-query'

function useGreeting(name: string) {
  const [greeting, setGreeting] = useState('')
  const [dateStr, setDateStr] = useState('')

  useEffect(() => {
    const h = new Date().getHours()
    setGreeting(
      h < 12 ? `Bom dia, ${name}!` :
      h < 18 ? `Boa tarde, ${name}!` :
               `Boa noite, ${name}!`
    )
    setDateStr(new Date().toLocaleDateString('pt-BR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    }))
  }, [name])

  return { greeting, dateStr }
}

export default function DashboardPage() {
  const [clientDialogOpen, setClientDialogOpen] = useState(false)
  const [orderDialogOpen, setOrderDialogOpen] = useState(false)
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('30d')

  // Dados do usuário logado (sidebar já usa /api/me, reutilizamos)
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await fetch('/api/me')
      if (!res.ok) return null
      return res.json()
    },
  })

  // Stats do dashboard: métricas, receita mensal, atividades, ordens urgentes
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/stats')
      if (!res.ok) return null
      return res.json()
    },
    staleTime: 2 * 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  })

  // Ordens para gráficos (usa API já migrada)
  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await fetch('/api/orders')
      if (!res.ok) return []
      return res.json()
    },
    staleTime: 3 * 60 * 1000,
  })

  // Serviços para gráficos (usa API já migrada)
  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const res = await fetch('/api/services')
      if (!res.ok) return []
      return res.json()
    },
    staleTime: 10 * 60 * 1000,
  })

  // Clientes para busca global (usa API já migrada)
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const res = await fetch('/api/clients')
      if (!res.ok) return []
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
  })

  const metrics = stats?.metrics ?? {}
  const monthlyRevenue = stats?.monthly_revenue ?? 0
  const recentActivities = stats?.recent_activities ?? []
  const urgentOrders = stats?.urgent_orders ?? []
  const plan = stats?.plan ?? 'free'
  const financialHealth = stats?.financial_health
  const topClients = stats?.top_clients ?? []
  const inactiveClientsCount = stats?.inactive_clients_count ?? 0

  const filteredOrders = filterDataByPeriod(orders, periodFilter)
  const { greeting, dateStr } = useGreeting(me?.name?.split(' ')[0] || 'Usuário')

  const statCards = [
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
      icon: Users,
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
      {/* ── Greeting Banner ── */}
      <div className="bg-card border-b border-border/60 px-4 sm:px-6 lg:px-8 py-5 pl-16 lg:pl-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 sm:mr-52 lg:mr-56">
          <div className="pr-40 sm:pr-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1">
              {dateStr}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
              {greeting || `Bem-vindo!`}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Visão geral do seu ateliê</p>
          </div>

          {/* Desktop: busca + divisor + botões em linha */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            <div className="w-52 lg:w-64">
              <GlobalSearch clients={clients} orders={orders} services={services} />
            </div>
            <div className="h-8 w-px bg-border/60 shrink-0" />
            <Button onClick={() => setClientDialogOpen(true)} size="sm" className="gap-2 h-9 px-4 font-medium shrink-0">
              <UserPlus className="h-4 w-4" />
              Novo Cliente
            </Button>
            <Button onClick={() => setOrderDialogOpen(true)} variant="outline" size="sm" className="gap-2 h-9 px-4 font-medium shrink-0">
              <Plus className="h-4 w-4" />
              Nova Ordem
            </Button>
          </div>

          {/* Mobile: busca em cima, botões lado a lado embaixo */}
          <div className="flex sm:hidden flex-col gap-3">
            <GlobalSearch clients={clients} orders={orders} services={services} />
            <div className="flex gap-3">
              <Button onClick={() => setClientDialogOpen(true)} size="sm" className="flex-1 gap-2 h-10 font-medium">
                <UserPlus className="h-4 w-4" />
                Novo Cliente
              </Button>
              <Button onClick={() => setOrderDialogOpen(true)} variant="outline" size="sm" className="flex-1 gap-2 h-10 font-medium">
                <Plus className="h-4 w-4" />
                Nova Ordem
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        {/* Stats Cards + Meta */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {statCards.map((stat) => (
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
          <MonthlyGoal
            currentRevenue={monthlyRevenue}
            isLoading={!stats}
          />
        </div>

        {/* Plano Info */}
        {plan === 'free' && (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
                <span className="text-sm">✨</span>
              </div>
              <div>
                <p className="text-sm font-medium text-amber-900 dark:text-amber-300">Plano Gratuito</p>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  {metrics?.clients_count || 0} de 50 clientes utilizados
                </p>
              </div>
            </div>
            <div className="h-1.5 flex-1 max-w-[120px] rounded-full bg-amber-200 dark:bg-amber-800 overflow-hidden">
              <div
                className="h-full bg-amber-500 dark:bg-amber-400 rounded-full transition-all"
                style={{ width: `${Math.min(((metrics?.clients_count || 0) / 50) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Layout com 2 colunas para Activity e Urgent Orders */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          <RecentActivity
            activities={recentActivities}
            isLoading={!stats}
          />
          <UrgentOrders
            orders={urgentOrders}
            isLoading={!stats}
          />
        </div>

        {/* Inteligência de negócios */}
        <div>
          <div className="mb-4">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Inteligência de Negócios
            </p>
            <h3 className="text-lg font-bold text-foreground leading-tight mt-0.5">
              Saúde do ateliê
            </h3>
          </div>
          <BusinessInsights
            orders={orders}
            financialHealth={financialHealth}
            topClients={topClients}
            inactiveClientsCount={inactiveClientsCount}
            currentMonthRevenue={monthlyRevenue}
            isLoading={!stats}
          />
        </div>

        {/* Gráficos */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Análise de Dados
              </p>
              <h3 className="text-lg font-bold text-foreground leading-tight mt-0.5">
                Visão de desempenho
              </h3>
            </div>
            <PeriodFilterSelect value={periodFilter} onChange={setPeriodFilter} />
          </div>
          <DashboardCharts ordersData={filteredOrders} servicesData={services} />
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
