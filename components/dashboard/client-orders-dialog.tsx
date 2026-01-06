'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { X, DollarSign, Package, Calendar, AlertCircle } from 'lucide-react'
import { useClientOrders } from '@/hooks/use-client-stats'
import type { Client } from '@/lib/validations/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface OrderItem {
  id: string
  service_nome: string
  quantidade: number
  valor_unitario: number
}
import { Button } from '@/components/ui/button'

interface ClientOrdersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: Client | null
}

export function ClientOrdersDialog({ open, onOpenChange, client }: ClientOrdersDialogProps) {
  const { data, isLoading } = useClientOrders(client?.id || '')

  if (!client) return null

  const statusLabels: Record<string, string> = {
    pendente: 'Pendente',
    em_andamento: 'Em Andamento',
    concluido: 'Concluído',
    cancelado: 'Cancelado'
  }

  const statusColors: Record<string, string> = {
    pendente: 'bg-yellow-100 text-yellow-800',
    em_andamento: 'bg-blue-100 text-blue-800',
    concluido: 'bg-green-100 text-green-800',
    cancelado: 'bg-red-100 text-red-800',
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-175 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Histórico de Ordens - {client.nome}</DialogTitle>
          <DialogDescription>
            Visualize todas as ordens de serviço deste cliente
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
            <p className="mt-4 text-gray-500">Carregando ordens...</p>
          </div>
        ) : data ? (
          <>
            {/* Estatísticas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <Package className="h-4 w-4" />
                  <span className="text-xs font-medium">Total Ordens</span>
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  {data.stats.totalOrders}
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-xs font-medium">Total Gasto</span>
                </div>
                <div className="text-2xl font-bold text-green-900">
                  R$ {data.stats.totalSpent.toFixed(2)}
                </div>
              </div>

              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-orange-600 mb-2">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-xs font-medium">Em Aberto</span>
                </div>
                <div className="text-2xl font-bold text-orange-900">
                  {data.stats.openOrders}
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-purple-600 mb-2">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs font-medium">Última Ordem</span>
                </div>
                <div className="text-sm font-semibold text-purple-900">
                  {data.stats.lastOrder 
                    ? format(new Date(data.stats.lastOrder.created_at), 'dd/MM/yy', { locale: ptBR })
                    : '-'
                  }
                </div>
              </div>
            </div>

            {/* Lista de Ordens */}
            <div className="space-y-3">
              {data.orders.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Nenhuma ordem encontrada</p>
                </div>
              ) : (
                data.orders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="font-mono text-sm font-semibold text-gray-900">
                          #{order.numero.toString().padStart(6, '0')}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                          {statusLabels[order.status]}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">
                          R$ {order.valor_total.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(order.data_abertura), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                      </div>
                    </div>

                    {order.items && order.items.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="text-xs text-gray-600 font-medium mb-2">Serviços:</div>
                        <div className="space-y-1">
                          {order.items.map((item: OrderItem) => (
                            <div key={item.id} className="text-sm text-gray-700 flex justify-between">
                              <span>• {item.service_nome}</span>
                              <span className="text-gray-500">
                                {item.quantidade}x R$ {item.valor_unitario.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {order.observacoes && (
                      <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                        <span className="font-medium">Obs:</span> {order.observacoes}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        ) : null}

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
