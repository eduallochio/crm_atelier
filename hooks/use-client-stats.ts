'use client'

import { useQuery } from '@tanstack/react-query'

export function useClientStats() {
  return useQuery({
    queryKey: ['client-stats'],
    queryFn: async () => {
      const res = await fetch('/api/clients/stats')
      if (!res.ok) throw new Error('Erro ao buscar estatísticas de clientes')
      return res.json()
    },
  })
}

export function useClientOrders(clientId: string) {
  return useQuery({
    queryKey: ['client-orders', clientId],
    queryFn: async () => {
      const res = await fetch(`/api/clients/${clientId}/orders`)
      if (!res.ok) throw new Error('Erro ao buscar ordens do cliente')
      return res.json()
    },
    enabled: !!clientId,
  })
}
