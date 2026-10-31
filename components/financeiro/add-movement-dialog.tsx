'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateCashierMovement } from '@/hooks/use-cashier'
import { useActivePaymentMethods } from '@/hooks/use-payment-methods'

const movementSchema = z.object({
  tipo: z.enum(['entrada', 'saida', 'sangria', 'reforco']),
  valor: z.coerce.number().positive('Valor deve ser maior que zero'),
  metodo_pagamento_id: z.string().min(1, 'Selecione a forma de pagamento'),
  descricao: z.string().optional(),
})

type MovementInput = z.infer<typeof movementSchema>

interface AddMovementDialogProps {
  sessaoId: string
  type: 'entrada' | 'saida' | 'sangria' | 'reforco'
  onClose: () => void
}

const typeLabels = {
  entrada: 'Entrada',
  saida: 'Saída',
  sangria: 'Sangria',
  reforco: 'Reforço',
}

const typeDescriptions = {
  entrada: 'Recebimento de dinheiro',
  saida: 'Pagamento ou retirada',
  sangria: 'Retirada de valor para segurança',
  reforco: 'Adição de troco/valores',
}

export function AddMovementDialog({ sessaoId, type, onClose }: AddMovementDialogProps) {
  const createMovement = useCreateCashierMovement()
  const { data: paymentMethods = [] } = useActivePaymentMethods()

  const form = useForm({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      tipo: type,
      valor: 0,
      metodo_pagamento_id: '',
      descricao: '',
    },
  })

  const handleSubmit = async (data: MovementInput) => {
    try {
      await createMovement.mutateAsync({
        sessao_id: sessaoId,
        tipo: data.tipo,
        valor: data.valor,
        descricao: data.descricao || '',
        metodo_pagamento_id: data.metodo_pagamento_id,
      })
      onClose()
    } catch (error) {
      console.error('Erro ao criar movimento:', error)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>Adicionar {typeLabels[type]}</DialogTitle>
          <DialogDescription>
            {typeDescriptions[type]}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="valor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor</FormLabel>
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="metodo_pagamento_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Forma de Pagamento</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {paymentMethods.map((pm) => (
                        <SelectItem key={pm.id} value={pm.id}>{pm.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      placeholder="Descrição do movimento (opcional)"
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
              <Button type="submit" disabled={createMovement.isPending}>
                {createMovement.isPending ? 'Salvando...' : 'Adicionar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
