'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ServiceOrder, ServiceOrderInput } from '@/lib/validations/service-order'
import { toast } from 'sonner'

export function useServiceOrders() {
  return useQuery({
    queryKey: ['service-orders'],
    queryFn: async () => {
      const res = await fetch('/api/orders')
      if (!res.ok) throw new Error('Erro ao buscar ordens de serviço')
      return res.json() as Promise<ServiceOrder[]>
    },
  })
}

export function useServiceOrder(id: string) {
  return useQuery({
    queryKey: ['service-order', id],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${id}`)
      if (!res.ok) throw new Error('Erro ao buscar ordem de serviço')
      return res.json() as Promise<ServiceOrder>
    },
    enabled: !!id,
  })
}

export function useCreateServiceOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: ServiceOrderInput) => {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao criar ordem de serviço')
      return data as ServiceOrder
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] })
      toast.success('Ordem de serviço criada com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateServiceOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<ServiceOrderInput> }) => {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao atualizar ordem de serviço')
      return data as ServiceOrder
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] })
      queryClient.invalidateQueries({ queryKey: ['receivables'] })
      toast.success('Ordem de serviço atualizada com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteServiceOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' })
      if (!res.ok && res.status !== 204) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao remover ordem de serviço')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] })
      toast.success('Ordem de serviço removida com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}
