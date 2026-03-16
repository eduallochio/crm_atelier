'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
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

export function useOrganizationSettings() {
  return useQuery({
    queryKey: ['organization-settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings/organization')
      if (!res.ok) throw new Error('Erro ao buscar configurações da organização')
      return res.json() as Promise<OrganizationSettings>
    },
  })
}

export function useUpdateOrganizationSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: OrganizationSettingsInput & { id: string }) => {
      const res = await fetch('/api/settings/organization', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) throw new Error('Erro ao atualizar configurações da organização')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-settings'] })
    },
  })
}

export function useCustomizationSettings() {
  return useQuery({
    queryKey: ['customization-settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings/customization')
      if (!res.ok) throw new Error('Erro ao buscar configurações de customização')
      return res.json() as Promise<CustomizationSettings>
    },
  })
}

export function useUpdateCustomizationSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CustomizationSettingsInput & { id: string; organization_id: string }) => {
      const res = await fetch('/api/settings/customization', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) throw new Error('Erro ao atualizar customização')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customization-settings'] })
    },
  })
}

export function useFinancialSettings() {
  return useQuery({
    queryKey: ['financial-settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings/financial')
      if (!res.ok) throw new Error('Erro ao buscar configurações financeiras')
      return res.json() as Promise<FinancialSettings>
    },
  })
}

export function useUpdateFinancialSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: FinancialSettingsInput & { organization_id: string }) => {
      const res = await fetch('/api/settings/financial', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) throw new Error('Erro ao atualizar configurações financeiras')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-settings'] })
    },
  })
}

export function useNotificationSettings() {
  return useQuery({
    queryKey: ['notification-settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings/notifications')
      if (!res.ok) throw new Error('Erro ao buscar configurações de notificações')
      return res.json() as Promise<NotificationSettings>
    },
  })
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: NotificationSettingsInput & { organization_id: string }) => {
      const res = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) throw new Error('Erro ao salvar configurações de notificações')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] })
      toast.success('Configurações de notificações salvas com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao salvar configurações: ${error.message}`)
    },
  })
}

export function useOrderSettings() {
  return useQuery({
    queryKey: ['order-settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings/orders')
      if (!res.ok) throw new Error('Erro ao buscar configurações de ordens')
      return res.json() as Promise<OrderSettings>
    },
  })
}

export function useUpdateOrderSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: OrderSettingsInput & { organization_id: string }) => {
      const res = await fetch('/api/settings/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) throw new Error('Erro ao salvar configurações de ordens')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-settings'] })
      toast.success('Configurações de ordens salvas com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao salvar configurações: ${error.message}`)
    },
  })
}

export function useSystemPreferences() {
  return useQuery({
    queryKey: ['system-preferences'],
    queryFn: async () => {
      const res = await fetch('/api/settings/system')
      if (!res.ok) throw new Error('Erro ao buscar preferências do sistema')
      return res.json() as Promise<SystemPreferences>
    },
  })
}

export function useUpdateSystemPreferences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: SystemPreferencesInput & { organization_id: string }) => {
      const res = await fetch('/api/settings/system', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) throw new Error('Erro ao salvar preferências do sistema')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-preferences'] })
    },
  })
}
