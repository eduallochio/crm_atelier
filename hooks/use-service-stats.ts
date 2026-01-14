'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useServiceStats() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['service-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile) throw new Error('Perfil não encontrado')

      // Total de serviços
      const { data: services } = await supabase
        .from('org_services')
        .select('*')
        .eq('organization_id', profile.organization_id)

      const totalServices = services?.length || 0
      const activeServices = services?.filter(s => s.ativo).length || 0
      const inactiveServices = services?.filter(s => !s.ativo).length || 0

      // Calcular preço médio
      const averagePrice = services && services.length > 0
        ? services.reduce((sum, s) => sum + s.preco, 0) / services.length
        : 0

      // Buscar uso dos serviços em ordens
      const { data: orderItems } = await supabase
        .from('org_service_order_items')
        .select('service_id, service_nome, quantidade, valor_total')
        .in('service_id', services?.map(s => s.id) || [])

      // Calcular serviço mais vendido e receita total
      const serviceUsage = new Map<string, { nome: string; count: number; revenue: number }>()
      
      orderItems?.forEach(item => {
        const existing = serviceUsage.get(item.service_id) || { 
          nome: item.service_nome, 
          count: 0, 
          revenue: 0 
        }
        existing.count += item.quantidade
        existing.revenue += item.valor_total
        serviceUsage.set(item.service_id, existing)
      })

      // Encontrar o mais vendido
      let mostUsedService: { id: string; nome: string; count: number; revenue: number } | null = null
      let maxCount = 0
      serviceUsage.forEach((usage, serviceId) => {
        if (usage.count > maxCount) {
          maxCount = usage.count
          mostUsedService = { id: serviceId, ...usage }
        }
      })

      // Serviços nunca usados
      const neverUsedCount = services?.filter(s => !serviceUsage.has(s.id)).length || 0

      // Categorias únicas
      const categories = new Set(services?.map(s => s.categoria).filter(Boolean))

      return {
        totalServices,
        activeServices,
        inactiveServices,
        averagePrice,
        mostUsedService,
        neverUsedCount,
        categoriesCount: categories.size,
        serviceUsage: Array.from(serviceUsage.entries()).map(([id, data]) => ({
          id,
          ...data
        })).sort((a, b) => b.count - a.count),
      }
    },
  })
}

export function useServiceUsageStats(serviceId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['service-usage', serviceId],
    queryFn: async () => {
      const { data: items } = await supabase
        .from('org_service_order_items')
        .select(`
          *,
          order:org_service_orders!inner(
            id,
            numero,
            data_abertura,
            status,
            client:org_clients(nome)
          )
        `)
        .eq('service_id', serviceId)
        .order('created_at', { ascending: false })

      const totalUses = items?.reduce((sum, item) => sum + item.quantidade, 0) || 0
      const totalRevenue = items?.reduce((sum, item) => sum + item.valor_total, 0) || 0
      const lastUsed = items?.[0]?.created_at

      return {
        items: items || [],
        totalUses,
        totalRevenue,
        lastUsed,
      }
    },
    enabled: !!serviceId,
  })
}
