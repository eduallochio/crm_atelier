'use client'

import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { OrganizationSettingsForm } from '@/components/settings/organization-settings-form'
import { FinancialSettingsForm } from '@/components/settings/financial-settings-form'
import { NotificationSettingsForm } from '@/components/settings/notification-settings-form'
import { OrderSettingsForm } from '@/components/settings/order-settings-form'
import { SystemSettingsForm } from '@/components/settings/system-settings-form'
import { UsersManagementForm } from '@/components/settings/users-management-form'
import { Building2, DollarSign, Bell, FileText, Settings, Users } from 'lucide-react'

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState('empresa')

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie as configurações do seu sistema de forma organizada e eficiente
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 mb-8">
          <TabsTrigger value="empresa" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Empresa</span>
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Usuários</span>
          </TabsTrigger>
          <TabsTrigger value="financeiro" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Financeiro</span>
          </TabsTrigger>
          <TabsTrigger value="ordens" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Ordens</span>
          </TabsTrigger>
          <TabsTrigger value="notificacoes" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notificações</span>
          </TabsTrigger>
          <TabsTrigger value="sistema" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Sistema</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="empresa">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Informações da Empresa</h2>
            <p className="text-muted-foreground mb-6">
              Configure os dados da sua empresa que aparecerão em documentos e relatórios
            </p>
          </div>
          <OrganizationSettingsForm />
        </TabsContent>

        <TabsContent value="usuarios">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Usuários</h2>
            <p className="text-muted-foreground mb-6">
              Gerencie quem tem acesso ao sistema e defina os cargos de cada membro da equipe
            </p>
          </div>
          <UsersManagementForm />
        </TabsContent>

        <TabsContent value="financeiro">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Configurações Financeiras</h2>
            <p className="text-muted-foreground mb-6">
              Gerencie formas de pagamento, taxas e configurações de caixa
            </p>
          </div>
          <FinancialSettingsForm />
        </TabsContent>

        <TabsContent value="ordens">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Ordens de Serviço</h2>
            <p className="text-muted-foreground mb-6">
              Configure numeração, status e campos obrigatórios das ordens de serviço
            </p>
          </div>
          <OrderSettingsForm />
        </TabsContent>

        <TabsContent value="notificacoes">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Notificações</h2>
            <p className="text-muted-foreground mb-6">
              Configure lembretes e alertas para manter você informado sobre eventos importantes
            </p>
          </div>
          <NotificationSettingsForm />
        </TabsContent>

        <TabsContent value="sistema">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Preferências do Sistema</h2>
            <p className="text-muted-foreground mb-6">
              Personalize a aparência, idioma e formatos do sistema
            </p>
          </div>
          <SystemSettingsForm />
        </TabsContent>
      </Tabs>
    </div>
  )
}
