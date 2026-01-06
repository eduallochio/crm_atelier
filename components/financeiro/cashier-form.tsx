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
      ativo: true,
    },
  })

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
