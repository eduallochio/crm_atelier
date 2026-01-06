'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { ServiceOrder, ServiceOrderInput } from '@/lib/validations/service-order'
import { toast } from 'sonner'

export function useServiceOrders() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['service-orders'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile) throw new Error('Perfil não encontrado')

      const { data, error } = await supabase
        .from('org_service_orders')
        .select(`
          *,
          client:org_clients!client_id(id, nome, telefone, email),
          items:org_service_order_items(*)
        `)
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as ServiceOrder[]
    },
  })
}

export function useServiceOrder(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['service-order', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('org_service_orders')
        .select(`
          *,
          client:org_clients!client_id(id, nome, telefone, email),
          items:org_service_order_items(*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data as ServiceOrder
    },
    enabled: !!id,
  })
}

export function useCreateServiceOrder() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: ServiceOrderInput) => {
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
        .from('org_service_orders')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id)

      // @ts-ignore
      if (profile.organization.plan === 'free' && count && count >= 100) {
        throw new Error('Limite de ordens de serviço atingido. Faça upgrade para o plano Enterprise.')
      }

      // Calcular valor total
      const subtotal = input.items.reduce((sum, item) => sum + item.valor_total, 0)
      
      // Aplicar desconto
      let valorDesconto = 0
      if (input.desconto_percentual && input.desconto_percentual > 0) {
        valorDesconto = (subtotal * input.desconto_percentual) / 100
      } else if (input.desconto_valor && input.desconto_valor > 0) {
        valorDesconto = input.desconto_valor
      }
      
      const valor_total = Math.max(0, subtotal - valorDesconto)
      const valor_entrada = input.valor_entrada || 0
      const valor_pago = valor_entrada
      
      // Determinar status de pagamento
      let status_pagamento: 'pendente' | 'parcial' | 'pago' = 'pendente'
      if (valor_pago >= valor_total && valor_total > 0) {
        status_pagamento = 'pago'
      } else if (valor_pago > 0) {
        status_pagamento = 'parcial'
      }

      // Obter próximo número da ordem para a organização
      const { data: numeroData, error: numeroError } = await supabase
        .rpc('get_next_order_numero', { org_id: profile.organization_id })

      if (numeroError) {
        console.error('Erro ao obter número da ordem:', numeroError)
      }

      const numero = numeroData || 1

      // Criar ordem
      const { data: order, error: orderError } = await supabase
        .from('org_service_orders')
        .insert({
          organization_id: profile.organization_id,
          numero,
          client_id: input.client_id,
          status: input.status,
          valor_total,
          valor_entrada: valor_entrada,
          valor_pago: valor_pago,
          status_pagamento: status_pagamento,
          desconto_valor: input.desconto_valor || 0,
          desconto_percentual: input.desconto_percentual || 0,
          data_prevista: input.data_prevista || null,
          observacoes: input.observacoes || null,
          notas_internas: input.notas_internas || null,
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Criar itens da ordem
      const itemsToInsert = input.items.map(item => ({
        order_id: order.id,
        service_id: item.service_id,
        service_nome: item.service_nome,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
        valor_total: item.valor_total,
      }))

      const { error: itemsError } = await supabase
        .from('org_service_order_items')
        .insert(itemsToInsert)

      if (itemsError) throw itemsError

      return order
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] })
      toast.success('Ordem de serviço criada com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateServiceOrder() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<ServiceOrderInput> }) => {
      const updateData: any = {
        status: input.status,
        data_prevista: input.data_prevista || null,
        observacoes: input.observacoes || null,
      }

      // Atualizar data de conclusão se status for concluído
      if (input.status === 'concluido') {
        updateData.data_conclusao = new Date().toISOString()
        
        // Buscar dados da ordem para criar conta a receber
        const { data: order, error: fetchError } = await supabase
          .from('org_service_orders')
          .select('*, client:org_clients!client_id(nome)')
          .eq('id', id)
          .single()

        if (fetchError) throw fetchError

        // Verificar se já existe uma conta a receber para esta ordem
        const { data: existingReceivable } = await supabase
          .from('org_receivables')
          .select('id')
          .eq('service_order_id', id)
          .maybeSingle()

        // Criar conta a receber se não existir e há saldo a receber
        const saldoRestante = (order.valor_total || 0) - (order.valor_pago || 0)
        if (!existingReceivable && saldoRestante > 0) {
          const dataVencimento = new Date()
          dataVencimento.setDate(dataVencimento.getDate() + 7) // 7 dias após conclusão

          await supabase
            .from('org_receivables')
            .insert({
              organization_id: order.organization_id,
              service_order_id: id,
              client_id: order.client_id,
              descricao: `OS #${order.numero} - ${order.client?.nome || 'Cliente'}`,
              valor: saldoRestante,
              data_vencimento: dataVencimento.toISOString().split('T')[0],
              status: 'pendente',
              observacoes: 'Gerado automaticamente na conclusão da ordem de serviço',
            })
        }
      }

      const { data, error } = await supabase
        .from('org_service_orders')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] })
      queryClient.invalidateQueries({ queryKey: ['receivables'] })
      toast.success('Ordem de serviço atualizada com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteServiceOrder() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      // Os itens serão deletados automaticamente por CASCADE
      const { error } = await supabase
        .from('org_service_orders')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] })
      toast.success('Ordem de serviço removida com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}
