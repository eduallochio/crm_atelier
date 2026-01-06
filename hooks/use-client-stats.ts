'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useClientStats() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['client-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile) throw new Error('Perfil não encontrado')

      // Total de clientes
      const { count: totalClients } = await supabase
        .from('org_clients')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id)

      // Clientes novos este mês
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { count: newThisMonth } = await supabase
        .from('org_clients')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id)
        .gte('data_cadastro', startOfMonth.toISOString())

      // Clientes com ordens em aberto
      const { data: clientsWithOrders } = await supabase
        .from('org_service_orders')
        .select('client_id')
        .eq('organization_id', profile.organization_id)
        .in('status', ['pendente', 'em_andamento'])

      const uniqueClientsWithOrders = new Set(clientsWithOrders?.map(o => o.client_id).filter(Boolean))

      // Clientes com telefone
      const { count: clientsWithPhone } = await supabase
        .from('org_clients')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id)
        .not('telefone', 'is', null)

      // Aniversariantes do mês
      const currentMonth = new Date().getMonth() + 1
      const { data: clientsBirthday } = await supabase
        .from('org_clients')
        .select('id, nome, data_nascimento')
        .eq('organization_id', profile.organization_id)
        .not('data_nascimento', 'is', null)

      const birthdayThisMonth = clientsBirthday?.filter(client => {
        if (!client.data_nascimento) return false
        const birthDate = new Date(client.data_nascimento)
        return birthDate.getMonth() + 1 === currentMonth
      }) || []

      return {
        totalClients: totalClients || 0,
        newThisMonth: newThisMonth || 0,
        withActiveOrders: uniqueClientsWithOrders.size,
        withPhone: clientsWithPhone || 0,
        birthdayThisMonth: birthdayThisMonth.length,
      }
    },
  })
}

export function useClientOrders(clientId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['client-orders', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('org_service_orders')
        .select(`
          *,
          items:org_service_order_items(*)
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

      if (error) throw error

      const totalSpent = data?.reduce((sum, order) => sum + order.valor_total, 0) || 0
      const totalOrders = data?.length || 0
      const lastOrder = data?.[0]
      const openOrders = data?.filter(o => ['pendente', 'em_andamento'].includes(o.status)).length || 0

      return {
        orders: data || [],
        stats: {
          totalSpent,
          totalOrders,
          lastOrder,
          openOrders,
        }
      }
    },
    enabled: !!clientId,
  })
}
