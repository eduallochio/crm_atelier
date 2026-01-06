'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { ServiceOrderNote } from '@/lib/validations/service-order'
import { toast } from 'sonner'

export function useOrderNotes(orderId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['order-notes', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('org_service_order_notes')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as ServiceOrderNote[]
    },
    enabled: !!orderId,
  })
}

export function useCreateOrderNote() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ orderId, nota }: { orderId: string; nota: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, email')
        .eq('id', user.id)
        .single()

      if (!profile) throw new Error('Perfil não encontrado')

      const { data, error } = await supabase
        .from('org_service_order_notes')
        .insert({
          order_id: orderId,
          organization_id: profile.organization_id,
          user_email: profile.email,
          nota,
        })
        .select()
        .single()

      if (error) throw error
      return data
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

export function useOrderHistory(orderId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['order-history', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('org_service_order_history')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!orderId,
  })
}
