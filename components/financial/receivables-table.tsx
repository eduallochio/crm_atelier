'use client'

import { useState } from 'react'
import { MoreHorizontal, Pencil, Trash2, Check, ArrowUpDown } from 'lucide-react'
import { Receivable } from '@/lib/validations/financial'
import { useUpdateReceivable, useDeleteReceivable } from '@/hooks/use-financial'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { ReceivableDialog } from './receivable-dialog'

interface ReceivablesTableProps {
  receivables: Receivable[]
  isLoading: boolean
  onSort?: (field: 'descricao' | 'valor' | 'data_vencimento' | 'status') => void
  sortField?: 'descricao' | 'valor' | 'data_vencimento' | 'status'
  sortOrder?: 'asc' | 'desc'
}

export function ReceivablesTable({ receivables, isLoading, onSort, sortField, sortOrder }: ReceivablesTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editReceivable, setEditReceivable] = useState<Receivable | null>(null)

  const updateMutation = useUpdateReceivable()
  const deleteMutation = useDeleteReceivable()

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR')
  }

  const handleMarkAsReceived = async (id: string) => {
    await updateMutation.mutateAsync({
      id,
      input: {
        status: 'recebido',
        data_recebimento: new Date().toISOString().split('T')[0],
      },
    })
  }

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId)
      setDeleteId(null)
    }
  }

  const SortButton = ({ field, children }: { field: 'descricao' | 'valor' | 'data_vencimento' | 'status', children: React.ReactNode }) => (
    <button
      onClick={() => onSort?.(field)}
      className="flex items-center gap-1 hover:text-gray-900 transition-colors"
    >
      {children}
      <ArrowUpDown className={`h-3 w-3 ${sortField === field ? 'text-gray-900' : 'text-gray-400'}`} />
    </button>
  )

  const getStatusBadge = (status: string) => {
    const styles = {
      pendente: 'bg-yellow-100 text-yellow-800',
      recebido: 'bg-green-100 text-green-800',
      atrasado: 'bg-red-100 text-red-800',
      cancelado: 'bg-gray-100 text-gray-800',
    }
    const labels = {
      pendente: 'Pendente',
      recebido: 'Recebido',
      atrasado: 'Atrasado',
      cancelado: 'Cancelado',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
        <p className="mt-4 text-gray-500">Carregando contas a receber...</p>
      </div>
    )
  }

  if (receivables.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Nenhuma conta a receber encontrada.</p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="descricao">Descrição</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="valor">Valor</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="data_vencimento">Vencimento</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="status">Status</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Recebimento
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {receivables.map((receivable) => (
              <tr key={receivable.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {receivable.descricao}
                  </div>
                  {receivable.observacoes && (
                    <div className="text-xs text-gray-500 mt-1">
                      {receivable.observacoes}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-gray-900">
                    {formatCurrency(receivable.valor)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatDate(receivable.data_vencimento)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(receivable.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {receivable.data_recebimento ? formatDate(receivable.data_recebimento) : '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {receivable.status !== 'recebido' && (
                        <DropdownMenuItem onClick={() => handleMarkAsReceived(receivable.id)}>
                          <Check className="h-4 w-4 mr-2" />
                          Marcar como Recebido
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => setEditReceivable(receivable)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleteId(receivable.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta conta a receber? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {editReceivable && (
        <ReceivableDialog
          open={!!editReceivable}
          onOpenChange={(open) => !open && setEditReceivable(null)}
          receivable={editReceivable}
        />
      )}
    </>
  )
}
