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

  // Categorias predefinidas comuns
  const commonCategories = [
    'Costura',
    'Ajuste',
    'Reforma',
    'Conserto',
    'Customização',
    'Barra',
    'Zíper',
    'Botões',
    'Bordado',
    'Aplicação',
  ]

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
      materiais: '',
      custo_materiais: '',
      observacoes_tecnicas: '',
      nivel_dificuldade: '',
      tempo_minimo: '',
      tempo_maximo: '',
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
          materiais: service.materiais || '',
          custo_materiais: service.custo_materiais ? service.custo_materiais.toFixed(2).replace('.', ',') : '',
          observacoes_tecnicas: service.observacoes_tecnicas || '',
          nivel_dificuldade: (service.nivel_dificuldade || '') as '' | 'facil' | 'medio' | 'dificil',
          tempo_minimo: service.tempo_minimo || '',
          tempo_maximo: service.tempo_maximo || '',
          ativo: service.ativo,
        })
      } else {
        reset({
          nome: '',
          descricao: '',
          preco: '',
          categoria: '',
          tempo_estimado: '',
          materiais: '',
          custo_materiais: '',
          observacoes_tecnicas: '',
          nivel_dificuldade: '',
          tempo_minimo: '',
          tempo_maximo: '',
          ativo: true,
        })
      }
    }
  }, [open, service, reset])

  const onSubmit = async (data: ServiceInput): Promise<void> => {
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
      <DialogContent className="sm:max-w-125">
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
            <select
              id="categoria"
              {...register('categoria')}
              disabled={isLoading}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Selecione uma categoria</option>
              {commonCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500">
              Ou digite uma nova categoria no campo acima
            </p>
          </div>

          {/* Materiais e Insumos */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-medium text-sm text-gray-700">Materiais e Custo</h3>
            
            <div className="space-y-2">
              <Label htmlFor="materiais">Materiais Necessários</Label>
              <Textarea
                id="materiais"
                placeholder="Liste os materiais necessários para este serviço..."
                {...register('materiais')}
                disabled={isLoading}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="custo_materiais">Custo dos Materiais (R$)</Label>
              <Input
                id="custo_materiais"
                placeholder="0,00"
                {...register('custo_materiais')}
                disabled={isLoading}
                onChange={(e) => {
                  const valorFormatado = formatarMoeda(e.target.value)
                  e.target.value = valorFormatado
                  register('custo_materiais').onChange(e)
                }}
              />
              <p className="text-xs text-gray-500">
                Margem de lucro: {watch('preco') && watch('custo_materiais') 
                  ? `R$ ${(parseFloat((watch('preco') || '0').replace(',', '.')) - parseFloat((watch('custo_materiais') || '0').replace(',', '.'))).toFixed(2)}`
                  : 'R$ 0,00'}
              </p>
            </div>
          </div>

          {/* Observações Técnicas */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-medium text-sm text-gray-700">Detalhes Técnicos</h3>
            
            <div className="space-y-2">
              <Label htmlFor="observacoes_tecnicas">Observações Técnicas</Label>
              <Textarea
                id="observacoes_tecnicas"
                placeholder="Instruções especiais, cuidados, técnicas recomendadas..."
                {...register('observacoes_tecnicas')}
                disabled={isLoading}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="nivel_dificuldade">Dificuldade</Label>
                <select
                  id="nivel_dificuldade"
                  {...register('nivel_dificuldade')}
                  disabled={isLoading}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Selecione</option>
                  <option value="facil">Fácil</option>
                  <option value="medio">Médio</option>
                  <option value="dificil">Difícil</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tempo_minimo">Tempo Min.</Label>
                <Input
                  id="tempo_minimo"
                  placeholder="Ex: 1h"
                  {...register('tempo_minimo')}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tempo_maximo">Tempo Max.</Label>
                <Input
                  id="tempo_maximo"
                  placeholder="Ex: 3h"
                  {...register('tempo_maximo')}
                  disabled={isLoading}
                />
              </div>
            </div>
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
