'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
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

// Hook para buscar formas de pagamento
export function usePaymentMethods() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      // Buscar organization_id do usuário
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile?.organization_id) return []

      const { data, error } = await supabase
        .from('org_payment_methods')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('display_order', { ascending: true })

      if (error) throw error
      return data as PaymentMethod[]
    },
  })
}

// Hook para buscar apenas formas de pagamento ativas
export function useActivePaymentMethods() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['active-payment-methods'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile?.organization_id) return []

      const { data, error } = await supabase
        .from('org_payment_methods')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .eq('enabled', true)
        .order('display_order', { ascending: true })

      if (error) throw error
      return data as PaymentMethod[]
    },
  })
}

// Hook para criar forma de pagamento
export function useCreatePaymentMethod() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (input: PaymentMethodInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not found')

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile?.organization_id) throw new Error('Organization not found')

      // Buscar o maior display_order atual
      const { data: existingMethods } = await supabase
        .from('org_payment_methods')
        .select('display_order')
        .eq('organization_id', profile.organization_id)
        .order('display_order', { ascending: false })
        .limit(1)

      const nextOrder = existingMethods && existingMethods.length > 0 
        ? existingMethods[0].display_order + 1 
        : 1

      const { data, error } = await supabase
        .from('org_payment_methods')
        .insert({
          organization_id: profile.organization_id,
          name: input.name,
          code: input.code.toLowerCase().replace(/\s+/g, '_'),
          enabled: input.enabled ?? true,
          is_default: false,
          display_order: nextOrder,
          icon: input.icon,
          color: input.color,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] })
      queryClient.invalidateQueries({ queryKey: ['active-payment-methods'] })
      toast.success('Forma de pagamento criada com sucesso!')
    },
    onError: (error: Error) => {
      if ('code' in error && error.code === '23505') {
        toast.error('Já existe uma forma de pagamento com este código')
      } else {
        toast.error('Erro ao criar forma de pagamento')
      }
      console.error('Error creating payment method:', error)
    },
  })
}

// Hook para atualizar forma de pagamento
export function useUpdatePaymentMethod() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<PaymentMethod> & { id: string }) => {
      const { data, error } = await supabase
        .from('org_payment_methods')
        .update(input)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] })
      queryClient.invalidateQueries({ queryKey: ['active-payment-methods'] })
      toast.success('Forma de pagamento atualizada!')
    },
    onError: (error) => {
      toast.error('Erro ao atualizar forma de pagamento')
      console.error('Error updating payment method:', error)
    },
  })
}

// Hook para deletar forma de pagamento
export function useDeletePaymentMethod() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('org_payment_methods')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] })
      queryClient.invalidateQueries({ queryKey: ['active-payment-methods'] })
      toast.success('Forma de pagamento removida!')
    },
    onError: (error) => {
      toast.error('Erro ao remover forma de pagamento')
      console.error('Error deleting payment method:', error)
    },
  })
}

// Hook para reordenar formas de pagamento
export function useReorderPaymentMethods() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (methods: { id: string; display_order: number }[]) => {
      const updates = methods.map(({ id, display_order }) =>
        supabase
          .from('org_payment_methods')
          .update({ display_order })
          .eq('id', id)
      )

      await Promise.all(updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] })
      queryClient.invalidateQueries({ queryKey: ['active-payment-methods'] })
    },
    onError: (error) => {
      toast.error('Erro ao reordenar formas de pagamento')
      console.error('Error reordering payment methods:', error)
    },
  })
}
