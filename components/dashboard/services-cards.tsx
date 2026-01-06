'use client'

import { useState } from 'react'
import { Pencil, Trash2, DollarSign, Clock, Tag, TrendingUp, Copy, History } from 'lucide-react'
import type { Service } from '@/lib/validations/service'
import { useDeleteService, useToggleServiceStatus } from '@/hooks/use-services'
import { useServiceStats } from '@/hooks/use-service-stats'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ServicePriceHistory } from './service-price-history'

interface ServicesCardsProps {
  services: Service[]
  onEdit: (service: Service) => void
  onDuplicate: (service: Service) => void
}

export function ServicesCards({ services, onEdit, onDuplicate }: ServicesCardsProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [historyService, setHistoryService] = useState<Service | null>(null)
  const deleteService = useDeleteService()
  const toggleStatus = useToggleServiceStatus()
  const { data: stats } = useServiceStats()

  const handleDelete = async () => {
    if (deleteId) {
      await deleteService.mutateAsync(deleteId)
      setDeleteId(null)
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    await toggleStatus.mutateAsync({ id, ativo: !currentStatus })
  }

  const getServiceUsage = (serviceId: string) => {
    return stats?.serviceUsage.find(u => u.id === serviceId)
  }

  if (services.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border">
        <p className="text-gray-500 mb-2">Nenhum serviço cadastrado</p>
        <p className="text-sm text-gray-400">
          Comece adicionando seu primeiro serviço
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => {
          const usage = getServiceUsage(service.id)
          
          return (
            <div
              key={service.id}
              className={`bg-white rounded-lg border p-6 hover:shadow-md transition-shadow ${
                !service.ativo ? 'opacity-60' : ''
              }`}
            >
              {/* Header do Card */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900 mb-1">
                    {service.nome}
                  </h3>
                  {service.categoria && (
                    <div className="flex items-center text-sm text-blue-600 mb-2">
                      <Tag className="h-3 w-3 mr-1" />
                      {service.categoria}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={service.ativo}
                    onCheckedChange={() => handleToggleStatus(service.id, service.ativo)}
                    disabled={toggleStatus.isPending}
                  />
                </div>
              </div>

              {/* Descrição */}
              {service.descricao && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {service.descricao}
                </p>
              )}

              {/* Detalhes */}
              <div className="space-y-2 mb-4 pb-4 border-b">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Preço:</span>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center text-lg font-semibold text-green-600">
                      <DollarSign className="h-4 w-4" />
                      {service.preco.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <button
                      onClick={() => setHistoryService(service)}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                      title="Ver histórico de preços"
                    >
                      <History className="h-3 w-3" />
                      Histórico
                    </button>
                  </div>
                </div>
                
                {service.tempo_estimado && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Tempo:</span>
                    <div className="flex items-center text-sm text-gray-700">
                      <Clock className="h-3 w-3 mr-1" />
                      {service.tempo_estimado}
                    </div>
                  </div>
                )}

                {usage && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Vendas:</span>
                    <div className="flex items-center text-sm font-medium text-purple-600">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {usage.count}x (R$ {usage.revenue.toFixed(2)})
                    </div>
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <div className="mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  service.ativo 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {service.ativo ? '✓ Ativo' : '✕ Inativo'}
                </span>
              </div>

              {/* Ações */}
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDuplicate(service)}
                  className="flex-1"
                  title="Duplicar serviço"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Duplicar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(service)}
                  className="flex-1"
                  title="Editar serviço"
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteId(service.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  title="Excluir serviço"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este serviço? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {historyService && (
        <ServicePriceHistory
          serviceId={historyService.id}
          serviceName={historyService.nome}
          open={!!historyService}
          onOpenChange={(open) => !open && setHistoryService(null)}
        />
      )}
    </>
  )
}
