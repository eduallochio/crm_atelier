'use client'

import { useState } from 'react'
import { Plus, Search, Eye } from 'lucide-react'
import { Header } from '@/components/layouts/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useServiceOrders } from '@/hooks/use-service-orders'
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

  const handleView = (order: ServiceOrder) => {
    setSelectedOrder(order)
    setViewDialogOpen(true)
  }

  // Filtrar ordens
  const filteredOrders = orders.filter((order) => {
    const query = searchQuery.toLowerCase()
    const matchesSearch = order.client?.nome.toLowerCase().includes(query)
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter

    // Filtro de data
    let matchesDate = true
    if (dateFilter !== 'all') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const orderDate = new Date(order.data_abertura)
      orderDate.setHours(0, 0, 0, 0)

      switch (dateFilter) {
        case 'today':
          matchesDate = orderDate.getTime() === today.getTime()
          break
        case 'week':
          const weekAgo = new Date(today)
          weekAgo.setDate(weekAgo.getDate() - 7)
          matchesDate = orderDate >= weekAgo
          break
        case 'month':
          const monthAgo = new Date(today)
          monthAgo.setMonth(monthAgo.getMonth() - 1)
          matchesDate = orderDate >= monthAgo
          break
        case 'overdue':
          if (order.data_prevista && order.status !== 'concluido' && order.status !== 'cancelado') {
            const prevista = new Date(order.data_prevista)
            prevista.setHours(0, 0, 0, 0)
            matchesDate = prevista < today
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
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const prevista = new Date(o.data_prevista)
      prevista.setHours(0, 0, 0, 0)
      return prevista < today
    }).length,
  }

  return (
    <div>
      <Header
        title="Ordens de Serviço"
        description="Gerencie as ordens de serviço"
      />
      
      <div className="p-6 space-y-6">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          <div className="bg-white border rounded-lg p-4">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <p className="text-sm text-yellow-600">Pendente</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pendente}</p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <p className="text-sm text-blue-600">Em Andamento</p>
            <p className="text-2xl font-bold text-blue-600">{stats.em_andamento}</p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <p className="text-sm text-green-600">Concluído</p>
            <p className="text-2xl font-bold text-green-600">{stats.concluido}</p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <p className="text-sm text-red-600">Atrasadas</p>
            <p className="text-2xl font-bold text-red-600">{stats.atrasadas}</p>
          </div>
        </div>

        {/* Barra de Ações */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">Todos os períodos</option>
              <option value="today">Hoje</option>
              <option value="week">Últimos 7 dias</option>
              <option value="month">Último mês</option>
              <option value="overdue">Atrasadas</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">Todos os status</option>
              <option value="pendente">Pendente</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="concluido">Concluído</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Ordem
          </Button>
        </div>

        {/* Contador */}
        <div className="text-sm text-gray-600">
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
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-4 text-gray-500">Carregando ordens...</p>
          </div>
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
                  Ordem #{selectedOrder?.numero.toString().padStart(6, '0')}
                </DialogDescription>
              </div>
              {selectedOrder && (
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

          {selectedOrder && (
            <div className="space-y-6">
              {/* Informações Básicas */}
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Cliente</p>
                  <p className="font-medium">{selectedOrder.client?.nome}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="font-medium capitalize">{selectedOrder.status.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Valor Total</p>
                    <p className="font-medium text-green-600">
                      R$ {selectedOrder.valor_total.toFixed(2)}
                    </p>
                  </div>
                </div>

                {selectedOrder.observacoes && (
                  <div>
                    <p className="text-sm text-gray-500">Observações</p>
                    <p className="text-sm">{selectedOrder.observacoes}</p>
                  </div>
                )}

                {selectedOrder.items && selectedOrder.items.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Itens</p>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left">Serviço</th>
                            <th className="px-3 py-2 text-center">Qtd</th>
                            <th className="px-3 py-2 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {selectedOrder.items.map((item) => (
                            <tr key={item.id}>
                              <td className="px-3 py-2">{item.service_nome}</td>
                              <td className="px-3 py-2 text-center">{item.quantidade}</td>
                              <td className="px-3 py-2 text-right">
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
              <OrderTimeline orderId={selectedOrder.id} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Preview */}
      <OrderPreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        order={selectedOrder}
        organizationName="CRM Atelier"
        showConfirmButton={false}
      />
    </div>
  )
}
