'use client'

import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { OrganizationSettingsForm } from '@/components/settings/organization-settings-form'
import { FinancialSettingsForm } from '@/components/settings/financial-settings-form'
import { NotificationSettingsForm } from '@/components/settings/notification-settings-form'
import { OrderSettingsForm } from '@/components/settings/order-settings-form'
import { Building2, DollarSign, Bell, FileText, Settings } from 'lucide-react'

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState('empresa')

  return (
    <div className="p-8 pb-16 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie as configurações do seu sistema de forma organizada e eficiente
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-5 mb-8">
          <TabsTrigger value="empresa" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Empresa</span>
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
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Informações da Empresa</h2>
              <p className="text-muted-foreground mb-6">
                Configure os dados da sua empresa que aparecerão em documentos e relatórios
              </p>
            </div>
            <OrganizationSettingsForm />
          </div>
        </TabsContent>

        <TabsContent value="financeiro">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Configurações Financeiras</h2>
              <p className="text-muted-foreground mb-6">
                Gerencie formas de pagamento, taxas e configurações de caixa
              </p>
            </div>
            <FinancialSettingsForm />
          </div>
        </TabsContent>

        <TabsContent value="ordens">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Ordens de Serviço</h2>
              <p className="text-muted-foreground mb-6">
                Configure numeração, status e campos obrigatórios das ordens de serviço
              </p>
            </div>
            <OrderSettingsForm />
          </div>
        </TabsContent>

        <TabsContent value="notificacoes">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Notificações</h2>
              <p className="text-muted-foreground mb-6">
                Configure lembretes e alertas para manter você informado sobre eventos importantes
              </p>
            </div>
            <NotificationSettingsForm />
          </div>
        </TabsContent>

        <TabsContent value="sistema">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Preferências do Sistema</h2>
              <p className="text-muted-foreground mb-6">
                Personalize a aparência e o comportamento do sistema
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                🚧 Em desenvolvimento: Configurações de tema, idioma, fuso horário e outras preferências do sistema estarão disponíveis em breve.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
