'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Settings {
  siteName: string
  supportEmail: string
  maxUsersPerOrg: number
  maxClientsPerOrg: number
  maxServicesPerOrg: number
  maxOrdersPerOrg: number
  enableSignup: boolean
  enableTrialPlan: boolean
  trialDurationDays: number
  maintenanceMode?: boolean
  announcement?: string
}

interface SystemSettingsProps {
  settings: Settings
}

export function SystemSettings({ settings: initialSettings }: SystemSettingsProps) {
  const [settings, setSettings] = useState(initialSettings)
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)

  // Sync when parent finishes loading from API
  useEffect(() => {
    if (!hasChanges) setSettings(initialSettings)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSettings])

  const handleChange = (key: keyof Settings, value: Settings[keyof Settings]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/system-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_name:           settings.siteName,
          support_email:       settings.supportEmail,
          max_users_free:      settings.maxUsersPerOrg,
          max_clients_free:    settings.maxClientsPerOrg,
          max_services_free:   settings.maxServicesPerOrg,
          max_orders_free:     settings.maxOrdersPerOrg,
          enable_signup:       settings.enableSignup,
          enable_trial:        settings.enableTrialPlan,
          trial_duration_days: settings.trialDurationDays,
          maintenance_mode:    settings.maintenanceMode ?? false,
          announcement:        settings.announcement ?? '',
        }),
      })
      if (!res.ok) throw new Error('Erro ao salvar')
      toast.success('Configurações salvas com sucesso')
      setHasChanges(false)
    } catch {
      toast.error('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setSettings(initialSettings)
    setHasChanges(false)
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Configurações Gerais</h3>
          <p className="text-sm text-muted-foreground">
            Configure as opções globais do sistema
          </p>
        </div>
        {hasChanges && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleReset} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar Alterações
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <h4 className="font-medium">Informações Gerais</h4>
          <div className="space-y-2">
            <Label htmlFor="siteName">Nome do Site</Label>
            <Input id="siteName" value={settings.siteName} onChange={(e) => handleChange('siteName', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supportEmail">Email de Suporte</Label>
            <Input id="supportEmail" type="email" value={settings.supportEmail} onChange={(e) => handleChange('supportEmail', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="announcement">Aviso / Anúncio (deixe em branco para ocultar)</Label>
            <Input id="announcement" value={settings.announcement ?? ''} onChange={(e) => handleChange('announcement', e.target.value)} placeholder="Ex: Manutenção programada amanhã às 22h" />
          </div>
        </div>

        <hr className="border-border" />

        <div className="space-y-4">
          <h4 className="font-medium">Limites do Plano Free</h4>
          <p className="text-xs text-muted-foreground -mt-2">Defina os limites para organizações no plano gratuito. Alterações entram em vigor imediatamente.</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxClientsPerOrg">Clientes</Label>
              <Input id="maxClientsPerOrg" type="number" min="1" value={settings.maxClientsPerOrg} onChange={(e) => handleChange('maxClientsPerOrg', e.target.value === '' ? 0 : Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxServicesPerOrg">Serviços</Label>
              <Input id="maxServicesPerOrg" type="number" min="1" value={settings.maxServicesPerOrg} onChange={(e) => handleChange('maxServicesPerOrg', e.target.value === '' ? 0 : Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxOrdersPerOrg">Ordens de Serviço</Label>
              <Input id="maxOrdersPerOrg" type="number" min="1" value={settings.maxOrdersPerOrg} onChange={(e) => handleChange('maxOrdersPerOrg', e.target.value === '' ? 0 : Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxUsersPerOrg">Usuários</Label>
              <Input id="maxUsersPerOrg" type="number" min="1" value={settings.maxUsersPerOrg} onChange={(e) => handleChange('maxUsersPerOrg', e.target.value === '' ? 0 : Number(e.target.value))} />
            </div>
          </div>
        </div>

        <hr className="border-border" />

        <div className="space-y-4">
          <h4 className="font-medium">Cadastro e Período de Teste</h4>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enableSignup">Permitir Novos Cadastros</Label>
              <p className="text-sm text-muted-foreground">Permitir que novos usuários se cadastrem na plataforma</p>
            </div>
            <Switch id="enableSignup" checked={settings.enableSignup} onCheckedChange={(checked) => handleChange('enableSignup', checked)} />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enableTrialPlan">Habilitar Plano Trial</Label>
              <p className="text-sm text-muted-foreground">Oferecer período de teste para novos usuários</p>
            </div>
            <Switch id="enableTrialPlan" checked={settings.enableTrialPlan} onCheckedChange={(checked) => handleChange('enableTrialPlan', checked)} />
          </div>
          {settings.enableTrialPlan && (
            <div className="space-y-2 ml-6">
              <Label htmlFor="trialDurationDays">Duração do Trial (dias)</Label>
              <Input id="trialDurationDays" type="number" min="1" max="90" value={settings.trialDurationDays} onChange={(e) => handleChange('trialDurationDays', e.target.value === '' ? 0 : Number(e.target.value))} />
            </div>
          )}
        </div>

        <hr className="border-border" />

        <div className="space-y-4">
          <h4 className="font-medium">Sistema</h4>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="maintenanceMode">Modo Manutenção</Label>
              <p className="text-sm text-muted-foreground">Exibir página de manutenção para usuários não-admin</p>
            </div>
            <Switch id="maintenanceMode" checked={settings.maintenanceMode ?? false} onCheckedChange={(checked) => handleChange('maintenanceMode', checked)} />
          </div>
        </div>
      </div>
    </Card>
  )
}
