'use client'

import { useQuery } from '@tanstack/react-query'

// Shape retornada pela API /api/plan-usage
export interface PlanUsageData {
  plan: string
  clients_count: number
  services_count: number
  orders_count: number
  users_count: number
  limits: {
    max_clients: number
    max_services: number
    max_orders: number
    max_users: number
  }
}

export function usePlanUsage() {
  return useQuery<PlanUsageData>({
    queryKey: ['plan-usage'],
    queryFn: async () => {
      const res = await fetch('/api/plan-usage')
      if (!res.ok) throw new Error('Erro ao buscar uso do plano')
      return res.json()
    },
    staleTime: 2 * 60 * 1000,
  })
}

const USAGE_KEY: Record<'clients' | 'services' | 'orders', keyof PlanUsageData> = {
  clients:  'clients_count',
  services: 'services_count',
  orders:   'orders_count',
}

const LIMIT_KEY: Record<'clients' | 'services' | 'orders', keyof PlanUsageData['limits']> = {
  clients:  'max_clients',
  services: 'max_services',
  orders:   'max_orders',
}

/** Retorna informações de limite para um recurso específico. */
export function usePlanLimit(resource: 'clients' | 'services' | 'orders') {
  const { data } = usePlanUsage()

  if (!data || data.plan !== 'free') {
    return { atLimit: false, nearLimit: false, usage: 0, limit: 0, isFree: false }
  }

  const usage = Number(data[USAGE_KEY[resource]] ?? 0)
  const limit = Number(data.limits[LIMIT_KEY[resource]] ?? 0)

  return {
    isFree: true,
    atLimit: usage >= limit,
    nearLimit: usage >= Math.floor(limit * 0.8),
    usage,
    limit,
  }
}
