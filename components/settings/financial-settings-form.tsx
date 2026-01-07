'use client'

import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { financialSettingsSchema, type FinancialSettingsInput } from '@/lib/validations/settings'
import { useFinancialSettings, useUpdateFinancialSettings } from '@/hooks/use-settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'

export function FinancialSettingsForm() {
  const { data: settings, isLoading } = useFinancialSettings()
  const updateSettings = useUpdateFinancialSettings()

  const form = useForm({
    resolver: zodResolver(financialSettingsSchema),
    defaultValues: {
      payment_methods: {
        dinheiro: true,
        pix: true,
        credito: true,
        debito: true,
        outros: true,
      },
      late_fee_percentage: 0,
      interest_rate_per_month: 0,
      cashier_requires_opening: true,
      cashier_opening_balance_required: false,
    },
  })

  const paymentMethods = useWatch({ control: form.control, name: 'payment_methods' })
  const cashierRequiresOpening = useWatch({ control: form.control, name: 'cashier_requires_opening' })
  const cashierOpeningBalanceRequired = useWatch({ control: form.control, name: 'cashier_opening_balance_required' })

  useEffect(() => {
    if (settings) {
      form.reset({
        payment_methods: settings.payment_methods,
        late_fee_percentage: settings.late_fee_percentage || 0,
        interest_rate_per_month: settings.interest_rate_per_month || 0,
        cashier_requires_opening: settings.cashier_requires_opening,
        cashier_opening_balance_required: settings.cashier_opening_balance_required,
      })
    }
  }, [settings, form])

  const onSubmit = (data: FinancialSettingsInput) => {
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
      <h2 className="text-lg font-semibold mb-4">Formas de Pagamento</h2>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Selecione as formas de pagamento disponíveis no seu estabelecimento
        </p>
        <div className="flex items-center justify-between">
          <Label htmlFor="dinheiro" className="cursor-pointer">Dinheiro</Label>
          <Switch
            id="dinheiro"
            checked={paymentMethods?.dinheiro ?? true}
            onCheckedChange={(checked) => form.setValue('payment_methods.dinheiro', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="pix" className="cursor-pointer">PIX</Label>
          <Switch
            id="pix"
            checked={paymentMethods?.pix ?? true}
            onCheckedChange={(checked) => form.setValue('payment_methods.pix', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="credito" className="cursor-pointer">Cartão de Crédito</Label>
          <Switch
            id="credito"
            checked={paymentMethods?.credito ?? true}
            onCheckedChange={(checked) => form.setValue('payment_methods.credito', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="debito" className="cursor-pointer">Cartão de Débito</Label>
          <Switch
            id="debito"
            checked={paymentMethods?.debito ?? true}
            onCheckedChange={(checked) => form.setValue('payment_methods.debito', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="outros" className="cursor-pointer">Outros</Label>
          <Switch
            id="outros"
            checked={paymentMethods?.outros ?? true}
            onCheckedChange={(checked) => form.setValue('payment_methods.outros', checked)}
          />
        </div>

        <div className="pt-4 border-t">
          <h3 className="text-md font-medium mb-4">Configurações de Juros e Multas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="late_fee_percentage">Multa por Atraso (%)</Label>
              <Input
                id="late_fee_percentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                {...form.register('late_fee_percentage', { valueAsNumber: true })}
                placeholder="2.00"
              />
              <p className="text-xs text-muted-foreground">Percentual de multa sobre o valor</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interest_rate_per_month">Juros ao Mês (%)</Label>
              <Input
                id="interest_rate_per_month"
                type="number"
                step="0.01"
                min="0"
                max="100"
                {...form.register('interest_rate_per_month', { valueAsNumber: true })}
                placeholder="1.00"
              />
              <p className="text-xs text-muted-foreground">Percentual de juros mensal</p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <h3 className="text-md font-medium mb-4">Configurações de Caixa</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="cashier_requires_opening" className="cursor-pointer">
                  Requer abertura de caixa
                </Label>
                <p className="text-xs text-muted-foreground">
                  Obriga a abertura do caixa antes de registrar movimentações
                </p>
              </div>
              <Switch
                id="cashier_requires_opening"
                checked={cashierRequiresOpening ?? true}
                onCheckedChange={(checked) => form.setValue('cashier_requires_opening', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="cashier_opening_balance_required" className="cursor-pointer">
                  Saldo inicial obrigatório
                </Label>
                <p className="text-xs text-muted-foreground">
                  Exige informar o saldo inicial ao abrir o caixa
                </p>
              </div>
              <Switch
                id="cashier_opening_balance_required"
                checked={cashierOpeningBalanceRequired ?? false}
                onCheckedChange={(checked) => form.setValue('cashier_opening_balance_required', checked)}
              />
            </div>
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