'use client'

import { useQuery } from '@tanstack/react-query'

interface ServiceStats {
  totalServices: number
  activeServices: number
  inactiveServices: number
  averagePrice: number
  mostUsedService: { id: string; nome: string; count: number; revenue: number } | null
  neverUsedCount: number
  categoriesCount: number
  serviceUsage: Array<{ id: string; nome: string; count: number; revenue: number }>
}

export function useServiceStats() {
  return useQuery<ServiceStats>({
    queryKey: ['service-stats'],
    queryFn: async () => {
      const res = await fetch('/api/services/stats')
      if (!res.ok) throw new Error('Erro ao buscar estatísticas de serviços')
      return res.json()
    },
  })
}

export function useServiceUsageStats(serviceId: string) {
  return useQuery({
    queryKey: ['service-usage', serviceId],
    queryFn: async () => {
      const res = await fetch(`/api/services/${serviceId}/usage`)
      if (!res.ok) throw new Error('Erro ao buscar uso do serviço')
      return res.json()
    },
    enabled: !!serviceId,
  })
}
