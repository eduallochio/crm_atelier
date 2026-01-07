'use client'

import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { orderSettingsSchema, type OrderSettingsInput } from '@/lib/validations/settings'
import { useOrderSettings, useUpdateOrderSettings } from '@/hooks/use-settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'

export function OrderSettingsForm() {
  const { data: settings, isLoading } = useOrderSettings()
  const updateSettings = useUpdateOrderSettings()

  const form = useForm({
    resolver: zodResolver(orderSettingsSchema),
    defaultValues: {
      order_prefix: 'OS',
      order_start_number: 1,
      order_number_format: 'sequential' as const,
      default_status: 'pendente',
      require_client: true,
      require_service: true,
      require_delivery_date: true,
      require_payment_method: false,
      default_delivery_days: 7,
    },
  })

  const orderNumberFormat = useWatch({ control: form.control, name: 'order_number_format' })
  const requireClient = useWatch({ control: form.control, name: 'require_client' })
  const requireService = useWatch({ control: form.control, name: 'require_service' })
  const requireDeliveryDate = useWatch({ control: form.control, name: 'require_delivery_date' })
  const requirePaymentMethod = useWatch({ control: form.control, name: 'require_payment_method' })

  useEffect(() => {
    if (settings) {
      form.reset({
        order_prefix: settings.order_prefix || 'OS',
        order_start_number: settings.order_start_number,
        order_number_format: settings.order_number_format,
        default_status: settings.default_status,
        require_client: settings.require_client,
        require_service: settings.require_service,
        require_delivery_date: settings.require_delivery_date,
        require_payment_method: settings.require_payment_method,
        default_delivery_days: settings.default_delivery_days,
      })
    }
  }, [settings, form])

  const onSubmit = (data: OrderSettingsInput) => {
    if (settings?.organization_id) {
      updateSettings.mutate({ ...data, organization_id: settings.organization_id })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Numeração de Ordens</h2>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="order_prefix">Prefixo</Label>
            <Input
              id="order_prefix"
              {...form.register('order_prefix')}
              placeholder="OS"
              maxLength={10}
            />
            <p className="text-xs text-muted-foreground">Ex: OS, ORD, SRV</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="order_start_number">Número Inicial</Label>
            <Input
              id="order_start_number"
              type="number"
              min="1"
              {...form.register('order_start_number', { valueAsNumber: true })}
            />
            <p className="text-xs text-muted-foreground">Primeira ordem de serviço</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="order_number_format">Formato</Label>
            <select
              id="order_number_format"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...form.register('order_number_format')}
            >
              <option value="sequential">Sequencial</option>
              <option value="yearly">Anual</option>
              <option value="monthly">Mensal</option>
            </select>
            <p className="text-xs text-muted-foreground">
              {orderNumberFormat === 'sequential' && 'Ex: OS-0001, OS-0002'}
              {orderNumberFormat === 'yearly' && 'Ex: OS-2024-0001'}
              {orderNumberFormat === 'monthly' && 'Ex: OS-202401-0001'}
            </p>
          </div>
        </div>

        <div className="pt-4 border-t">
          <h3 className="text-md font-medium mb-4">Status Padrão</h3>
          <div className="space-y-2">
            <Label htmlFor="default_status">Status Inicial</Label>
            <select
              id="default_status"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...form.register('default_status')}
            >
              <option value="pendente">Pendente</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="concluido">Concluído</option>
              <option value="cancelado">Cancelado</option>
            </select>
            <p className="text-xs text-muted-foreground">Status atribuído a novas ordens</p>
          </div>
        </div>

        <div className="pt-4 border-t">
          <h3 className="text-md font-medium mb-4">Campos Obrigatórios</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="require_client" className="cursor-pointer">
                  Cliente obrigatório
                </Label>
                <p className="text-xs text-muted-foreground">
                  Exigir seleção de cliente ao criar ordem
                </p>
              </div>
              <Switch
                id="require_client"
                checked={requireClient}
                onCheckedChange={(checked) => form.setValue('require_client', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="require_service" className="cursor-pointer">
                  Serviço obrigatório
                </Label>
                <p className="text-xs text-muted-foreground">
                  Exigir ao menos um serviço na ordem
                </p>
              </div>
              <Switch
                id="require_service"
                checked={requireService}
                onCheckedChange={(checked) => form.setValue('require_service', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="require_delivery_date" className="cursor-pointer">
                  Data de entrega obrigatória
                </Label>
                <p className="text-xs text-muted-foreground">
                  Exigir data de entrega ao criar ordem
                </p>
              </div>
              <Switch
                id="require_delivery_date"
                checked={requireDeliveryDate}
                onCheckedChange={(checked) => form.setValue('require_delivery_date', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="require_payment_method" className="cursor-pointer">
                  Forma de pagamento obrigatória
                </Label>
                <p className="text-xs text-muted-foreground">
                  Exigir forma de pagamento ao criar ordem
                </p>
              </div>
              <Switch
                id="require_payment_method"
                checked={requirePaymentMethod}
                onCheckedChange={(checked) => form.setValue('require_payment_method', checked)}
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <h3 className="text-md font-medium mb-4">Prazos Padrão</h3>
          <div className="space-y-2">
            <Label htmlFor="default_delivery_days">Dias para entrega</Label>
            <Input
              id="default_delivery_days"
              type="number"
              min="1"
              max="365"
              {...form.register('default_delivery_days', { valueAsNumber: true })}
            />
            <p className="text-xs text-muted-foreground">
              Número padrão de dias entre abertura e entrega da ordem
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={updateSettings.isPending}>
            {updateSettings.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Alterações'
            )}
          </Button>
        </div>

        {updateSettings.isSuccess && (
          <p className="text-sm text-green-600">Configurações salvas com sucesso!</p>
        )}
      </form>
      </Card>
  )
}