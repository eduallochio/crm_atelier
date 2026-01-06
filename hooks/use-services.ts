'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Service, ServiceInput } from '@/lib/validations/service'
import { toast } from 'sonner'

export function useServices() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      // Buscar o profile do usuário para pegar organization_id
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile) throw new Error('Perfil não encontrado')

      // Buscar serviços da organização
      const { data, error } = await supabase
        .from('org_services')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Service[]
    },
  })
}

export function useCreateService() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: ServiceInput) => {
      // Buscar organization_id do usuário
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, organization:organizations(plan)')
        .eq('id', user.id)
        .single()

      if (!profile) throw new Error('Perfil não encontrado')

      // Verificar limites do plano
      const { count } = await supabase
        .from('org_services')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id)

      // @ts-ignore
      if (profile.organization.plan === 'free' && count && count >= 20) {
        throw new Error('Limite de serviços atingido. Faça upgrade para o plano Enterprise.')
      }

      // Converter preço de string para número
      const precoNumero = parseFloat(input.preco.replace(/[^\d,]/g, '').replace(',', '.'))

      // Criar serviço
      const { data, error } = await supabase
        .from('org_services')
        .insert({
          nome: input.nome,
          descricao: input.descricao || null,
          preco: precoNumero,
          categoria: input.categoria || null,
          tempo_estimado: input.tempo_estimado || null,
          ativo: input.ativo,
          organization_id: profile.organization_id,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      toast.success('Serviço cadastrado com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateService() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ServiceInput }) => {
      // Converter preço de string para número
      const precoNumero = parseFloat(input.preco.replace(/[^\d,]/g, '').replace(',', '.'))

      const { data, error } = await supabase
        .from('org_services')
        .update({
          nome: input.nome,
          descricao: input.descricao || null,
          preco: precoNumero,
          categoria: input.categoria || null,
          tempo_estimado: input.tempo_estimado || null,
          ativo: input.ativo,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      toast.success('Serviço atualizado com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteService() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('org_services')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      toast.success('Serviço removido com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useToggleServiceStatus() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { data, error } = await supabase
        .from('org_services')
        .update({ ativo })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      toast.success(`Serviço ${variables.ativo ? 'ativado' : 'desativado'} com sucesso!`)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}
