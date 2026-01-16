'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSystemPreferences, useUpdateSystemPreferences } from '@/hooks/use-settings'
import { Loader2, Monitor } from 'lucide-react'
import { useWatch } from 'react-hook-form'
import { useEffect } from 'react'
import { toast } from 'sonner'

const systemSettingsSchema = z.object({
  language: z.enum(['pt-BR', 'en-US', 'es-ES']),
  timezone: z.string(),
  date_format: z.enum(['dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd']),
  time_format: z.enum(['12h', '24h']),
  currency: z.enum(['BRL', 'USD', 'EUR']),
})

type SystemSettings = z.infer<typeof systemSettingsSchema>

const LANGUAGES = [
  { value: 'pt-BR' as const, label: 'Português (Brasil)' },
  { value: 'en-US' as const, label: 'English (US)' },
  { value: 'es-ES' as const, label: 'Español' },
] as const

const TIMEZONES = [
  { value: 'America/Sao_Paulo', label: 'Brasília (GMT-3)' },
  { value: 'America/New_York', label: 'Nova York (GMT-5)' },
  { value: 'Europe/London', label: 'Londres (GMT+0)' },
  { value: 'Europe/Madrid', label: 'Madri (GMT+1)' },
  { value: 'Asia/Tokyo', label: 'Tóquio (GMT+9)' },
] as const

const CURRENCIES = [
  { value: 'BRL' as const, label: 'Real Brasileiro', symbol: 'R$' },
  { value: 'USD' as const, label: 'Dólar Americano', symbol: '$' },
  { value: 'EUR' as const, label: 'Euro', symbol: '€' },
] as const

const DATE_FORMATS = [
  { value: 'dd/MM/yyyy' as const, label: 'DD/MM/YYYY', example: '31/12/2026' },
  { value: 'MM/dd/yyyy' as const, label: 'MM/DD/YYYY', example: '12/31/2026' },
  { value: 'yyyy-MM-dd' as const, label: 'YYYY-MM-DD', example: '2026-12-31' },
] as const

export function SystemSettingsForm() {
  const { data: settings } = useSystemPreferences()
  const updateSettings = useUpdateSystemPreferences()

  const form = useForm<SystemSettings>({
    resolver: zodResolver(systemSettingsSchema),
    defaultValues: {
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      date_format: 'dd/MM/yyyy',
      time_format: '24h',
      currency: 'BRL',
    },
  })

  useEffect(() => {
    if (settings) {
      form.reset({
        language: settings.language || 'pt-BR',
        timezone: settings.timezone || 'America/Sao_Paulo',
        date_format: settings.date_format || 'dd/MM/yyyy',
        time_format: settings.time_format || '24h',
        currency: settings.currency || 'BRL',
      })
    }
  }, [settings, form])

  const currency = useWatch({ control: form.control, name: 'currency' })
  const language = useWatch({ control: form.control, name: 'language' })
  const timezone = useWatch({ control: form.control, name: 'timezone' })
  const dateFormat = useWatch({ control: form.control, name: 'date_format' })
  const timeFormat = useWatch({ control: form.control, name: 'time_format' })

  const onSubmit = async (data: SystemSettings) => {
    if (!settings?.organization_id) {
      toast.error('Organização não encontrada')
      return
    }

    try {
      await updateSettings.mutateAsync({
        organization_id: settings.organization_id,
        theme: 'light',
        language: data.language,
        timezone: data.timezone,
        date_format: data.date_format,
        time_format: data.time_format,
        currency: data.currency,
        compact_mode: false,
        show_tooltips: true,
      })
      toast.success('Preferências salvas com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar preferências:', error)
      toast.error('Erro ao salvar preferências')
    }
  }

  const getCurrencySymbol = (curr: string) => {
    const found = CURRENCIES.find(c => c.value === curr)
    return found?.symbol || 'R$'
  }

  return (
    <Card className="p-6">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Localização */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Monitor className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground">Localização e Formato</h3>
          </div>

          <div className="space-y-4">
            {/* Idioma */}
            <div className="space-y-2">
              <Label htmlFor="language">Idioma da Interface</Label>
              <Select
                value={language}
                onValueChange={(value) => form.setValue('language', value as 'pt-BR' | 'en-US' | 'es-ES', { shouldDirty: true })}
              >
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fuso Horário */}
            <div className="space-y-2">
              <Label htmlFor="timezone">Fuso Horário</Label>
              <Select
                value={timezone}
                onValueChange={(value) => form.setValue('timezone', value, { shouldDirty: true })}
              >
                <SelectTrigger id="timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Formato de Data */}
            <div className="space-y-2">
              <Label htmlFor="date_format">Formato de Data</Label>
              <Select
                value={dateFormat}
                onValueChange={(value) => form.setValue('date_format', value as 'dd/MM/yyyy' | 'MM/dd/yyyy' | 'yyyy-MM-dd', { shouldDirty: true })}
              >
                <SelectTrigger id="date_format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_FORMATS.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label} ({format.example})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Formato de Hora */}
            <div className="space-y-2">
              <Label htmlFor="time_format">Formato de Hora</Label>
              <Select
                value={timeFormat}
                onValueChange={(value) => form.setValue('time_format', value as '12h' | '24h', { shouldDirty: true })}
              >
                <SelectTrigger id="time_format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">24 horas (14:30)</SelectItem>
                  <SelectItem value="12h">12 horas (2:30 PM)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Moeda */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Moeda</Label>
                <Select
                  value={currency}
                  onValueChange={(value) => form.setValue('currency', value as 'BRL' | 'USD' | 'EUR', { shouldDirty: true })}
                >
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((curr) => (
                      <SelectItem key={curr.value} value={curr.value}>
                        {curr.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency_symbol">Símbolo</Label>
                <Input
                  id="currency_symbol"
                  value={getCurrencySymbol(currency)}
                  readOnly
                  className="bg-muted"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={updateSettings.isPending || !form.formState.isDirty}
          >
            {updateSettings.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Salvar Alterações
          </Button>
        </div>
      </form>
    </Card>
  )
}
