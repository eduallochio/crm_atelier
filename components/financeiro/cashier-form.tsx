'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cashierInputSchema, type CashierInput } from '@/lib/validations/cashier'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useFinancialSettings } from '@/hooks/use-settings'
import { Badge } from '@/components/ui/badge'

interface CashierFormProps {
  initialData?: CashierInput
  onSubmit: (data: CashierInput) => Promise<void>
  isLoading?: boolean
}

export function CashierForm({ initialData, onSubmit, isLoading }: CashierFormProps) {
  const form = useForm({
    resolver: zodResolver(cashierInputSchema),
    defaultValues: initialData || {
      nome: '',
      descricao: '',
      chave_pix: '',
      ativo: true,
    },
  })

  const { data: financialSettings } = useFinancialSettings()
  const globalPixKey = financialSettings?.pix_key as string | null | undefined

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Caixa</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Caixa 1, PDV Principal" {...field} />
                </FormControl>
                <FormDescription>
                  Identificação do caixa
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="descricao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Informações adicionais sobre o caixa"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormDescription>
                  Localização, responsável, etc (opcional)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="chave_pix"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Chave PIX</FormLabel>
                  {globalPixKey && field.value !== globalPixKey && (
                    <button
                      type="button"
                      onClick={() => form.setValue('chave_pix', globalPixKey, { shouldDirty: true })}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      Usar chave das configurações
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                        {globalPixKey}
                      </Badge>
                    </button>
                  )}
                  {globalPixKey && field.value === globalPixKey && (
                    <Badge variant="outline" className="text-[10px] text-green-600 border-green-300">
                      Mesma das configurações
                    </Badge>
                  )}
                </div>
                <FormControl>
                  <Input
                    placeholder="Ex: 11999999999, email@exemplo.com, CPF/CNPJ"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormDescription>
                  Chave PIX vinculada a este caixa. Pagamentos PIX com esta chave serão direcionados aqui (opcional)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ativo"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Caixa Ativo</FormLabel>
                  <FormDescription>
                    Caixas inativos não podem ser abertos
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Salvando...' : initialData ? 'Atualizar Caixa' : 'Cadastrar Caixa'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
