'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ServiceOrder, ServiceOrderInput, ServiceOrderItem, ServiceOrderItemInput, ServiceOrderEmbalagem } from '@/lib/validations/service-order'
import { toast } from 'sonner'
import { getErrorMessage, isPlanLimitError } from '@/lib/utils/error-message'

export function useServiceOrders({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['service-orders'],
    queryFn: async () => {
      const res = await fetch('/api/orders')
      if (!res.ok) throw new Error('Erro ao buscar ordens de serviço')
      return res.json() as Promise<ServiceOrder[]>
    },
    enabled,
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
      queryClient.invalidateQueries({ queryKey: ['plan-usage'] })
      toast.success('Ordem de serviço criada com sucesso!')
    },
    onError: (error: Error) => {
      if (isPlanLimitError(error)) {
        toast.error('Limite de ordens de serviço atingido no plano gratuito.', {
          action: { label: 'Fazer upgrade', onClick: () => window.location.href = '/configuracoes?tab=assinatura' },
          duration: 8000,
        })
      } else {
        toast.error(getErrorMessage(error))
      }
    },
  })
}

export function useUpdateServiceOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<ServiceOrderInput> & { payment_action?: 'paid' | 'receivable' | 'undecided'; payment_date?: string } }) => {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao atualizar ordem de serviço')
      return data as ServiceOrder & { no_cashier_session?: boolean }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] })
      queryClient.invalidateQueries({ queryKey: ['receivables'] })
      queryClient.invalidateQueries({ queryKey: ['cashier-sessions'] })
      queryClient.invalidateQueries({ queryKey: ['cashier-movements'] })
      queryClient.invalidateQueries({ queryKey: ['active-cashier-session'] })
      queryClient.invalidateQueries({ queryKey: ['financial-stats'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['orders-unlaunched'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      if (data?.status === 'concluido') {
        queryClient.invalidateQueries({ queryKey: ['products'] })
        queryClient.invalidateQueries({ queryKey: ['stock-exits'] })
      }
      toast.success('Ordem de serviço atualizada com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error))
    },
  })
}

/** Substitui os itens/serviços de uma OS já lançada e recalcula o valor_total. */
export function useUpdateOrderItems() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, items, desconto_valor, desconto_percentual }: {
      id: string
      items: ServiceOrderItemInput[]
      desconto_valor?: number
      desconto_percentual?: number
    }) => {
      const res = await fetch(`/api/orders/${id}/items`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, desconto_valor, desconto_percentual }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao atualizar itens da ordem de serviço')
      return data as { valor_total: number; desconto_valor: number; desconto_percentual: number; status_pagamento: string; items: ServiceOrderItem[] }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      toast.success('Itens da ordem de serviço atualizados!')
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error))
    },
  })
}

/**
 * Substitui as embalagens de uma OS já lançada. Se embalagem_soma_total
 * estiver ligado, o backend recalcula valor_total — ver PUT
 * /api/orders/[id]/embalagens.
 */
export function useUpdateOrderEmbalagens() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, embalagens }: {
      id: string
      embalagens: Array<{ product_id?: string | null; nome: string; quantidade: number; unidade?: string }>
    }) => {
      const res = await fetch(`/api/orders/${id}/embalagens`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embalagens }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao atualizar embalagem da ordem de serviço')
      return data as ServiceOrderEmbalagem[]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      toast.success('Embalagem da ordem de serviço atualizada!')
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error))
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
      queryClient.invalidateQueries({ queryKey: ['plan-usage'] })
      toast.success('Ordem de serviço removida com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error))
    },
  })
}
