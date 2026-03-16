'use client'

import { useQuery } from '@tanstack/react-query'

export interface PlanUsageData {
  plan: string
  usage: { clients: number; services: number; orders: number }
  limits: { clients: number; services: number; orders: number; users: number }
}

export function usePlanUsage() {
  return useQuery<PlanUsageData>({
    queryKey: ['plan-usage'],
    queryFn: async () => {
      const res = await fetch('/api/plan-usage')
      if (!res.ok) throw new Error('Erro ao buscar uso do plano')
      return res.json()
    },
    staleTime: 30_000,
  })
}

/** Retorna informações de limite para um recurso específico. */
export function usePlanLimit(resource: 'clients' | 'services' | 'orders') {
  const { data } = usePlanUsage()

  if (!data || data.plan !== 'free') {
    return { atLimit: false, nearLimit: false, usage: 0, limit: 0, isFree: false }
  }

  const usage = data.usage[resource]
  const limit = data.limits[resource]

  return {
    isFree: true,
    atLimit: usage >= limit,
    nearLimit: usage >= Math.floor(limit * 0.8),
    usage,
    limit,
  }
}
