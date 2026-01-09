'use client'

import { useState, useEffect } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { serviceOrderSchema, type ServiceOrderInput, type ServiceOrderItemInput, type ServiceOrder } from '@/lib/validations/service-order'
import { useCreateServiceOrder } from '@/hooks/use-service-orders'
import { useClients } from '@/hooks/use-clients'
import { useServices } from '@/hooks/use-services'
import { generateThermalPDF } from '@/lib/utils/thermal-printer'
import { toast } from 'sonner'
import { OrderPreviewDialog } from '@/components/dashboard/order-preview-dialog'
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
import { Plus, Trash2, Eye, Check, ChevronsUpDown } from 'lucide-react'
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
import { cn } from '@/lib/utils'

interface ServiceOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ServiceOrderDialog({ open, onOpenChange }: ServiceOrderDialogProps) {
  const [items, setItems] = useState<ServiceOrderItemInput[]>([])
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [quantidade, setQuantidade] = useState(1)
  const [gerarPDF, setGerarPDF] = useState(true)
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState<{ formData: ServiceOrderInput; previewOrder: ServiceOrder } | null>(null)
  const [openClientCombo, setOpenClientCombo] = useState(false)
  const [openServiceCombo, setOpenServiceCombo] = useState(false)
  const [clientSearchValue, setClientSearchValue] = useState('')
  const [serviceSearchValue, setServiceSearchValue] = useState('')

  const createOrder = useCreateServiceOrder()
  const { data: clients = [] } = useClients()
  const { data: services = [] } = useServices()

  const activeServices = services.filter(s => s.ativo)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ServiceOrderInput>({
    resolver: zodResolver(serviceOrderSchema) as Resolver<ServiceOrderInput>,
    defaultValues: {
      client_id: '',
      status: 'pendente' as const,
      data_prevista: undefined,
      observacoes: undefined,
      valor_entrada: 0,
      desconto_valor: 0,
      desconto_percentual: 0,
      notas_internas: undefined,
      items: [],
    },
  })

  const descontoValor = watch('desconto_valor') || 0
  const descontoPercentual = watch('desconto_percentual') || 0
  const valorEntrada = watch('valor_entrada') || 0

  useEffect(() => {
    if (open) {
      reset({
        client_id: '',
        status: 'pendente' as const,
        data_prevista: undefined,
        observacoes: undefined,
        valor_entrada: 0,
        desconto_valor: 0,
        desconto_percentual: 0,
        notas_internas: undefined,
        items: [],
      })
      setItems([])
      setSelectedServiceId('')
      setQuantidade(1)
      setGerarPDF(true)
      setClientSearchValue('')
      setServiceSearchValue('')
    }
  }, [open, reset])

  const addItem = () => {
    if (!selectedServiceId) {
      return
    }

    const service = services.find(s => s.id === selectedServiceId)
    if (!service) return

    const valor_unitario = service.preco
    const valor_total = valor_unitario * quantidade

    const newItem: ServiceOrderItemInput = {
      service_id: service.id,
      service_nome: service.nome,
      quantidade,
      valor_unitario,
      valor_total,
    }

    const updatedItems = [...items, newItem]
    setItems(updatedItems)
    setValue('items', updatedItems)
    setSelectedServiceId('')
    setQuantidade(1)
  }

  const removeItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index)
    setItems(updatedItems)
    setValue('items', updatedItems)
  }

  const total = items.reduce((sum, item) => sum + item.valor_total, 0)
  
  // Calcular desconto
  let valorDesconto = 0
  if (descontoPercentual > 0) {
    valorDesconto = (total * descontoPercentual) / 100
  } else if (descontoValor > 0) {
    valorDesconto = descontoValor
  }
  
  const totalComDesconto = Math.max(0, total - valorDesconto)
  const saldoRestante = Math.max(0, totalComDesconto - valorEntrada)

  const isLoading = createOrder.isPending

  const onSubmit = async (data: ServiceOrderInput) => {
    if (items.length === 0) {
      toast.error('Adicione pelo menos um serviço')
      return
    }

    // Buscar dados do cliente selecionado
    const selectedClient = clients.find(c => c.id === data.client_id)
    
    if (!selectedClient) {
      toast.error('Cliente não encontrado')
      return
    }

    // Preparar dados para preview
    const previewOrder = {
      id: 'preview',
      numero: 999999, // Número temporário para preview
      organization_id: 'temp',
      client_id: data.client_id,
      status: data.status,
      valor_total: totalComDesconto,
      valor_entrada: data.valor_entrada || 0,
      valor_pago: data.valor_entrada || 0,
      status_pagamento: 'pendente' as const,
      desconto_valor: data.desconto_valor || 0,
      desconto_percentual: data.desconto_percentual || 0,
      data_abertura: new Date().toISOString(),
      data_prevista: data.data_prevista || null,
      data_conclusao: null,
      observacoes: data.observacoes || null,
      fotos: null,
      notas_internas: data.notas_internas || null,
      created_at: new Date().toISOString(),
      client: {
        id: selectedClient.id,
        nome: selectedClient.nome,
        telefone: selectedClient.telefone || null,
        email: selectedClient.email || null,
      },
      items: items.map((item, index) => ({
        id: `temp-${index}`,
        order_id: 'preview',
        service_id: item.service_id,
        service_nome: item.service_nome,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
        valor_total: item.valor_total,
        created_at: new Date().toISOString(),
      }))
    }

    setPreviewData({ formData: data, previewOrder })
    setShowPreview(true)
  }

  const handleConfirmSave = async () => {
    if (!previewData) return

    const orderData: ServiceOrderInput = {
      ...previewData.formData,
      items,
    }

    try {
      const result = await createOrder.mutateAsync(orderData)
      
      // Gerar PDF se opção estiver marcada
      if (gerarPDF && result) {
        try {
          // Buscar a ordem completa com os dados do cliente e itens
          const { createClient } = await import('@/lib/supabase/client')
          const supabase = createClient()
          
          const { data: completeOrder } = await supabase
            .from('org_service_orders')
            .select(`
              *,
              client:org_clients!client_id(id, nome, telefone, email, endereco, cidade, estado, cep),
              items:org_service_order_items(*)
            `)
            .eq('id', result.id)
            .single()
          
          if (completeOrder) {
            generateThermalPDF(completeOrder as ServiceOrder)
            toast.success('Ordem criada e PDF gerado com sucesso!')
          }
        } catch (error) {
          console.error('Erro ao gerar PDF:', error)
          toast.error('Ordem criada, mas falha ao gerar PDF')
        }
      } else {
        toast.success('Ordem criada com sucesso!')
      }
      
      setShowPreview(false)
      onOpenChange(false)
    } catch (error) {
      console.error('Erro ao salvar ordem:', error)
    }
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-175 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Ordem de Serviço</DialogTitle>
          <DialogDescription>
            Preencha os dados da ordem de serviço
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Cliente */}
          <div className="space-y-2">
            <Label htmlFor="client_id">
              Cliente <span className="text-red-500">*</span>
            </Label>
            <Popover open={openClientCombo} onOpenChange={setOpenClientCombo}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openClientCombo}
                  className="w-full justify-between"
                  disabled={isLoading}
                >
                  {watch('client_id')
                    ? clients.find((client) => client.id === watch('client_id'))?.nome
                    : "Selecione um cliente..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder="Buscar cliente..."
                    value={clientSearchValue}
                    onValueChange={setClientSearchValue}
                  />
                  <CommandList>
                    <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                    <CommandGroup>
                      {clients
                        .filter((client) =>
                          client.nome.toLowerCase().includes(clientSearchValue.toLowerCase()) ||
                          client.email?.toLowerCase().includes(clientSearchValue.toLowerCase()) ||
                          client.telefone?.includes(clientSearchValue)
                        )
                        .map((client) => (
                          <CommandItem
                            key={client.id}
                            value={client.id}
                            onSelect={() => {
                              setValue('client_id', client.id)
                              setOpenClientCombo(false)
                              setClientSearchValue('')
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                watch('client_id') === client.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span>{client.nome}</span>
                              {(client.email || client.telefone) && (
                                <span className="text-xs text-muted-foreground">
                                  {[client.email, client.telefone].filter(Boolean).join(' • ')}
                                </span>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {errors.client_id && (
              <p className="text-sm text-red-500">{errors.client_id.message}</p>
            )}
          </div>

          {/* Status e Data Prevista */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                {...register('status')}
                disabled={isLoading}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="pendente">Pendente</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="concluido">Concluído</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_prevista">Data Prevista</Label>
              <Input
                id="data_prevista"
                type="date"
                {...register('data_prevista')}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Adicionar Serviços */}
          <div className="space-y-3 border-t pt-4">
            <h3 className="font-medium text-sm">Serviços</h3>
            
            <div className="flex gap-2">
              <Popover open={openServiceCombo} onOpenChange={setOpenServiceCombo}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openServiceCombo}
                    className="flex-1 justify-between"
                    disabled={isLoading}
                  >
                    {selectedServiceId
                      ? (() => {
                          const service = activeServices.find((s) => s.id === selectedServiceId)
                          return service ? `${service.nome} - R$ ${service.preco.toFixed(2)}` : "Selecione um serviço..."
                        })()
                      : "Selecione um serviço..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Buscar serviço..."
                      value={serviceSearchValue}
                      onValueChange={setServiceSearchValue}
                    />
                    <CommandList>
                      <CommandEmpty>Nenhum serviço encontrado.</CommandEmpty>
                      <CommandGroup>
                        {activeServices
                          .filter((service) =>
                            service.nome.toLowerCase().includes(serviceSearchValue.toLowerCase()) ||
                            service.categoria?.toLowerCase().includes(serviceSearchValue.toLowerCase()) ||
                            service.descricao?.toLowerCase().includes(serviceSearchValue.toLowerCase())
                          )
                          .map((service) => (
                            <CommandItem
                              key={service.id}
                              value={service.id}
                              onSelect={() => {
                                setSelectedServiceId(service.id)
                                setOpenServiceCombo(false)
                                setServiceSearchValue('')
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedServiceId === service.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span>{service.nome}</span>
                                <span className="text-xs text-muted-foreground">
                                  R$ {service.preco.toFixed(2)}
                                  {service.categoria && ` • ${service.categoria}`}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <Input
                type="number"
                min="1"
                value={quantidade}
                onChange={(e) => setQuantidade(parseInt(e.target.value) || 1)}
                placeholder="Qtd"
                className="w-20"
                disabled={isLoading}
              />

              <Button
                type="button"
                onClick={addItem}
                disabled={!selectedServiceId || isLoading}
                size="icon"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Lista de Itens */}
            {items.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Serviço</th>
                      <th className="px-3 py-2 text-center">Qtd</th>
                      <th className="px-3 py-2 text-right">Unit.</th>
                      <th className="px-3 py-2 text-right">Total</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-3 py-2">{item.service_nome}</td>
                        <td className="px-3 py-2 text-center">{item.quantidade}</td>
                        <td className="px-3 py-2 text-right">
                          R$ {item.valor_unitario.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right font-medium">
                          R$ {item.valor_total.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(index)}
                            className="h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr className="border-t">
                      <td colSpan={3} className="px-3 py-2 text-right font-medium">Subtotal:</td>
                      <td className="px-3 py-2 text-right">
                        R$ {total.toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                    {valorDesconto > 0 && (
                      <tr>
                        <td colSpan={3} className="px-3 py-2 text-right text-red-600">Desconto:</td>
                        <td className="px-3 py-2 text-right text-red-600">
                          - R$ {valorDesconto.toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                    )}
                    <tr className="font-bold">
                      <td colSpan={3} className="px-3 py-3 text-right text-lg">Total:</td>
                      <td className="px-3 py-3 text-right text-lg text-green-600">
                        R$ {totalComDesconto.toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                    {valorEntrada > 0 && (
                      <>
                        <tr className="border-t">
                          <td colSpan={3} className="px-3 py-2 text-right text-blue-600">Entrada:</td>
                          <td className="px-3 py-2 text-right text-blue-600">
                            R$ {valorEntrada.toFixed(2)}
                          </td>
                          <td></td>
                        </tr>
                        <tr className="font-semibold">
                          <td colSpan={3} className="px-3 py-2 text-right text-orange-600">Saldo Restante:</td>
                          <td className="px-3 py-2 text-right text-orange-600">
                            R$ {saldoRestante.toFixed(2)}
                          </td>
                          <td></td>
                        </tr>
                      </>
                    )}
                  </tfoot>
                </table>
              </div>
            )}

            {items.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                Nenhum serviço adicionado
              </p>
            )}
          </div>

          {/* Descontos e Pagamento */}
          <div className="space-y-3 border-t pt-4">
            <h3 className="font-medium text-sm">Pagamento</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="desconto_valor">Desconto (R$)</Label>
                <Input
                  id="desconto_valor"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...register('desconto_valor', { valueAsNumber: true })}
                  disabled={isLoading || descontoPercentual > 0}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="desconto_percentual">Desconto (%)</Label>
                <Input
                  id="desconto_percentual"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="0"
                  {...register('desconto_percentual', { valueAsNumber: true })}
                  disabled={isLoading || descontoValor > 0}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor_entrada">Valor de Entrada</Label>
              <Input
                id="valor_entrada"
                type="number"
                step="0.01"
                min="0"
                max={totalComDesconto}
                placeholder="0.00"
                {...register('valor_entrada', { valueAsNumber: true })}
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                Valor pago no momento da abertura da ordem
              </p>
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Detalhes para o cliente..."
              {...register('observacoes')}
              disabled={isLoading}
              rows={2}
            />
          </div>

          {/* Notas Internas */}
          <div className="space-y-2">
            <Label htmlFor="notas_internas">Notas Internas</Label>
            <Textarea
              id="notas_internas"
              placeholder="Anotações internas (não visível para o cliente)..."
              {...register('notas_internas')}
              disabled={isLoading}
              rows={2}
            />
          </div>

          {/* Opção de gerar PDF */}
          <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <input
              type="checkbox"
              id="gerar_pdf"
              checked={gerarPDF}
              onChange={(e) => setGerarPDF(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="gerar_pdf" className="text-sm font-medium text-gray-700 cursor-pointer">
              Gerar PDF automaticamente após criar a ordem
            </label>
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
            <Button type="submit" disabled={isLoading || items.length === 0}>
              <Eye className="h-4 w-4 mr-2" />
              {isLoading ? 'Criando...' : 'Visualizar Preview'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    {/* Dialog de Preview - Fora do dialog principal */}
    <OrderPreviewDialog
      open={showPreview}
      onOpenChange={setShowPreview}
      order={previewData?.previewOrder || null}
      organizationName="CRM Atelier"
      onConfirm={handleConfirmSave}
      confirmButtonText="Confirmar e Salvar Ordem"
      showConfirmButton={true}
    />
    </>
  )
}
