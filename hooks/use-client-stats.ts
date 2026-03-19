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

interface ClientOrdersData {
  stats: {
    totalOrders: number
    totalSpent: number
    openOrders: number
    lastOrder: { created_at: string } | null
  }
  orders: Array<{
    id: string
    numero: number
    status: string
    valor_total: number
    data_abertura: string
    data_conclusao: string | null
    observacoes: string | null
    items: Array<{ id: string; service_nome: string; quantidade: number; valor_unitario: number }>
  }>
}

export function useClientOrders(clientId: string) {
  return useQuery<ClientOrdersData>({
    queryKey: ['client-orders', clientId],
    queryFn: async () => {
      const res = await fetch(`/api/clients/${clientId}/orders`)
      if (!res.ok) throw new Error('Erro ao buscar ordens do cliente')
      return res.json()
    },
    enabled: !!clientId,
  })
}
