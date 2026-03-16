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
      <div className="text-center py-12 bg-card rounded-lg border border-border">
        <p className="text-muted-foreground mb-2">Nenhum serviço cadastrado</p>
        <p className="text-sm text-muted-foreground/70">
          Comece adicionando seu primeiro serviço
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Mobile: card list */}
      <div className="sm:hidden space-y-3">
        {services.map((service) => (
          <div key={service.id} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-foreground truncate">{service.nome}</p>
                  {service.categoria && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">
                      <Tag className="h-3 w-3" />
                      {service.categoria}
                    </span>
                  )}
                </div>
                {service.descricao && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{service.descricao}</p>
                )}
                <div className="flex items-center gap-3 mt-2">
                  <span className="flex items-center text-base font-semibold text-green-600 dark:text-green-400">
                    <DollarSign className="h-4 w-4" />
                    {service.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  {service.tempo_estimado && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {service.tempo_estimado}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="flex items-center gap-1.5">
                  <Switch
                    checked={service.ativo}
                    onCheckedChange={() => handleToggleStatus(service.id, service.ativo)}
                    disabled={toggleStatus.isPending}
                  />
                  <span className={`text-xs font-medium ${service.ativo ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                    {service.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setHistoryService(service)}
                    className="p-1.5 rounded text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                    title="Histórico de preços"
                  >
                    <History className="h-4 w-4" />
                  </button>
                  <Button variant="ghost" size="icon" onClick={() => onDuplicate(service)} title="Duplicar" className="h-8 w-8">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onEdit(service)} className="h-8 w-8">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteId(service.id)}
                    className="h-8 w-8 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden sm:block bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Serviço
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Detalhes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Preço
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {services.map((service) => (
                <tr key={service.id} className="hover:bg-accent/50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-foreground">
                        {service.nome}
                      </div>
                      {service.descricao && (
                        <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {service.descricao}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {service.categoria && (
                        <div className="flex items-center text-sm text-foreground">
                          <Tag className="h-3 w-3 mr-2 text-muted-foreground" />
                          {service.categoria}
                        </div>
                      )}
                      {service.tempo_estimado && (
                        <div className="flex items-center text-sm text-foreground">
                          <Clock className="h-3 w-3 mr-2 text-muted-foreground" />
                          {service.tempo_estimado}
                        </div>
                      )}
                      {!service.categoria && !service.tempo_estimado && (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-lg font-semibold text-green-600 dark:text-green-400">
                      <DollarSign className="h-4 w-4" />
                      {service.preco.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <button
                      onClick={() => setHistoryService(service)}
                      className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mt-1"
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
                      <span className={`text-sm font-medium ${service.ativo ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
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
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/50"
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
