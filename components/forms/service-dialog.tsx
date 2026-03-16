'use client'

import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { serviceSchema, type ServiceInput, type Service, type ServiceMaterial } from '@/lib/validations/service'
import { useCreateService, useUpdateService } from '@/hooks/use-services'
import { useSystemPreferences } from '@/hooks/use-settings'
import { type Product } from '@/hooks/use-inventory'
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Check, ChevronsUpDown, Plus, Trash2, Package } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ServiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  service?: Service | null
}

export function ServiceDialog({ open, onOpenChange, service }: ServiceDialogProps) {
  const createService = useCreateService()
  const updateService = useUpdateService()
  const isEditing = !!service?.id

  const { data: systemPrefs } = useSystemPreferences()
  const controlaEstoque = !!systemPrefs?.controla_estoque

  // Produtos do catálogo (apenas quando controle de estoque ativo)
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch('/api/inventory/products')
      if (!res.ok) throw new Error('Erro ao buscar produtos')
      return res.json()
    },
    enabled: controlaEstoque,
  })
  const activeProducts = products.filter(p => p.ativo)

  // Estado local dos materiais (fora do RHF para simplicidade)
  const [materiais, setMateriais] = useState<ServiceMaterial[]>([])
  const [productPopoverOpen, setProductPopoverOpen] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [selectedProductId, setSelectedProductId] = useState('')
  const [materialQtd, setMaterialQtd] = useState(1)

  // Categorias predefinidas comuns
  const commonCategories = [
    'Costura', 'Ajuste', 'Reforma', 'Conserto', 'Customização',
    'Barra', 'Zíper', 'Botões', 'Bordado', 'Aplicação',
  ]

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    control,
  } = useForm<ServiceInput>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      preco: '',
      categoria: '',
      tempo_estimado: '',
      materiais_produtos: [],
      observacoes_tecnicas: '',
      nivel_dificuldade: '',
      tempo_minimo: '',
      tempo_maximo: '',
      ativo: true,
    },
  })

  const ativo = useWatch({ control, name: 'ativo' })
  const preco = useWatch({ control, name: 'preco' })

  // Reset form quando abrir/fechar ou mudar serviço
  useEffect(() => {
    if (open) {
      const parsed: ServiceMaterial[] = service?.materiais_produtos ?? []
      setMateriais(parsed)
      setSelectedProductId('')
      setMaterialQtd(1)
      setProductSearch('')

      if (service) {
        reset({
          nome: service.nome,
          descricao: service.descricao || '',
          preco: service.preco.toFixed(2).replace('.', ','),
          categoria: service.categoria || '',
          tempo_estimado: service.tempo_estimado || '',
          materiais_produtos: parsed,
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
          materiais_produtos: [],
          observacoes_tecnicas: '',
          nivel_dificuldade: '',
          tempo_minimo: '',
          tempo_maximo: '',
          ativo: true,
        })
      }
    }
  }, [open, service, reset])

  // Custo total calculado dos materiais
  const custoTotal = materiais.reduce((acc, m) => acc + (m.preco_custo ?? 0) * m.quantidade, 0)
  const precoNum = parseFloat((preco || '0').replace(',', '.')) || 0
  const margem = precoNum - custoTotal

  const addMaterial = () => {
    if (!selectedProductId) return
    const product = activeProducts.find(p => p.id === selectedProductId)
    if (!product) return
    // Evita duplicatas — apenas soma quantidade
    const existing = materiais.findIndex(m => m.product_id === selectedProductId)
    if (existing >= 0) {
      const updated = [...materiais]
      updated[existing] = { ...updated[existing], quantidade: updated[existing].quantidade + materialQtd }
      setMateriais(updated)
    } else {
      setMateriais([...materiais, {
        product_id: product.id,
        produto_nome: product.nome,
        quantidade: materialQtd,
        unidade: product.unidade || 'un',
        preco_custo: product.preco_custo ?? 0,
      }])
    }
    setSelectedProductId('')
    setMaterialQtd(1)
    setProductSearch('')
  }

  const removeMaterial = (index: number) => {
    setMateriais(materiais.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: ServiceInput) => {
    const payload: ServiceInput = { ...data, materiais_produtos: materiais }
    if (isEditing) {
      await updateService.mutateAsync({ id: service.id, input: payload })
    } else {
      await createService.mutateAsync(payload)
    }
    onOpenChange(false)
  }

  const isLoading = createService.isPending || updateService.isPending

  const formatarMoeda = (valor: string) => {
    const numeros = valor.replace(/\D/g, '')
    const numero = parseFloat(numeros) / 100
    return numero.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const selectedProduct = activeProducts.find(p => p.id === selectedProductId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125 max-h-[90vh] overflow-y-auto">
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
          </div>

          {/* Materiais e Insumos */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium text-sm">Materiais e Custo</h3>
            </div>

            {controlaEstoque ? (
              <>
                {/* Seletor de produto */}
                <div className="flex gap-2">
                  <Popover open={productPopoverOpen} onOpenChange={setProductPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        className="flex-1 justify-between font-normal"
                        disabled={isLoading}
                      >
                        {selectedProduct ? selectedProduct.nome : 'Selecionar produto...'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Buscar produto..."
                          value={productSearch}
                          onValueChange={setProductSearch}
                        />
                        <CommandList>
                          <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                          <CommandGroup>
                            {activeProducts
                              .filter(p =>
                                p.nome.toLowerCase().includes(productSearch.toLowerCase())
                              )
                              .map(p => (
                                <CommandItem
                                  key={p.id}
                                  value={p.nome}
                                  onSelect={() => {
                                    setSelectedProductId(p.id)
                                    setProductPopoverOpen(false)
                                    setProductSearch('')
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      selectedProductId === p.id ? 'opacity-100' : 'opacity-0'
                                    )}
                                  />
                                  <span className="flex-1 truncate">{p.nome}</span>
                                  {p.preco_custo ? (
                                    <span className="text-xs text-muted-foreground ml-2">
                                      R$ {p.preco_custo.toFixed(2).replace('.', ',')}
                                    </span>
                                  ) : null}
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  <Input
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={materialQtd}
                    onChange={e => setMaterialQtd(parseFloat(e.target.value) || 1)}
                    className="w-20"
                    placeholder="Qtd"
                    disabled={isLoading}
                  />

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={addMaterial}
                    disabled={!selectedProductId || isLoading}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Lista de materiais adicionados */}
                {materiais.length > 0 && (
                  <div className="rounded-md border text-sm">
                    {materiais.map((m, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2 border-b last:border-0">
                        <span className="flex-1 truncate">{m.produto_nome}</span>
                        <span className="text-muted-foreground mx-3 whitespace-nowrap">
                          {m.quantidade} {m.unidade}
                        </span>
                        {(m.preco_custo ?? 0) > 0 && (
                          <span className="text-muted-foreground text-xs mr-3 whitespace-nowrap">
                            R$ {((m.preco_custo ?? 0) * m.quantidade).toFixed(2).replace('.', ',')}
                          </span>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={() => removeMaterial(i)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {materiais.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    Nenhum material vinculado
                  </p>
                )}

                {/* Resumo de custo e margem */}
                <div className="flex items-center justify-between text-sm bg-muted/40 rounded-md px-3 py-2">
                  <span className="text-muted-foreground">Custo dos materiais:</span>
                  <span className="font-medium">
                    R$ {custoTotal.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                {precoNum > 0 && (
                  <div className="flex items-center justify-between text-sm bg-muted/40 rounded-md px-3 py-2">
                    <span className="text-muted-foreground">Margem de lucro:</span>
                    <span className={cn('font-medium', margem < 0 ? 'text-destructive' : 'text-green-600')}>
                      R$ {margem.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                Ative o <strong>Controle de Estoque</strong> em Configurações → Sistema para vincular materiais do catálogo a este serviço.
              </p>
            )}
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
