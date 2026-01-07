'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type {
  OrganizationSettings,
  CustomizationSettings,
  FinancialSettings,
  NotificationSettings,
  OrderSettings,
  SystemPreferences,
} from '@/types/settings'
import type {
  OrganizationSettingsInput,
  CustomizationSettingsInput,
  FinancialSettingsInput,
  NotificationSettingsInput,
  OrderSettingsInput,
  SystemPreferencesInput,
} from '@/lib/validations/settings'

const supabase = createClient()

// Hook para buscar configurações da organização
export function useOrganizationSettings() {
  return useQuery({
    queryKey: ['organization-settings'],
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
        .from('organizations')
        .select('*')
        .eq('id', profile.organization_id)
        .single()

      if (error) throw error
      return data as OrganizationSettings
    },
  })
}

// Hook para atualizar configurações da organização
export function useUpdateOrganizationSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: OrganizationSettingsInput & { id: string }) => {
      const { id, ...data } = input
      const { error } = await supabase
        .from('organizations')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-settings'] })
    },
  })
}

// Hook para buscar configurações de customização
export function useCustomizationSettings() {
  return useQuery({
    queryKey: ['customization-settings'],
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
        .from('customization_settings')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .maybeSingle()

      if (error) throw error
      
      // Se não existir, criar com valores padrão
      if (!data) {
        const { data: newData, error: createError } = await supabase
          .from('customization_settings')
          .insert({
            organization_id: profile.organization_id,
            primary_color: '#3b82f6',
            secondary_color: '#10b981',
          })
          .select()
          .single()

        if (createError) throw createError
        return newData as CustomizationSettings
      }

      return data as CustomizationSettings
    },
  })
}

// Hook para atualizar configurações de customização
export function useUpdateCustomizationSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CustomizationSettingsInput & { id: string; organization_id: string }) => {
      const { id, organization_id, ...data } = input
      const { error } = await supabase
        .from('customization_settings')
        .upsert({
          id,
          organization_id,
          ...data,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customization-settings'] })
    },
  })
}

// Hook para buscar configurações financeiras
export function useFinancialSettings() {
  return useQuery({
    queryKey: ['financial-settings'],
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
        .from('org_financial_settings')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .maybeSingle()

      if (error) throw error

      // Se não existir, retornar valores padrão
      if (!data) {
        return {
          id: '',
          organization_id: profile.organization_id,
          payment_methods: {
            dinheiro: true,
            pix: true,
            credito: true,
            debito: true,
            outros: true,
          },
          cashier_requires_opening: true,
          cashier_opening_balance_required: false,
          expense_categories: [],
          income_categories: [],
          updated_at: new Date().toISOString(),
        } as FinancialSettings
      }

      return data as FinancialSettings
    },
  })
}

// Hook para atualizar configurações financeiras
export function useUpdateFinancialSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: FinancialSettingsInput & { organization_id: string }) => {
      const { organization_id, ...data } = input
      const { error } = await supabase
        .from('org_financial_settings')
        .upsert({
          organization_id,
          ...data,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-settings'] })
    },
  })
}

// Hook para buscar configurações de notificações
export function useNotificationSettings() {
  return useQuery({
    queryKey: ['notification-settings'],
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
        .from('org_notification_settings')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .maybeSingle()

      if (error) throw error

      // Se não existir, retornar valores padrão
      if (!data) {
        return {
          id: '',
          organization_id: profile.organization_id,
          notify_client_birthday: true,
          notify_order_ready: true,
          notify_payment_reminder: true,
          notify_order_delayed: true,
          notify_low_stock: false,
          notify_new_client: false,
          email_notifications_enabled: false,
          birthday_reminder_days: 7,
          payment_reminder_days: 3,
          order_reminder_days: 1,
          updated_at: new Date().toISOString(),
        } as NotificationSettings
      }

      return data as NotificationSettings
    },
  })
}

// Hook para atualizar configurações de notificações
export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: NotificationSettingsInput & { organization_id: string }) => {
      const { organization_id, ...data } = input
      const { error } = await supabase
        .from('org_notification_settings')
        .upsert({
          organization_id,
          ...data,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] })
    },
  })
}

// Hook para buscar configurações de ordens
export function useOrderSettings() {
  return useQuery({
    queryKey: ['order-settings'],
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
        .from('org_order_settings')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .maybeSingle()

      if (error) throw error

      // Se não existir, retornar valores padrão
      if (!data) {
        return {
          id: '',
          organization_id: profile.organization_id,
          order_prefix: 'OS',
          order_start_number: 1,
          order_number_format: 'sequential',
          default_status: 'pendente',
          require_client: true,
          require_service: true,
          require_delivery_date: true,
          require_payment_method: false,
          default_delivery_days: 7,
          updated_at: new Date().toISOString(),
        } as OrderSettings
      }

      return data as OrderSettings
    },
  })
}

// Hook para atualizar configurações de ordens
export function useUpdateOrderSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: OrderSettingsInput & { organization_id: string }) => {
      const { organization_id, ...data } = input
      const { error } = await supabase
        .from('org_order_settings')
        .upsert({
          organization_id,
          ...data,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-settings'] })
    },
  })
}

// Hook para buscar preferências do sistema
export function useSystemPreferences() {
  return useQuery({
    queryKey: ['system-preferences'],
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
        .from('org_system_preferences')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .maybeSingle()

      if (error) throw error

      // Se não existir, retornar valores padrão
      if (!data) {
        return {
          id: '',
          organization_id: profile.organization_id,
          date_format: 'dd/MM/yyyy',
          time_format: '24h',
          currency: 'BRL',
          timezone: 'America/Sao_Paulo',
          language: 'pt-BR',
          theme: 'light',
          compact_mode: false,
          show_tooltips: true,
          updated_at: new Date().toISOString(),
        } as SystemPreferences
      }

      return data as SystemPreferences
    },
  })
}

// Hook para atualizar preferências do sistema
export function useUpdateSystemPreferences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: SystemPreferencesInput & { organization_id: string }) => {
      const { organization_id, ...data } = input
      const { error } = await supabase
        .from('org_system_preferences')
        .upsert(
          {
            organization_id,
            ...data,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'organization_id',
          }
        )

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-preferences'] })
    },
  })
}
