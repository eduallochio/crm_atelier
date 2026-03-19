'use client'

import { useState } from 'react'
import { Plus, Search, Eye, Banknote, CheckCircle2, Clock, RefreshCw, FileText, AlertTriangle, Layers } from 'lucide-react'
import { Loader } from '@/components/ui/loader'
import { Header } from '@/components/layouts/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useServiceOrders, useUpdateServiceOrder } from '@/hooks/use-service-orders'
import { usePlanLimit } from '@/hooks/use-plan-usage'
import { ServiceOrdersTable } from '@/components/dashboard/service-orders-table'
import { ServiceOrderDialog } from '@/components/forms/service-order-dialog'
import { OrderTimeline } from '@/components/dashboard/order-timeline'
import { OrderPreviewDialog } from '@/components/dashboard/order-preview-dialog'
import type { ServiceOrder } from '@/lib/validations/service-order'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function OrdensServicoPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')

  const { data: orders = [], isLoading } = useServiceOrders()
  const updateOrder = useUpdateServiceOrder()
  const orderLimit = usePlanLimit('orders')

  // Sempre usa a versão mais recente do cache — evita dados obsoletos no dialog de detalhes
  const currentSelectedOrder = selectedOrder
    ? (orders.find(o => o.id === selectedOrder.id) ?? selectedOrder)
    : null

  const handleView = (order: ServiceOrder) => {
    setSelectedOrder(order)
    setViewDialogOpen(true)
  }

  const parseLocalDate = (dateStr: string): Date => {
    const [y, m, d] = dateStr.split('T')[0].split('-').map(Number)
    return new Date(y, m - 1, d)
  }

  // Filtrar ordens
  const filteredOrders = orders.filter((order) => {
    const query = searchQuery.toLowerCase()
    const matchesSearch = (order.client?.nome?.toLowerCase() ?? '').includes(query) ||
      order.numero.toString().includes(query)
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter

    // Filtro de data
    let matchesDate = true
    if (dateFilter !== 'all') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const orderDate = parseLocalDate(order.data_abertura)

      switch (dateFilter) {
        case 'today':
          matchesDate = orderDate.getTime() === today.getTime()
          break
        case 'week': {
          const weekAgo = new Date(today)
          weekAgo.setDate(weekAgo.getDate() - 7)
          matchesDate = orderDate >= weekAgo
          break
        }
        case 'month': {
          const monthAgo = new Date(today)
          monthAgo.setMonth(monthAgo.getMonth() - 1)
          matchesDate = orderDate >= monthAgo
          break
        }
        case 'overdue':
          if (order.data_prevista && order.status !== 'concluido' && order.status !== 'cancelado') {
            matchesDate = parseLocalDate(order.data_prevista) < today
          } else {
            matchesDate = false
          }
          break
      }
    }

    return matchesSearch && matchesStatus && matchesDate
  })

  // Estatísticas
  const stats = {
    total: orders.length,
    pendente: orders.filter(o => o.status === 'pendente').length,
    em_andamento: orders.filter(o => o.status === 'em_andamento').length,
    concluido: orders.filter(o => o.status === 'concluido').length,
    atrasadas: orders.filter(o => {
      if (o.status === 'concluido' || o.status === 'cancelado') return false
      if (!o.data_prevista) return false
      const today = new Date(); today.setHours(0, 0, 0, 0)
      return parseLocalDate(o.data_prevista) < today
    }).length,
  }

  return (
    <div>
      <Header
        title="Ordens de Serviço"
        description="Gerencie as ordens de serviço"
      />
      
      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Estatísticas */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 sm:gap-4">
          {/* Total */}
          <div className="relative bg-card rounded-2xl overflow-hidden border border-border/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-slate-500" />
            <div className="p-3 sm:p-5">
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Total</p>
                <div className="p-1.5 sm:p-2 rounded-xl bg-slate-500 shadow-sm shrink-0">
                  <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-foreground mb-2 sm:mb-3">{stats.total}</p>
              <div className="h-px bg-border/50 mb-1.5 sm:mb-2" />
              <p className="text-[10.5px] text-muted-foreground">todas as ordens</p>
            </div>
          </div>

          {/* Pendente */}
          <div className="relative bg-card rounded-2xl overflow-hidden border border-border/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-amber-400" />
            <div className="p-3 sm:p-5">
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Pendente</p>
                <div className="p-1.5 sm:p-2 rounded-xl bg-amber-400 shadow-sm shrink-0">
                  <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400 mb-2 sm:mb-3">{stats.pendente}</p>
              <div className="h-px bg-border/50 mb-1.5 sm:mb-2" />
              <p className="text-[10.5px] text-muted-foreground">aguardando</p>
            </div>
          </div>

          {/* Em Andamento */}
          <div className="relative bg-card rounded-2xl overflow-hidden border border-border/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-blue-500" />
            <div className="p-3 sm:p-5">
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Andamento</p>
                <div className="p-1.5 sm:p-2 rounded-xl bg-blue-500 shadow-sm shrink-0">
                  <Layers className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2 sm:mb-3">{stats.em_andamento}</p>
              <div className="h-px bg-border/50 mb-1.5 sm:mb-2" />
              <p className="text-[10.5px] text-muted-foreground">em execução</p>
            </div>
          </div>

          {/* Concluído */}
          <div className="relative bg-card rounded-2xl overflow-hidden border border-border/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-emerald-500" />
            <div className="p-3 sm:p-5">
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Concluído</p>
                <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500 shadow-sm shrink-0">
                  <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-2 sm:mb-3">{stats.concluido}</p>
              <div className="h-px bg-border/50 mb-1.5 sm:mb-2" />
              <p className="text-[10.5px] text-muted-foreground">finalizadas</p>
            </div>
          </div>

          {/* Atrasadas */}
          <div className="relative bg-card rounded-2xl overflow-hidden border border-border/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 col-span-3 sm:col-span-1">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-red-500" />
            <div className="p-3 sm:p-5">
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Atrasadas</p>
                <div className="p-1.5 sm:p-2 rounded-xl bg-red-500 shadow-sm shrink-0">
                  <AlertTriangle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400 mb-2 sm:mb-3">{stats.atrasadas}</p>
              <div className="h-px bg-border/50 mb-1.5 sm:mb-2" />
              <p className="text-[10.5px] text-muted-foreground">fora do prazo</p>
            </div>
          </div>
        </div>

        {/* Barra de Ações */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              {orderLimit.isFree && (
                <span className={`hidden sm:block text-xs font-medium ${orderLimit.atLimit ? 'text-red-500' : orderLimit.nearLimit ? 'text-amber-500' : 'text-muted-foreground'}`}>
                  {orderLimit.usage}/{orderLimit.limit} ordens
                </span>
              )}
              <Button
                onClick={() => setDialogOpen(true)}
                size="sm"
                className="shrink-0"
                disabled={orderLimit.atLimit}
                title={orderLimit.atLimit ? `Limite do plano Free atingido (${orderLimit.limit} ordens). Faça upgrade para continuar.` : undefined}
              >
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Nova Ordem</span>
              </Button>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-auto shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os períodos</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Últimos 7 dias</SelectItem>
                <SelectItem value="month">Último mês</SelectItem>
                <SelectItem value="overdue">Atrasadas</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-auto shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Contador */}
        <div className="text-sm text-muted-foreground">
          {isLoading ? (
            <span>Carregando...</span>
          ) : (
            <span>
              {filteredOrders.length} {filteredOrders.length === 1 ? 'ordem' : 'ordens'}
              {searchQuery && ` encontrada(s)`}
            </span>
          )}
        </div>

        {/* Tabela */}
        {isLoading ? (
          <Loader text="Carregando ordens..." />
        ) : (
          <ServiceOrdersTable orders={filteredOrders} onView={handleView} />
        )}
      </div>

      {/* Dialog de Criar Ordem */}
      <ServiceOrderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      {/* Dialog de Visualizar Ordem */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-200 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Detalhes da Ordem</DialogTitle>
                <DialogDescription>
                  Ordem #{currentSelectedOrder?.numero.toString().padStart(6, '0')}
                </DialogDescription>
              </div>
              {currentSelectedOrder && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(true)}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Preview/Imprimir
                </Button>
              )}
            </div>
          </DialogHeader>

          {currentSelectedOrder && (
            <div className="space-y-6">
              {/* Informações Básicas */}
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium text-foreground">{currentSelectedOrder.client?.nome}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium text-foreground capitalize">{currentSelectedOrder.status.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Total</p>
                    <p className="font-medium text-green-600 dark:text-green-400">
                      R$ {currentSelectedOrder.valor_total.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Situação do Pagamento */}
                {(() => {
                  const valorPago = currentSelectedOrder.valor_pago || 0
                  const saldo = (currentSelectedOrder.valor_total || 0) - valorPago
                  const isPago = currentSelectedOrder.status_pagamento === 'pago'
                  const isParcial = currentSelectedOrder.status_pagamento === 'parcial'
                  return (
                    <div className={`rounded-lg border p-4 space-y-3 ${
                      isPago
                        ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20'
                        : 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-medium text-sm">
                          {isPago ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          )}
                          <span className={isPago ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}>
                            {isPago ? 'Pagamento completo' : isParcial ? 'Pagamento parcial' : 'Aguardando pagamento'}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Total</p>
                          <p className="font-semibold">R$ {(currentSelectedOrder.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Pago</p>
                          <p className="font-semibold text-green-600 dark:text-green-400">
                            R$ {valorPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Saldo</p>
                          <p className={`font-semibold ${saldo > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>
                            R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                      {!isPago && currentSelectedOrder.status === 'concluido' && saldo > 0 && (
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <Banknote className="h-3 w-3" />
                            Conta a receber em <strong>Financeiro → Contas a Receber</strong>
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 px-2 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                            disabled={updateOrder.isPending}
                            onClick={async () => {
                              await updateOrder.mutateAsync({ id: currentSelectedOrder.id, input: { status: 'concluido' } })
                            }}
                          >
                            {updateOrder.isPending
                              ? <RefreshCw className="h-3 w-3 animate-spin" />
                              : <><RefreshCw className="h-3 w-3 mr-1" />Gerar conta</>
                            }
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })()}

                {currentSelectedOrder.observacoes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Observações</p>
                    <p className="text-sm text-foreground">{currentSelectedOrder.observacoes}</p>
                  </div>
                )}

                {currentSelectedOrder.items && currentSelectedOrder.items.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Itens</p>
                    <div className="border border-border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="px-3 py-2 text-left text-muted-foreground">Serviço</th>
                            <th className="px-3 py-2 text-center text-muted-foreground">Qtd</th>
                            <th className="px-3 py-2 text-right text-muted-foreground">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {currentSelectedOrder.items.map((item) => (
                            <tr key={item.id}>
                              <td className="px-3 py-2 text-foreground">{item.service_nome}</td>
                              <td className="px-3 py-2 text-center text-foreground">{item.quantidade}</td>
                              <td className="px-3 py-2 text-right text-foreground">
                                R$ {item.valor_total.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Timeline e Notas */}
              <OrderTimeline orderId={currentSelectedOrder.id} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Preview */}
      <OrderPreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        order={currentSelectedOrder}
        organizationName="Meu Atelier"
        showConfirmButton={false}
      />
    </div>
  )
}
