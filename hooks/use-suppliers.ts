import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const supabase = createClient()

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

// Buscar fornecedores
export function useSuppliers() {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      // Buscar o profile do usuário para pegar organization_id
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile?.organization_id) return []
      
      const { data, error } = await supabase
        .from('org_suppliers')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('nome', { ascending: true })
      
      if (error) throw error
      return data as Supplier[]
    },
  })
}

// Buscar fornecedores ativos
export function useActiveSuppliers() {
  return useQuery({
    queryKey: ['suppliers', 'active'],
    queryFn: async () => {
      // Buscar o profile do usuário para pegar organization_id
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile?.organization_id) return []
      
      const { data, error } = await supabase
        .from('org_suppliers')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .eq('ativo', true)
        .order('nome', { ascending: true })
      
      if (error) throw error
      return data as Supplier[]
    },
  })
}

// Criar fornecedor
export function useCreateSupplier() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (input: SupplierInput) => {
      console.log('[CreateSupplier] Dados recebidos:', input)
      
      // Buscar organization_id do usuário
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()
      
      if (!profile?.organization_id) {
        console.error('[CreateSupplier] Perfil sem organization_id:', profile)
        throw new Error('Organização não encontrada no perfil')
      }
      
      const supplierData = {
        ...input,
        organization_id: profile.organization_id,
      }
      
      console.log('[CreateSupplier] Dados a inserir:', supplierData)
      
      const { data, error } = await supabase
        .from('org_suppliers')
        .insert(supplierData)
        .select()
        .single()
      
      if (error) {
        console.error('[CreateSupplier] Erro Supabase:', error)
        throw error
      }
      
      console.log('[CreateSupplier] Fornecedor criado:', data)
      return data as Supplier
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      toast.success('Fornecedor cadastrado com sucesso!')
    },
    onError: (error: any) => {
      console.error('[CreateSupplier] Erro completo:', error)
      toast.error(`Erro ao cadastrar fornecedor: ${error.message || 'Desconhecido'}`)
    },
  })
}

// Atualizar fornecedor
export function useUpdateSupplier() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SupplierInput> }) => {
      console.log('[UpdateSupplier] ID:', id, 'Dados:', data)
      
      const { data: updated, error } = await supabase
        .from('org_suppliers')
        .update(data)
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        console.error('[UpdateSupplier] Erro Supabase:', error)
        throw error
      }
      
      console.log('[UpdateSupplier] Fornecedor atualizado:', updated)
      return updated as Supplier
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      toast.success('Fornecedor atualizado com sucesso!')
    },
    onError: (error: any) => {
      console.error('[UpdateSupplier] Erro completo:', error)
      toast.error(`Erro ao atualizar fornecedor: ${error.message || 'Desconhecido'}`)
    },
  })
}

// Deletar fornecedor (soft delete - marca como inativo)
export function useDeleteSupplier() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      console.log('[DeleteSupplier] ID:', id)
      
      const { error } = await supabase
        .from('org_suppliers')
        .update({ ativo: false })
        .eq('id', id)
      
      if (error) {
        console.error('[DeleteSupplier] Erro Supabase:', error)
        throw error
      }
      
      console.log('[DeleteSupplier] Fornecedor desativado:', id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      toast.success('Fornecedor desativado com sucesso!')
    },
    onError: (error: any) => {
      console.error('[DeleteSupplier] Erro completo:', error)
      toast.error(`Erro ao desativar fornecedor: ${error.message || 'Desconhecido'}`)
    },
  })
}
