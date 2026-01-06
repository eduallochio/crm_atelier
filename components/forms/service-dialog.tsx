'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { serviceSchema, type ServiceInput, type Service } from '@/lib/validations/service'
import { useCreateService, useUpdateService } from '@/hooks/use-services'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'

interface ServiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  service?: Service | null
}

export function ServiceDialog({ open, onOpenChange, service }: ServiceDialogProps) {
  const createService = useCreateService()
  const updateService = useUpdateService()
  const isEditing = !!service

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ServiceInput>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      preco: '',
      categoria: '',
      tempo_estimado: '',
      ativo: true,
    },
  })

  const ativo = watch('ativo')

  // Reset form quando abrir/fechar ou mudar serviço
  useEffect(() => {
    if (open) {
      if (service) {
        reset({
          nome: service.nome,
          descricao: service.descricao || '',
          preco: service.preco.toFixed(2).replace('.', ','),
          categoria: service.categoria || '',
          tempo_estimado: service.tempo_estimado || '',
          ativo: service.ativo,
        })
      } else {
        reset({
          nome: '',
          descricao: '',
          preco: '',
          categoria: '',
          tempo_estimado: '',
          ativo: true,
        })
      }
    }
  }, [open, service, reset])

  const onSubmit = async (data: ServiceInput) => {
    if (isEditing) {
      await updateService.mutateAsync({ id: service.id, input: data })
    } else {
      await createService.mutateAsync(data)
    }
    onOpenChange(false)
  }

  const isLoading = createService.isPending || updateService.isPending

  const formatarMoeda = (valor: string) => {
    // Remove tudo que não é dígito
    const numeros = valor.replace(/\D/g, '')
    
    // Converte para número com 2 casas decimais
    const numero = parseFloat(numeros) / 100
    
    // Formata para moeda brasileira
    return numero.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Serviço' : 'Novo Serviço'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize as informações do serviço'
              : 'Preencha os dados do novo serviço'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">
              Nome do Serviço <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nome"
              placeholder="Ex: Ajuste de calça"
              {...register('nome')}
              disabled={isLoading}
            />
            {errors.nome && (
              <p className="text-sm text-red-500">{errors.nome.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              placeholder="Detalhes sobre o serviço..."
              {...register('descricao')}
              disabled={isLoading}
              rows={3}
            />
            {errors.descricao && (
              <p className="text-sm text-red-500">{errors.descricao.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="preco">
                Preço (R$) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="preco"
                placeholder="0,00"
                {...register('preco')}
                disabled={isLoading}
                onChange={(e) => {
                  const valorFormatado = formatarMoeda(e.target.value)
                  e.target.value = valorFormatado
                  register('preco').onChange(e)
                }}
              />
              {errors.preco && (
                <p className="text-sm text-red-500">{errors.preco.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tempo_estimado">Tempo Estimado</Label>
              <Input
                id="tempo_estimado"
                placeholder="Ex: 2 horas"
                {...register('tempo_estimado')}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria</Label>
            <Input
              id="categoria"
              placeholder="Ex: Ajustes, Customização"
              {...register('categoria')}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <div className="space-y-0.5">
              <Label htmlFor="ativo" className="text-base font-medium">
                Serviço Ativo
              </Label>
              <p className="text-sm text-gray-500">
                Serviços inativos não aparecem para novos pedidos
              </p>
            </div>
            <Switch
              id="ativo"
              checked={ativo}
              onCheckedChange={(checked) => setValue('ativo', checked)}
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
