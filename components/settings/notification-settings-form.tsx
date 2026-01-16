'use client'

import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { notificationSettingsSchema, type NotificationSettingsInput } from '@/lib/validations/settings'
import { useNotificationSettings, useUpdateNotificationSettings } from '@/hooks/use-settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'

export function NotificationSettingsForm() {
  const { data: settings, isLoading, error } = useNotificationSettings()
  const updateSettings = useUpdateNotificationSettings()

  const form = useForm({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      notify_client_birthday: true,
      notify_order_ready: true,
      notify_payment_reminder: true,
      notify_order_delayed: true,
      notify_low_stock: false,
      notify_new_client: false,
      email_notifications_enabled: false,
      notification_email: '',
      birthday_reminder_days: 7,
      payment_reminder_days: 3,
      order_reminder_days: 1,
    },
  })

  useEffect(() => {
    if (settings) {
      form.reset({
        notify_client_birthday: settings.notify_client_birthday,
        notify_order_ready: settings.notify_order_ready,
        notify_payment_reminder: settings.notify_payment_reminder,
        notify_order_delayed: settings.notify_order_delayed,
        notify_low_stock: settings.notify_low_stock,
        notify_new_client: settings.notify_new_client,
        email_notifications_enabled: settings.email_notifications_enabled,
        notification_email: settings.notification_email || '',
        birthday_reminder_days: settings.birthday_reminder_days,
        payment_reminder_days: settings.payment_reminder_days,
        order_reminder_days: settings.order_reminder_days,
      })
    }
  }, [settings, form])

  const watchedValues = useWatch({ control: form.control })

  const onSubmit = (data: NotificationSettingsInput) => {
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
      <h2 className="text-lg font-semibold mb-4">Notificações de Clientes</h2>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="notify_client_birthday" className="cursor-pointer">
              Aniversários de clientes
            </Label>
            <p className="text-xs text-muted-foreground">
              Receber notificação de aniversários próximos
            </p>
          </div>
          <Switch
            id="notify_client_birthday"
            checked={watchedValues.notify_client_birthday ?? false}
            onCheckedChange={(checked) => form.setValue('notify_client_birthday', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="notify_order_ready" className="cursor-pointer">
              Ordem de serviço concluída
            </Label>
            <p className="text-xs text-muted-foreground">
              Notificar quando uma ordem estiver pronta
            </p>
          </div>
          <Switch
            id="notify_order_ready"
            checked={watchedValues.notify_order_ready ?? false}
            onCheckedChange={(checked) => form.setValue('notify_order_ready', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="notify_payment_reminder" className="cursor-pointer">
              Lembrete de pagamento
            </Label>
            <p className="text-xs text-muted-foreground">
              Alertar sobre pagamentos pendentes
            </p>
          </div>
          <Switch
            id="notify_payment_reminder"
            checked={watchedValues.notify_payment_reminder ?? false}
            onCheckedChange={(checked) => form.setValue('notify_payment_reminder', checked)}
          />
        </div>

        <div className="pt-4 border-t">
          <h3 className="text-md font-medium mb-4">Notificações Internas</h3>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notify_order_delayed" className="cursor-pointer">
                Ordens atrasadas
              </Label>
              <p className="text-xs text-muted-foreground">
                Alertar sobre ordens com prazo vencido
              </p>
            </div>
            <Switch
              id="notify_order_delayed"
              checked={watchedValues.notify_order_delayed ?? false}
              onCheckedChange={(checked) => form.setValue('notify_order_delayed', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notify_new_client" className="cursor-pointer">
                Novo cliente cadastrado
              </Label>
              <p className="text-xs text-muted-foreground">
                Notificar ao cadastrar um novo cliente
              </p>
            </div>
            <Switch
              id="notify_new_client"
              checked={watchedValues.notify_new_client ?? false}
              onCheckedChange={(checked) => form.setValue('notify_new_client', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notify_low_stock" className="cursor-pointer">
                Estoque baixo
              </Label>
              <p className="text-xs text-muted-foreground">
                Alertar quando materiais estiverem em falta
              </p>
            </div>
            <Switch
              id="notify_low_stock"
              checked={watchedValues.notify_low_stock ?? false}
              onCheckedChange={(checked) => form.setValue('notify_low_stock', checked)}
            />
          </div>
        </div>

        <div className="pt-4 border-t">
          <h3 className="text-md font-medium mb-4">Configurações de E-mail</h3>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email_notifications_enabled" className="cursor-pointer">
                Ativar notificações por e-mail
              </Label>
              <p className="text-xs text-muted-foreground">
                Receber notificações também por e-mail
              </p>
            </div>
            <Switch
              id="email_notifications_enabled"
              checked={watchedValues.email_notifications_enabled ?? false}
              onCheckedChange={(checked) => form.setValue('email_notifications_enabled', checked)}
            />
          </div>

          {watchedValues.email_notifications_enabled && (
            <div className="space-y-2">
              <Label htmlFor="notification_email">E-mail para notificações</Label>
              <Input
                id="notification_email"
                type="email"
                {...form.register('notification_email')}
                placeholder="notificacoes@atelie.com.br"
              />
              {form.formState.errors.notification_email && (
                <p className="text-sm text-red-500">{form.formState.errors.notification_email.message}</p>
              )}
            </div>
          )}
        </div>

        <div className="pt-4 border-t">
          <h3 className="text-md font-medium mb-4">Antecedência de Lembretes (dias)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="birthday_reminder_days">Aniversários</Label>
              <Input
                id="birthday_reminder_days"
                type="number"
                min="0"
                max="30"
                {...form.register('birthday_reminder_days', { valueAsNumber: true })}
              />
              <p className="text-xs text-muted-foreground">Dias de antecedência</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_reminder_days">Pagamentos</Label>
              <Input
                id="payment_reminder_days"
                type="number"
                min="0"
                max="30"
                {...form.register('payment_reminder_days', { valueAsNumber: true })}
              />
              <p className="text-xs text-muted-foreground">Dias de antecedência</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="order_reminder_days">Ordens de Serviço</Label>
              <Input
                id="order_reminder_days"
                type="number"
                min="0"
                max="30"
                {...form.register('order_reminder_days', { valueAsNumber: true })}
              />
              <p className="text-xs text-muted-foreground">Dias de antecedência</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button 
            type="submit" 
            disabled={updateSettings.isPending || !settings?.organization_id}
          >
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

        {!settings?.organization_id && !isLoading && (
          <p className="text-sm text-red-600">
            Erro: Não foi possível carregar as configurações. Execute o SQL de criação das tabelas.
          </p>
        )}
      </form>
    </Card>
  )
}