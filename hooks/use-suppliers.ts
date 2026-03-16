import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export interface Supplier {
  id: string
  organization_id: string
  nome: string
  nome_fantasia?: string
  tipo_pessoa?: 'fisica' | 'juridica'
  cpf_cnpj?: string
  telefone?: string
  email?: string
  cep?: string
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  estado?: string
  banco?: string
  agencia?: string
  conta?: string
  pix?: string
  observacoes?: string
  ativo: boolean
  created_at: string
  updated_at: string
}

export type SupplierInput = Omit<Supplier, 'id' | 'organization_id' | 'created_at' | 'updated_at'>

export function useSuppliers() {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const res = await fetch('/api/suppliers')
      if (!res.ok) throw new Error('Erro ao buscar fornecedores')
      return res.json() as Promise<Supplier[]>
    },
  })
}

export function useActiveSuppliers() {
  return useQuery({
    queryKey: ['suppliers', 'active'],
    queryFn: async () => {
      const res = await fetch('/api/suppliers')
      if (!res.ok) throw new Error('Erro ao buscar fornecedores')
      const data = await res.json() as Supplier[]
      return data.filter(s => s.ativo)
    },
  })
}

export function useCreateSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: SupplierInput) => {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) throw new Error('Erro ao cadastrar fornecedor')
      return res.json() as Promise<Supplier>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      toast.success('Fornecedor cadastrado com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao cadastrar fornecedor: ${error.message}`)
    },
  })
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SupplierInput> }) => {
      const res = await fetch(`/api/suppliers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Erro ao atualizar fornecedor')
      return res.json() as Promise<Supplier>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      toast.success('Fornecedor atualizado com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar fornecedor: ${error.message}`)
    },
  })
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao desativar fornecedor')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      toast.success('Fornecedor desativado com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao desativar fornecedor: ${error.message}`)
    },
  })
}
