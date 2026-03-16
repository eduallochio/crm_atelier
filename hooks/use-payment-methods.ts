'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export interface PaymentMethod {
  id: string
  organization_id: string
  name: string
  code: string
  enabled: boolean
  is_default: boolean
  display_order: number
  icon?: string
  color?: string
  created_at: string
  updated_at: string
}

export interface PaymentMethodInput {
  name: string
  code: string
  enabled?: boolean
  icon?: string
  color?: string
}

export function usePaymentMethods() {
  return useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      const res = await fetch('/api/payment-methods')
      if (!res.ok) return []
      return res.json() as Promise<PaymentMethod[]>
    },
  })
}

export function useActivePaymentMethods() {
  return useQuery({
    queryKey: ['active-payment-methods'],
    queryFn: async () => {
      const res = await fetch('/api/payment-methods?enabled=true')
      if (!res.ok) return []
      return res.json() as Promise<PaymentMethod[]>
    },
  })
}

export function useCreatePaymentMethod() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: PaymentMethodInput) => {
      const res = await fetch('/api/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        if (err?.error?.includes('duplicate') || err?.error?.includes('unique')) {
          throw new Error('Já existe uma forma de pagamento com este código')
        }
        throw new Error('Erro ao criar forma de pagamento')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] })
      queryClient.invalidateQueries({ queryKey: ['active-payment-methods'] })
      toast.success('Forma de pagamento criada com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdatePaymentMethod() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<PaymentMethod> & { id: string }) => {
      const res = await fetch(`/api/payment-methods/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) throw new Error('Erro ao atualizar forma de pagamento')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] })
      queryClient.invalidateQueries({ queryKey: ['active-payment-methods'] })
      toast.success('Forma de pagamento atualizada!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDeletePaymentMethod() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/payment-methods/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao remover forma de pagamento')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] })
      queryClient.invalidateQueries({ queryKey: ['active-payment-methods'] })
      toast.success('Forma de pagamento removida!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useReorderPaymentMethods() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (methods: { id: string; display_order: number }[]) => {
      const res = await fetch('/api/payment-methods/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(methods),
      })
      if (!res.ok) throw new Error('Erro ao reordenar formas de pagamento')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] })
      queryClient.invalidateQueries({ queryKey: ['active-payment-methods'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}
