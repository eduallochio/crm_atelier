'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type {
  Cashier, CashierInput,
  CashierSessionInput, CashierSessionWithRelations,
  CashierMovement, CashierMovementInput,
  CashierReconciliation, CashierReconciliationInput,
} from '@/lib/validations/cashier'

// ===== CAIXAS =====

export function useCashiers() {
  return useQuery({
    queryKey: ['cashiers'],
    queryFn: async () => {
      const res = await fetch('/api/cashiers')
      if (!res.ok) throw new Error('Erro ao buscar caixas')
      return res.json() as Promise<Cashier[]>
    },
  })
}

export function useCashier(id: string) {
  return useQuery({
    queryKey: ['cashier', id],
    queryFn: async () => {
      const res = await fetch(`/api/cashiers/${id}`)
      if (!res.ok) throw new Error('Erro ao buscar caixa')
      return res.json() as Promise<Cashier>
    },
    enabled: !!id,
  })
}

export function useCreateCashier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CashierInput) => {
      const res = await fetch('/api/cashiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) throw new Error('Erro ao criar caixa')
      return res.json()
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
      const res = await fetch(`/api/cashiers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) throw new Error('Erro ao atualizar caixa')
      return res.json()
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
      const res = await fetch(`/api/cashiers/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao excluir caixa')
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
      const params = new URLSearchParams()
      if (filters?.caixa_id) params.set('caixa_id', filters.caixa_id)
      if (filters?.status) params.set('status', filters.status)
      const res = await fetch(`/api/cashiers/sessions?${params}`)
      if (!res.ok) throw new Error('Erro ao buscar sessões')
      return res.json() as Promise<CashierSessionWithRelations[]>
    },
  })
}

export function useCashierSession(id: string) {
  return useQuery({
    queryKey: ['cashier-session', id],
    queryFn: async () => {
      const res = await fetch(`/api/cashiers/sessions/${id}`)
      if (!res.ok) throw new Error('Erro ao buscar sessão')
      return res.json() as Promise<CashierSessionWithRelations>
    },
    enabled: !!id,
  })
}

export function useActiveCashierSession(caixaId?: string) {
  return useQuery({
    queryKey: ['active-cashier-session', caixaId],
    queryFn: async () => {
      const params = new URLSearchParams({ status: 'aberto' })
      if (caixaId) params.set('caixa_id', caixaId)
      const res = await fetch(`/api/cashiers/sessions?${params}`)
      if (!res.ok) throw new Error('Erro ao buscar sessão ativa')
      const data = await res.json() as CashierSessionWithRelations[]
      return data[0] ?? null
    },
  })
}

export function useOpenCashier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CashierSessionInput) => {
      const res = await fetch('/api/cashiers/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) throw new Error('Erro ao abrir caixa')
      return res.json()
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
      observacoes_fechamento,
    }: {
      sessaoId: string
      saldo_real: number
      observacoes_fechamento?: string
    }) => {
      const res = await fetch(`/api/cashiers/sessions/${sessaoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'fechado', saldo_real, observacoes_fechamento }),
      })
      if (!res.ok) throw new Error('Erro ao fechar caixa')
      return res.json()
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
      const res = await fetch(`/api/cashiers/sessions/${sessaoId}/movements`)
      if (!res.ok) throw new Error('Erro ao buscar movimentações')
      return res.json() as Promise<CashierMovement[]>
    },
    enabled: !!sessaoId,
  })
}

export function useCreateCashierMovement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CashierMovementInput) => {
      const res = await fetch(`/api/cashiers/sessions/${input.sessao_id}/movements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) throw new Error('Erro ao registrar movimentação')
      return res.json()
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
      const res = await fetch(`/api/cashiers/sessions/${sessaoId}/reconciliations`)
      if (!res.ok) throw new Error('Erro ao buscar conferência')
      return res.json() as Promise<CashierReconciliation[]>
    },
    enabled: !!sessaoId,
  })
}

export function useCreateCashierReconciliation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (items: CashierReconciliationInput[]) => {
      if (items.length === 0) return []
      const sessaoId = items[0].sessao_id
      const res = await fetch(`/api/cashiers/sessions/${sessaoId}/reconciliations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items),
      })
      if (!res.ok) throw new Error('Erro ao salvar conferência')
      return res.json()
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
