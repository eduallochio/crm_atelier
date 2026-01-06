'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
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

const supabase = createClient()

// =====================================================
// CATEGORIAS FINANCEIRAS
// =====================================================

export function useFinancialCategories() {
  return useQuery({
    queryKey: ['financial-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('org_financial_categories')
        .select('*')
        .order('tipo', { ascending: true })
        .order('nome', { ascending: true })

      if (error) throw error
      return data as FinancialCategory[]
    },
  })
}

export function useCreateFinancialCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: FinancialCategoryInput) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single()

      if (!profile) throw new Error('Perfil não encontrado')

      const { data, error } = await supabase
        .from('org_financial_categories')
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
      const { error } = await supabase
        .from('org_financial_categories')
        .update(input)
        .eq('id', id)

      if (error) throw error
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
      const { error } = await supabase
        .from('org_financial_categories')
        .delete()
        .eq('id', id)

      if (error) throw error
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
      const { data, error } = await supabase
        .from('org_payment_methods')
        .select('*')
        .order('nome', { ascending: true })

      if (error) throw error
      return data as PaymentMethod[]
    },
  })
}

export function useCreatePaymentMethod() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: PaymentMethodInput) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single()

      if (!profile) throw new Error('Perfil não encontrado')

      const { data, error } = await supabase
        .from('org_payment_methods')
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
      const { error } = await supabase
        .from('org_payment_methods')
        .delete()
        .eq('id', id)

      if (error) throw error
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
      const { data, error } = await supabase
        .from('org_receivables')
        .select('*')
        .order('data_vencimento', { ascending: false })

      if (error) throw error
      return data as Receivable[]
    },
  })
}

export function useCreateReceivable() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: ReceivableInput) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single()

      if (!profile) throw new Error('Perfil não encontrado')

      const valorNumerico = parseFloat(input.valor.replace(',', '.'))

      const { data, error } = await supabase
        .from('org_receivables')
        .insert({
          ...input,
          valor: valorNumerico,
          organization_id: profile.organization_id,
        })
        .select()
        .single()

      if (error) throw error
      return data
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
      const updateData: any = { ...input }
      
      if (input.valor) {
        updateData.valor = parseFloat(input.valor.replace(',', '.'))
      }

      const { error } = await supabase
        .from('org_receivables')
        .update(updateData)
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receivables'] })
      queryClient.invalidateQueries({ queryKey: ['financial-stats'] })
      toast.success('Conta a receber atualizada com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao atualizar conta a receber')
    },
  })
}

export function useDeleteReceivable() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('org_receivables')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receivables'] })
      queryClient.invalidateQueries({ queryKey: ['financial-stats'] })
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
      const { data, error } = await supabase
        .from('org_payables')
        .select('*')
        .order('data_vencimento', { ascending: false })

      if (error) throw error
      return data as Payable[]
    },
  })
}

export function useCreatePayable() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: PayableInput) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single()

      if (!profile) throw new Error('Perfil não encontrado')

      const valorNumerico = parseFloat(input.valor.replace(',', '.'))

      const { data, error } = await supabase
        .from('org_payables')
        .insert({
          ...input,
          valor: valorNumerico,
          organization_id: profile.organization_id,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payables'] })
      queryClient.invalidateQueries({ queryKey: ['financial-stats'] })
      toast.success('Conta a pagar criada com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao criar conta a pagar')
    },
  })
}

export function useUpdatePayable() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<PayableInput> }) => {
      const updateData: any = { ...input }
      
      if (input.valor) {
        updateData.valor = parseFloat(input.valor.replace(',', '.'))
      }

      const { error } = await supabase
        .from('org_payables')
        .update(updateData)
        .eq('id', id)

      if (error) throw error
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
      const { error } = await supabase
        .from('org_payables')
        .delete()
        .eq('id', id)

      if (error) throw error
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
      const { data, error } = await supabase
        .from('org_transactions')
        .select('*')
        .order('data', { ascending: false })

      if (error) throw error
      return data as Transaction[]
    },
  })
}

export function useCreateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: TransactionInput) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single()

      if (!profile) throw new Error('Perfil não encontrado')

      const valorNumerico = parseFloat(input.valor.replace(',', '.'))

      const { data, error } = await supabase
        .from('org_transactions')
        .insert({
          ...input,
          valor: valorNumerico,
          organization_id: profile.organization_id,
        })
        .select()
        .single()

      if (error) throw error
      return data
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
