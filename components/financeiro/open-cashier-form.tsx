'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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

const openCashierSchema = z.object({
  saldo_inicial: z.coerce.number().min(0, 'Saldo inicial não pode ser negativo'),
  observacoes_abertura: z.string().optional(),
})

type OpenCashierInput = z.infer<typeof openCashierSchema>

type Caixa = {
  id: string
  nome: string
  descricao?: string
  ativo: boolean
}

interface OpenCashierFormProps {
  caixa: Caixa
  onSubmit: (data: OpenCashierInput) => Promise<void>
  isLoading?: boolean
}

export function OpenCashierForm({ caixa, onSubmit, isLoading }: OpenCashierFormProps) {
  const form = useForm({
    resolver: zodResolver(openCashierSchema),
    defaultValues: {
      saldo_inicial: 0,
      observacoes_abertura: '',
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <div className="pb-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">{caixa.nome}</h3>
            {caixa.descricao && (
              <p className="text-sm text-gray-500 mt-1">{caixa.descricao}</p>
            )}
          </div>

          <FormField
            control={form.control}
            name="saldo_inicial"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Saldo Inicial</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01"
                    placeholder="0,00"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    value={field.value as number}
                  />
                </FormControl>
                <FormDescription>
                  Valor em dinheiro no caixa para iniciar o dia
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="observacoes_abertura"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observações</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Observações sobre a abertura do caixa (opcional)"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button type="submit" disabled={isLoading} size="lg">
            {isLoading ? 'Abrindo Caixa...' : 'Abrir Caixa'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
