'use client'

import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const closeCashierSchema = z.object({
  saldo_real: z.coerce.number().min(0, 'Saldo não pode ser negativo'),
  conferencia: z.object({
    dinheiro: z.coerce.number().min(0).default(0),
    pix: z.coerce.number().min(0).default(0),
    credito: z.coerce.number().min(0).default(0),
    debito: z.coerce.number().min(0).default(0),
    outros: z.coerce.number().min(0).default(0),
  }),
  observacoes_fechamento: z.string().optional(),
})

type CloseCashierInput = z.infer<typeof closeCashierSchema>

type CashierSession = {
  id: string
  caixa_id: string
  saldo_inicial: number
  status: 'aberto' | 'fechado'
}

interface CloseCashierDialogProps {
  sessao: CashierSession
  saldoEsperado: number
  onClose: () => void
  onConfirm: (data: CloseCashierInput) => Promise<void>
  isLoading?: boolean
}

export function CloseCashierDialog({ 
  sessao, 
  saldoEsperado, 
  onClose, 
  onConfirm, 
  isLoading 
}: CloseCashierDialogProps) {
  const [showDifference, setShowDifference] = useState(false)

  const form = useForm({
    resolver: zodResolver(closeCashierSchema),
    defaultValues: {
      saldo_real: saldoEsperado,
      conferencia: {
        dinheiro: 0,
        pix: 0,
        credito: 0,
        debito: 0,
        outros: 0,
      },
      observacoes_fechamento: '',
    },
  })

  const watchSaldoReal = useWatch({ control: form.control, name: 'saldo_real', defaultValue: saldoEsperado }) as number
  const watchConferencia = useWatch({ control: form.control, name: 'conferencia', defaultValue: { dinheiro: 0, pix: 0, credito: 0, debito: 0, outros: 0 } }) as { dinheiro: number; pix: number; credito: number; debito: number; outros: number }
  
  const diferenca = watchSaldoReal - saldoEsperado
  const totalConferencia = Object.values(watchConferencia).reduce((sum: number, val: number) => sum + val, 0)

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  const handleSubmit = async (data: CloseCashierInput) => {
    if (Math.abs(diferenca) > 0.01) {
      setShowDifference(true)
      return
    }
    await onConfirm(data as CloseCashierInput)
  }

  const handleConfirmWithDifference = async () => {
    const data = form.getValues()
    await onConfirm(data as CloseCashierInput)
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-150 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fechar Caixa</DialogTitle>
          <DialogDescription>
            Confira os valores e feche a sessão
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Resumo */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Saldo Inicial:</span>
                <span className="text-sm font-medium">{formatCurrency(sessao.saldo_inicial)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Saldo Esperado:</span>
                <span className="text-sm font-medium">{formatCurrency(saldoEsperado)}</span>
              </div>
            </div>

            {/* Conferência por Forma de Pagamento */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Conferência por Forma de Pagamento</h4>
              
              <FormField
                control={form.control}
                name="conferencia.dinheiro"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dinheiro</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="0,00"
                        {...field}
                        value={field.value as number}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="conferencia.pix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PIX</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="0,00"
                        {...field}
                        value={field.value as number}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="conferencia.credito"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Crédito</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="0,00"
                        {...field}
                        value={field.value as number}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="conferencia.debito"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Débito</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="0,00"
                        {...field}
                        value={field.value as number}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="conferencia.outros"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Outros</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="0,00"
                        {...field}
                        value={field.value as number}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900">Total Conferido:</span>
                  <span className="font-bold text-gray-900">{formatCurrency(totalConferencia)}</span>
                </div>
              </div>
            </div>

            {/* Saldo Real */}
            <FormField
              control={form.control}
              name="saldo_real"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Saldo Real (Total no Caixa)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01"
                      placeholder="0,00"
                      {...field}
                      value={field.value as number}
                      onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Diferença */}
            {Math.abs(diferenca) > 0.01 && (
              <div className={`rounded-lg p-4 ${diferenca > 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className={`h-5 w-5 ${diferenca > 0 ? 'text-green-600' : 'text-red-600'}`} />
                  <span className="font-medium text-gray-900">
                    {diferenca > 0 ? 'Sobra de Caixa' : 'Falta no Caixa'}
                  </span>
                </div>
                <p className={`text-2xl font-bold ${diferenca > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(Math.abs(diferenca))}
                </p>
              </div>
            )}

            {/* Observações */}
            <FormField
              control={form.control}
              name="observacoes_fechamento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Observações sobre o fechamento (opcional)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Fechando...' : 'Fechar Caixa'}
              </Button>
            </div>
          </form>
        </Form>

        {/* Modal de Confirmação de Diferença */}
        {showDifference && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
                <h3 className="text-lg font-semibold">Confirmar Fechamento com Diferença</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Há uma diferença de <strong className={diferenca > 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(Math.abs(diferenca))}
                </strong> no caixa. Deseja continuar mesmo assim?
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowDifference(false)}>
                  Revisar
                </Button>
                <Button onClick={handleConfirmWithDifference} disabled={isLoading}>
                  {isLoading ? 'Fechando...' : 'Confirmar Fechamento'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
