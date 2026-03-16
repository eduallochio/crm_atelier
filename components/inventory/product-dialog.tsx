'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateProduct, useUpdateProduct, type Product } from '@/hooks/use-inventory'

const schema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  categoria: z.string().optional(),
  unidade: z.string(),
  quantidade_atual: z.number().min(0),
  quantidade_minima: z.number().min(0),
  preco_custo: z.number().min(0).optional(),
  codigo_barras: z.string().optional(),
  descricao: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const UNIDADES = ['un', 'kg', 'g', 'm', 'cm', 'L', 'ml', 'par', 'rolo', 'pacote']

interface ProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product | null
}

export function ProductDialog({ open, onOpenChange, product }: ProductDialogProps) {
  const isEditing = !!product?.id
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nome: '', unidade: 'un', quantidade_atual: 0, quantidade_minima: 0 },
  })

  useEffect(() => {
    if (open) {
      reset({
        nome: product?.nome || '',
        categoria: product?.categoria || '',
        unidade: product?.unidade || 'un',
        quantidade_atual: isEditing ? (product?.quantidade_atual ?? 0) : 0,
        quantidade_minima: product?.quantidade_minima ?? 0,
        preco_custo: product?.preco_custo ?? undefined,
        codigo_barras: product?.codigo_barras || '',
        descricao: product?.descricao || '',
      })
    }
  }, [open, product, isEditing, reset])

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEditing) {
        await updateProduct.mutateAsync({ id: product!.id, ...values })
      } else {
        await createProduct.mutateAsync(values)
      }
      onOpenChange(false)
    } catch {
      // errors handled by mutation hooks
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome *</Label>
            <Input id="nome" {...register('nome')} placeholder="Ex: Tecido de algodão" />
            {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="categoria">Categoria</Label>
              <Input id="categoria" {...register('categoria')} placeholder="Ex: Tecidos" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unidade">Unidade</Label>
              <select
                id="unidade"
                {...register('unidade')}
                className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground"
              >
                {UNIDADES.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          {!isEditing && (
            <div className="space-y-1.5">
              <Label htmlFor="quantidade_atual">Quantidade inicial</Label>
              <Input
                id="quantidade_atual"
                type="number"
                step="0.001"
                min="0"
                {...register('quantidade_atual', { valueAsNumber: true })}
                placeholder="0"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="quantidade_minima">Qtd. mínima (alerta)</Label>
              <Input
                id="quantidade_minima"
                type="number"
                step="0.001"
                min="0"
                {...register('quantidade_minima', { valueAsNumber: true })}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="preco_custo">Preço de custo (R$)</Label>
              <Input
                id="preco_custo"
                type="number"
                step="0.01"
                min="0"
                {...register('preco_custo', { valueAsNumber: true })}
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="codigo_barras">Código de barras</Label>
            <Input
              id="codigo_barras"
              {...register('codigo_barras')}
              placeholder="EAN-13 ou SKU"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="descricao">Descrição</Label>
            <Input
              id="descricao"
              {...register('descricao')}
              placeholder="Observações sobre o produto"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEditing ? 'Salvar' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
