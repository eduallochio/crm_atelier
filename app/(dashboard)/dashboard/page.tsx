'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layouts/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, FileText, DollarSign, TrendingUp, Plus, UserPlus } from 'lucide-react'
import { ClientDialog } from '@/components/forms/client-dialog'
import { ServiceOrderDialog } from '@/components/forms/service-order-dialog'
import { DashboardCharts } from '@/components/dashboard/dashboard-charts'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export default function DashboardPage() {
  const [clientDialogOpen, setClientDialogOpen] = useState(false)
  const [orderDialogOpen, setOrderDialogOpen] = useState(false)
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
  })

  const stats = [
    {
      name: 'Clientes Cadastrados',
      value: metrics?.clients_count || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      name: 'Ordens de Serviço',
      value: metrics?.orders_count || 0,
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      name: 'Usuários',
      value: metrics?.users_count || 0,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      name: 'Receita do Mês',
      value: 'R$ 0,00',
      icon: DollarSign,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
  ]

  return (
    <div>
      <Header 
        title={`Bem-vindo, ${profile?.full_name || 'Usuário'}!`}
        description="Visão geral do seu ateliê"
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Ações Rápidas */}
        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={() => setClientDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Novo Cliente
          </Button>
          <Button 
            onClick={() => setOrderDialogOpen(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Ordem
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.name}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
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

      {/* Diálogos */}
      <ClientDialog 
        open={clientDialogOpen} 
        onOpenChange={setClientDialogOpen} 
      />
      <ServiceOrderDialog 
        open={orderDialogOpen} 
        onOpenChange={setOrderDialogOpen} 
      />
              <p className="text-xs">
                Faça upgrade para o plano Enterprise para clientes ilimitados e mais recursos.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm text-center py-8">
              Nenhuma atividade ainda. Comece cadastrando seus primeiros clientes!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
