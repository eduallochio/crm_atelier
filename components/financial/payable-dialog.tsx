'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { payableSchema, PayableInput, Payable } from '@/lib/validations/financial'
import { useCreatePayable, useUpdatePayable } from '@/hooks/use-financial'
import { useActiveSuppliers } from '@/hooks/use-suppliers'
import { SupplierDialog } from '@/components/forms/supplier-dialog'
import { Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface PayableDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  payable?: Payable
}

export function PayableDialog({ open, onOpenChange, payable }: PayableDialogProps) {
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false)
  const createMutation = useCreatePayable()
  const updateMutation = useUpdatePayable()
  const { data: suppliers = [] } = useActiveSuppliers()

  const form = useForm({
    resolver: zodResolver(payableSchema),
    defaultValues: {
      supplier_id: '',
      descricao: '',
      valor: '',
      data_vencimento: '',
      status: 'pendente' as const,
      categoria: '',
      forma_pagamento: '',
      observacoes: '',
    },
    mode: 'onChange',
  })

  useEffect(() => {
    if (payable) {
      form.reset({
        supplier_id: payable.supplier_id || '',
        descricao: payable.descricao,
        valor: payable.valor.toString(),
        data_vencimento: payable.data_vencimento,
        data_pagamento: payable.data_pagamento || undefined,
        status: payable.status,
        categoria: payable.categoria || '',
        forma_pagamento: payable.forma_pagamento || '',
        observacoes: payable.observacoes || '',
      })
    } else {
      form.reset({
        supplier_id: '',
        descricao: '',
        valor: '',
        data_vencimento: '',
        status: 'pendente',
        categoria: '',
        forma_pagamento: '',
        observacoes: '',
      })
    }
  }, [payable, form])

  const onSubmit = async (data: PayableInput) => {
    try {
      if (payable) {
        await updateMutation.mutateAsync({
          id: payable.id,
          input: data,
        })
      } else {
        await createMutation.mutateAsync(data)
      }
      onOpenChange(false)
      form.reset()
    } catch (error) {
      console.error('Erro ao salvar conta a pagar:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {payable ? 'Editar Conta a Pagar' : 'Nova Conta a Pagar'}
          </DialogTitle>
          <DialogDescription>
            {payable
              ? 'Atualize os dados da conta a pagar.'
              : 'Adicione uma nova conta a pagar ao sistema.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4">
            <FormField
              control={form.control}
              name="supplier_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fornecedor</FormLabel>
                  <div className="flex gap-2">
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Selecione um fornecedor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sem-fornecedor">Sem fornecedor</SelectItem>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setSupplierDialogOpen(true)}
                      title="Adicionar novo fornecedor"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Compra de tecidos para vestidos" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0,00"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^\d,]/g, '')
                          field.onChange(value)
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data_vencimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Vencimento *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="categoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Material, Aluguel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="forma_pagamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de Pagamento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                        <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                        <SelectItem value="transferencia">Transferência</SelectItem>
                        <SelectItem value="boleto">Boleto</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="pago">Pago</SelectItem>
                        <SelectItem value="atrasado">Atrasado</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </div>

            <FormField
              control={form.control}
              name="data_pagamento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Pagamento</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Informações adicionais sobre esta conta..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                )}
                {payable ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </Form>

        <SupplierDialog
          open={supplierDialogOpen}
          onOpenChange={setSupplierDialogOpen}
        />
      </DialogContent>
    </Dialog>
  )
}
