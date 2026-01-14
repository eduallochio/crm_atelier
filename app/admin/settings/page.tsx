import { Header } from '@/components/layouts/header'
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

export default function AdminSettingsPage() {
  // TODO: Substituir por hooks reais:
  // const { admins } = useAdmins()
  // const { settings, updateSettings } = useSystemSettings()

  const admins: Admin[] = []

  const settings = {
    siteName: 'CRM Ateliê',
    supportEmail: 'suporte@crmatelier.com',
    maxUsersPerOrg: 10,
    enableSignup: true,
    enableTrialPlan: true,
    trialDurationDays: 14,
  }

  return (
    <div>
      <Header
        title="Configurações"
        description="Gerencie admins e configurações do sistema"
      />

      <div className="p-6">
        <Tabs defaultValue="admins" className="space-y-6">
          <TabsList>
            <TabsTrigger value="admins">Gestão de Admins</TabsTrigger>
            <TabsTrigger value="system">Configurações do Sistema</TabsTrigger>
            <TabsTrigger value="permissions">Permissões</TabsTrigger>
          </TabsList>

          <TabsContent value="admins">
            <AdminsManagement admins={admins} />
          </TabsContent>

          <TabsContent value="system">
            <SystemSettings settings={settings} />
          </TabsContent>

          <TabsContent value="permissions">
            <PermissionsManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
