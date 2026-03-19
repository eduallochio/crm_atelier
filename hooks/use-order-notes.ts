'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ServiceOrderNote } from '@/lib/validations/service-order'
import { toast } from 'sonner'

export function useOrderNotes(orderId: string) {
  return useQuery({
    queryKey: ['order-notes', orderId],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${orderId}/notes`)
      if (!res.ok) throw new Error('Erro ao buscar notas')
      return res.json() as Promise<ServiceOrderNote[]>
    },
    enabled: !!orderId,
  })
}

export function useCreateOrderNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ orderId, nota }: { orderId: string; nota: string }) => {
      const res = await fetch(`/api/orders/${orderId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nota }),
      })
      if (!res.ok) throw new Error('Erro ao adicionar nota')
      return res.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['order-notes', variables.orderId] })
      toast.success('Nota adicionada com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

interface OrderHistoryItem {
  id: string
  user_email: string
  campo_alterado: string
  valor_anterior: string | null
  valor_novo: string | null
  created_at: string
}

export function useOrderHistory(orderId: string) {
  return useQuery<OrderHistoryItem[]>({
    queryKey: ['order-history', orderId],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${orderId}/history`)
      if (!res.ok) throw new Error('Erro ao buscar histórico')
      return res.json()
    },
    enabled: !!orderId,
  })
}
