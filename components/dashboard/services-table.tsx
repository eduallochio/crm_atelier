'use client'

import { useState } from 'react'
import { Pencil, Trash2, DollarSign, Clock, Tag, Copy, History } from 'lucide-react'
import type { Service } from '@/lib/validations/service'
import { useDeleteService, useToggleServiceStatus } from '@/hooks/use-services'
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

interface ServicesTableProps {
  services: Service[]
  onEdit: (service: Service) => void
  onDuplicate: (service: Service) => void
}

export function ServicesTable({ services, onEdit, onDuplicate }: ServicesTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [historyService, setHistoryService] = useState<Service | null>(null)
  const deleteService = useDeleteService()
  const toggleStatus = useToggleServiceStatus()

  const handleDelete = async () => {
    if (deleteId) {
      await deleteService.mutateAsync(deleteId)
      setDeleteId(null)
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    await toggleStatus.mutateAsync({ id, ativo: !currentStatus })
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
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Serviço
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Detalhes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Preço
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {services.map((service) => (
                <tr key={service.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">
                        {service.nome}
                      </div>
                      {service.descricao && (
                        <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {service.descricao}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {service.categoria && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Tag className="h-3 w-3 mr-2 text-gray-400" />
                          {service.categoria}
                        </div>
                      )}
                      {service.tempo_estimado && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-3 w-3 mr-2 text-gray-400" />
                          {service.tempo_estimado}
                        </div>
                      )}
                      {!service.categoria && !service.tempo_estimado && (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-lg font-semibold text-green-600">
                      <DollarSign className="h-4 w-4" />
                      {service.preco.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <button
                      onClick={() => setHistoryService(service)}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-1"
                      title="Ver histórico de preços"
                    >
                      <History className="h-3 w-3" />
                      Histórico
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Switch
                        checked={service.ativo}
                        onCheckedChange={() => handleToggleStatus(service.id, service.ativo)}
                        disabled={toggleStatus.isPending}
                      />
                      <span className={`text-sm font-medium ${service.ativo ? 'text-green-600' : 'text-gray-400'}`}>
                        {service.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDuplicate(service)}
                        title="Duplicar serviço"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(service)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(service.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
