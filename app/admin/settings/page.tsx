'use client'

import { useEffect, useState } from 'react'
import { AdminsManagement } from '@/components/admin/admins-management'
import { SystemSettings } from '@/components/admin/system-settings'
import { PermissionsManagement } from '@/components/admin/permissions-management'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Admin {
  id: string
  name: string
  email: string
  role: 'super_admin' | 'admin' | 'support' | 'billing'
  createdAt: string
  lastLogin?: string
}

interface SystemSettingsData {
  siteName: string
  supportEmail: string
  maxUsersPerOrg: number
  maxClientsPerOrg: number
  maxServicesPerOrg: number
  maxOrdersPerOrg: number
  enableSignup: boolean
  enableTrialPlan: boolean
  trialDurationDays: number
  maintenanceMode: boolean
  announcement: string
}

const DEFAULTS: SystemSettingsData = {
  siteName: 'Meu Atelier',
  supportEmail: 'suporte@meuatelier.com',
  maxUsersPerOrg: 3,
  maxClientsPerOrg: 50,
  maxServicesPerOrg: 20,
  maxOrdersPerOrg: 100,
  enableSignup: true,
  enableTrialPlan: true,
  trialDurationDays: 14,
  maintenanceMode: false,
  announcement: '',
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettingsData>(DEFAULTS)
  const [admins, setAdmins] = useState<Admin[]>([])

  const fetchSettings = () => {
    fetch('/api/admin/system-settings')
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setSettings({
            siteName:          data.site_name           ?? DEFAULTS.siteName,
            supportEmail:      data.support_email       ?? DEFAULTS.supportEmail,
            maxUsersPerOrg:    data.max_users_free       ?? DEFAULTS.maxUsersPerOrg,
            maxClientsPerOrg:  data.max_clients_free     ?? DEFAULTS.maxClientsPerOrg,
            maxServicesPerOrg: data.max_services_free    ?? DEFAULTS.maxServicesPerOrg,
            maxOrdersPerOrg:   data.max_orders_free      ?? DEFAULTS.maxOrdersPerOrg,
            enableSignup:      data.enable_signup        ?? DEFAULTS.enableSignup,
            enableTrialPlan:   data.enable_trial         ?? DEFAULTS.enableTrialPlan,
            trialDurationDays: data.trial_duration_days  ?? DEFAULTS.trialDurationDays,
            maintenanceMode:   data.maintenance_mode     ?? DEFAULTS.maintenanceMode,
            announcement:      data.announcement         ?? '',
          })
        }
      })
      .catch(() => {})
  }

  const fetchAdmins = () => {
    fetch('/api/admin/users')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setAdmins(data) })
      .catch(() => {})
  }

  useEffect(() => {
    fetchSettings()
    fetchAdmins()
  }, [])

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="text-zinc-400 text-sm mt-1">Gerencie admins e configurações do sistema</p>
      </div>

      <Tabs defaultValue="system" className="space-y-6">
        <TabsList>
          <TabsTrigger value="admins">Gestão de Admins</TabsTrigger>
          <TabsTrigger value="system">Configurações do Sistema</TabsTrigger>
          <TabsTrigger value="permissions">Permissões</TabsTrigger>
        </TabsList>

        <TabsContent value="admins">
          <AdminsManagement admins={admins} onRefresh={fetchAdmins} />
        </TabsContent>

        <TabsContent value="system">
          <SystemSettings settings={settings} />
        </TabsContent>

        <TabsContent value="permissions">
          <PermissionsManagement />
        </TabsContent>
      </Tabs>
    </div>
  )
}
