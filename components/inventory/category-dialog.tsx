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
import { useCreateProductCategory, useUpdateProductCategory, type ProductCategory } from '@/hooks/use-product-categories'

const schema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  cor: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const CORES = ['#C8714A', '#8A4B2C', '#4A7C59', '#2563EB', '#B91C1C', '#7C3AED', '#C8A27A', '#64748B']

interface CategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: ProductCategory | null
}

export function CategoryDialog({ open, onOpenChange, category }: CategoryDialogProps) {
  const isEditing = !!category?.id
  const createCategory = useCreateProductCategory()
  const updateCategory = useUpdateProductCategory()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nome: '', cor: CORES[0] },
  })

  useEffect(() => {
    if (open) {
      reset({ nome: category?.nome || '', cor: category?.cor || CORES[0] })
    }
  }, [open, category, reset])

  const cor = watch('cor')

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEditing) {
        await updateCategory.mutateAsync({ id: category!.id, data: { ...values, ativo: category!.ativo } })
      } else {
        await createCategory.mutateAsync(values)
      }
      onOpenChange(false)
    } catch {
      // erro já tratado e exibido via toast no onError do hook
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar categoria' : 'Nova categoria'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome *</Label>
            <Input id="nome" {...register('nome')} placeholder="Ex: Tecidos" autoFocus />
            {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {CORES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setValue('cor', c)}
                  aria-label={`Cor ${c}`}
                  aria-pressed={cor === c}
                  className="h-8 w-8 rounded-full ring-offset-2 ring-offset-background transition-transform"
                  style={{ backgroundColor: c, outline: cor === c ? `2px solid ${c}` : 'none', transform: cor === c ? 'scale(1.1)' : 'scale(1)' }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>{isEditing ? 'Salvar' : 'Criar'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
