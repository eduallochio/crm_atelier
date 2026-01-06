'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  Cashier, CashierInput,
  CashierSessionInput, CashierSessionWithRelations,
  CashierMovement, CashierMovementInput,
  CashierReconciliation, CashierReconciliationInput
} from '@/lib/validations/cashier'

// ===== CAIXAS =====

export function useCashiers() {
  return useQuery({
    queryKey: ['cashiers'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('org_cashiers')
        .select('*')
        .order('nome')
      
      if (error) throw error
      return data as Cashier[]
    },
  })
}

export function useCashier(id: string) {
  return useQuery({
    queryKey: ['cashier', id],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('org_cashiers')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data as Cashier
    },
    enabled: !!id,
  })
}

export function useCreateCashier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CashierInput) => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile) throw new Error('Usuário não pertence a uma organização')

      const { data, error } = await supabase
        .from('org_cashiers')
        .insert({
          ...input,
          organization_id: profile.organization_id,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashiers'] })
      toast.success('Caixa criado com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar caixa: ${error.message}`)
    },
  })
}

export function useUpdateCashier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<CashierInput> }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('org_cashiers')
        .update(input)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashiers'] })
      toast.success('Caixa atualizado com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar caixa: ${error.message}`)
    },
  })
}

export function useDeleteCashier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('org_cashiers')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashiers'] })
      toast.success('Caixa excluído com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir caixa: ${error.message}`)
    },
  })
}

// ===== SESSÕES DE CAIXA =====

export function useCashierSessions(filters?: { caixa_id?: string; status?: string }) {
  return useQuery({
    queryKey: ['cashier-sessions', filters],
    queryFn: async () => {
      const supabase = createClient()
      let query = supabase
        .from('org_cashier_sessions')
        .select('*, org_cashiers(nome)')
        .order('data_abertura', { ascending: false })
      
      if (filters?.caixa_id) {
        query = query.eq('caixa_id', filters.caixa_id)
      }
      
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      const { data, error } = await query
      
      if (error) throw error
      return data as CashierSessionWithRelations[]
    },
  })
}

export function useCashierSession(id: string) {
  return useQuery({
    queryKey: ['cashier-session', id],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('org_cashier_sessions')
        .select('*, org_cashiers(nome)')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data as CashierSessionWithRelations
    },
    enabled: !!id,
  })
}

export function useActiveCashierSession(caixaId?: string) {
  return useQuery({
    queryKey: ['active-cashier-session', caixaId],
    queryFn: async () => {
      const supabase = createClient()
      let query = supabase
        .from('org_cashier_sessions')
        .select('*, org_cashiers(nome)')
        .eq('status', 'aberto')
      
      if (caixaId) {
        query = query.eq('caixa_id', caixaId)
      }

      const { data, error } = await query.maybeSingle()
      
      if (error) throw error
      return data as CashierSessionWithRelations | null
    },
  })
}

export function useOpenCashier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CashierSessionInput) => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile) throw new Error('Usuário não pertence a uma organização')

      const { data, error } = await supabase
        .from('org_cashier_sessions')
        .insert({
          ...input,
          organization_id: profile.organization_id,
          status: 'aberto',
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashier-sessions'] })
      queryClient.invalidateQueries({ queryKey: ['active-cashier-session'] })
      toast.success('Caixa aberto com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao abrir caixa: ${error.message}`)
    },
  })
}

export function useCloseCashier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      sessaoId, 
      saldo_real, 
      observacoes_fechamento
    }: { 
      sessaoId: string
      saldo_real: number
      observacoes_fechamento?: string
    }) => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      const { data, error } = await supabase
        .from('org_cashier_sessions')
        .update({
          status: 'fechado',
          data_fechamento: new Date().toISOString(),
          saldo_real,
          observacoes_fechamento,
        })
        .eq('id', sessaoId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashier-sessions'] })
      queryClient.invalidateQueries({ queryKey: ['active-cashier-session'] })
      toast.success('Caixa fechado com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao fechar caixa: ${error.message}`)
    },
  })
}

// ===== MOVIMENTAÇÕES DE CAIXA =====

export function useCashierMovements(sessaoId?: string) {
  return useQuery({
    queryKey: ['cashier-movements', sessaoId],
    queryFn: async () => {
      const supabase = createClient()
      let query = supabase
        .from('org_cashier_movements')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (sessaoId) {
        query = query.eq('sessao_id', sessaoId)
      }

      const { data, error } = await query
      
      if (error) throw error
      return data as CashierMovement[]
    },
    enabled: !!sessaoId,
  })
}

export function useCreateCashierMovement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CashierMovementInput) => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile) throw new Error('Usuário não pertence a uma organização')

      const { data, error } = await supabase
        .from('org_cashier_movements')
        .insert({
          ...input,
          organization_id: profile.organization_id,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashier-movements'] })
      queryClient.invalidateQueries({ queryKey: ['cashier-sessions'] })
      toast.success('Movimentação registrada com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao registrar movimentação: ${error.message}`)
    },
  })
}

// ===== CONFERÊNCIA DE CAIXA =====

export function useCashierReconciliation(sessaoId: string) {
  return useQuery({
    queryKey: ['cashier-reconciliation', sessaoId],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('org_cashier_reconciliation')
        .select('*')
        .eq('sessao_id', sessaoId)

      if (error) throw error
      return data as CashierReconciliation[]
    },
    enabled: !!sessaoId,
  })
}

export function useCreateCashierReconciliation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (items: CashierReconciliationInput[]) => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile) throw new Error('Usuário não pertence a uma organização')

      const itemsWithOrg = items.map(item => ({
        ...item,
        organization_id: profile.organization_id,
      }))

      const { data, error } = await supabase
        .from('org_cashier_reconciliation')
        .insert(itemsWithOrg)
        .select()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashier-reconciliation'] })
      toast.success('Conferência de caixa salva com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao salvar conferência: ${error.message}`)
    },
  })
}
