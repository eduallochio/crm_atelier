'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

interface Settings {
  siteName: string
  supportEmail: string
  maxUsersPerOrg: number
  enableSignup: boolean
  enableTrialPlan: boolean
  trialDurationDays: number
}

interface SystemSettingsProps {
  settings: Settings
}

export function SystemSettings({ settings: initialSettings }: SystemSettingsProps) {
  const [settings, setSettings] = useState(initialSettings)
  const [hasChanges, setHasChanges] = useState(false)

  const handleChange = (key: keyof Settings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSave = () => {
    // TODO: Implementar salvamento de configurações
    console.log('Salvar configurações:', settings)
    setHasChanges(false)
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
            <Button variant="outline" onClick={handleReset}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar Alterações
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Informações Gerais */}
        <div className="space-y-4">
          <h4 className="font-medium">Informações Gerais</h4>
          
          <div className="space-y-2">
            <Label htmlFor="siteName">Nome do Site</Label>
            <Input
              id="siteName"
              value={settings.siteName}
              onChange={(e) => handleChange('siteName', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supportEmail">Email de Suporte</Label>
            <Input
              id="supportEmail"
              type="email"
              value={settings.supportEmail}
              onChange={(e) => handleChange('supportEmail', e.target.value)}
            />
          </div>
        </div>

        <hr className="border-border" />

        {/* Limites e Recursos */}
        <div className="space-y-4">
          <h4 className="font-medium">Limites e Recursos</h4>
          
          <div className="space-y-2">
            <Label htmlFor="maxUsersPerOrg">Máximo de Usuários por Organização (Free)</Label>
            <Input
              id="maxUsersPerOrg"
              type="number"
              min="1"
              value={settings.maxUsersPerOrg}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 1
                handleChange('maxUsersPerOrg', value)
              }}
            />
            <p className="text-xs text-muted-foreground">
              Limite de usuários para organizações no plano gratuito
            </p>
          </div>
        </div>

        <hr className="border-border" />

        {/* Cadastro e Trial */}
        <div className="space-y-4">
          <h4 className="font-medium">Cadastro e Período de Teste</h4>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enableSignup">Permitir Novos Cadastros</Label>
              <p className="text-sm text-muted-foreground">
                Permitir que novos usuários se cadastrem na plataforma
              </p>
            </div>
            <Switch
              id="enableSignup"
              checked={settings.enableSignup}
              onCheckedChange={(checked) => handleChange('enableSignup', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enableTrialPlan">Habilitar Plano Trial</Label>
              <p className="text-sm text-muted-foreground">
                Oferecer período de teste para novos usuários
              </p>
            </div>
            <Switch
              id="enableTrialPlan"
              checked={settings.enableTrialPlan}
              onCheckedChange={(checked) => handleChange('enableTrialPlan', checked)}
            />
          </div>

          {settings.enableTrialPlan && (
            <div className="space-y-2 ml-6">
              <Label htmlFor="trialDurationDays">Duração do Trial (dias)</Label>
              <Input
                id="trialDurationDays"
                type="number"
                min="1"
                max="90"
                value={settings.trialDurationDays}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1
                  handleChange('trialDurationDays', value)
                }}
              />
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
