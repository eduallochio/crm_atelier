'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  FinancialCategory,
  FinancialCategoryInput,
  PaymentMethod,
  PaymentMethodInput,
  Receivable,
  ReceivableInput,
  Payable,
  PayableInput,
  Transaction,
  TransactionInput,
} from '@/lib/validations/financial'
import { toast } from 'sonner'

// =====================================================
// CATEGORIAS FINANCEIRAS
// =====================================================

export function useFinancialCategories() {
  return useQuery({
    queryKey: ['financial-categories'],
    queryFn: async () => {
      const res = await fetch('/api/financial/categories')
      if (!res.ok) throw new Error('Erro ao buscar categorias')
      return res.json() as Promise<FinancialCategory[]>
    },
  })
}

export function useCreateFinancialCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: FinancialCategoryInput) => {
      const res = await fetch('/api/financial/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) throw new Error('Erro ao criar categoria')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-categories'] })
      toast.success('Categoria criada com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao criar categoria')
    },
  })
}

export function useUpdateFinancialCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: FinancialCategoryInput }) => {
      const res = await fetch(`/api/financial/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) throw new Error('Erro ao atualizar categoria')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-categories'] })
      toast.success('Categoria atualizada com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao atualizar categoria')
    },
  })
}

export function useDeleteFinancialCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/financial/categories/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao excluir categoria')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-categories'] })
      toast.success('Categoria excluída com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao excluir categoria')
    },
  })
}

// =====================================================
// MÉTODOS DE PAGAMENTO
// =====================================================

export function usePaymentMethods() {
  return useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      const res = await fetch('/api/financial/payment-methods')
      if (!res.ok) throw new Error('Erro ao buscar métodos de pagamento')
      return res.json() as Promise<PaymentMethod[]>
    },
  })
}

export function useCreatePaymentMethod() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: PaymentMethodInput) => {
      const res = await fetch('/api/financial/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) throw new Error('Erro ao criar método de pagamento')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] })
      toast.success('Método de pagamento criado com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao criar método de pagamento')
    },
  })
}

export function useDeletePaymentMethod() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/financial/payment-methods/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao excluir método de pagamento')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] })
      toast.success('Método de pagamento excluído com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao excluir método de pagamento')
    },
  })
}

// =====================================================
// CONTAS A RECEBER
// =====================================================

export function useReceivables() {
  return useQuery({
    queryKey: ['receivables'],
    queryFn: async () => {
      const res = await fetch('/api/financial/receivables')
      if (!res.ok) throw new Error('Erro ao buscar contas a receber')
      return res.json() as Promise<Receivable[]>
    },
  })
}

export function useCreateReceivable() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: ReceivableInput) => {
      const res = await fetch('/api/financial/receivables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) throw new Error('Erro ao criar conta a receber')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receivables'] })
      queryClient.invalidateQueries({ queryKey: ['financial-stats'] })
      toast.success('Conta a receber criada com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao criar conta a receber')
    },
  })
}

export function useUpdateReceivable() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<ReceivableInput> }) => {
      const res = await fetch(`/api/financial/receivables/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.details || err.error || 'Erro ao atualizar conta a receber')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receivables'] })
      queryClient.invalidateQueries({ queryKey: ['financial-stats'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Conta a receber atualizada com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteReceivable() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/financial/receivables/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao excluir conta a receber')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receivables'] })
      queryClient.invalidateQueries({ queryKey: ['financial-stats'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Conta a receber excluída com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao excluir conta a receber')
    },
  })
}

// =====================================================
// CONTAS A PAGAR
// =====================================================

export function usePayables() {
  return useQuery({
    queryKey: ['payables'],
    queryFn: async () => {
      const res = await fetch('/api/financial/payables')
      if (!res.ok) throw new Error('Erro ao buscar contas a pagar')
      return res.json() as Promise<Payable[]>
    },
  })
}

export function useCreatePayable() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: PayableInput) => {
      const res = await fetch('/api/financial/payables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) throw new Error('Erro ao criar conta a pagar')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payables'] })
      queryClient.invalidateQueries({ queryKey: ['financial-stats'] })
      toast.success('Conta a pagar criada com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar conta a pagar: ${error.message}`)
    },
  })
}

export function useUpdatePayable() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<PayableInput> }) => {
      const res = await fetch(`/api/financial/payables/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) throw new Error('Erro ao atualizar conta a pagar')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payables'] })
      queryClient.invalidateQueries({ queryKey: ['financial-stats'] })
      toast.success('Conta a pagar atualizada com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao atualizar conta a pagar')
    },
  })
}

export function useDeletePayable() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/financial/payables/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao excluir conta a pagar')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payables'] })
      queryClient.invalidateQueries({ queryKey: ['financial-stats'] })
      toast.success('Conta a pagar excluída com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao excluir conta a pagar')
    },
  })
}

// =====================================================
// TRANSAÇÕES
// =====================================================

export function useTransactions() {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const res = await fetch('/api/financial/transactions')
      if (!res.ok) throw new Error('Erro ao buscar transações')
      return res.json() as Promise<Transaction[]>
    },
  })
}

export function useCreateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: TransactionInput) => {
      const res = await fetch('/api/financial/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) throw new Error('Erro ao criar transação')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['financial-stats'] })
      toast.success('Transação criada com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao criar transação')
    },
  })
}
