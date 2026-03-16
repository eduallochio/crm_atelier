'use client'

import { useState } from 'react'
import { MoreHorizontal, Pencil, Trash2, Check, ArrowUpDown } from 'lucide-react'
import { Payable } from '@/lib/validations/financial'
import { useUpdatePayable, useDeletePayable } from '@/hooks/use-financial'
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
import { PayableDialog } from './payable-dialog'

interface PayablesTableProps {
  payables: Payable[]
  isLoading: boolean
  onSort?: (field: 'descricao' | 'fornecedor' | 'valor' | 'data_vencimento' | 'status') => void
  sortField?: 'descricao' | 'fornecedor' | 'valor' | 'data_vencimento' | 'status'
  sortOrder?: 'asc' | 'desc'
}

export function PayablesTable({ payables, isLoading, onSort, sortField, sortOrder }: PayablesTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editPayable, setEditPayable] = useState<Payable | null>(null)

  const updateMutation = useUpdatePayable()
  const deleteMutation = useDeletePayable()

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  const formatDate = (date: string) => {
    const d = date.split('T')[0]
    const [year, month, day] = d.split('-')
    return `${day}/${month}/${year}`
  }

  const getLocalDateStr = () => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const handleMarkAsPaid = async (id: string) => {
    await updateMutation.mutateAsync({
      id,
      input: {
        status: 'pago',
        data_pagamento: getLocalDateStr(),
      },
    })
  }

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId)
      setDeleteId(null)
    }
  }

  const SortButton = ({ field, children }: { field: 'descricao' | 'fornecedor' | 'valor' | 'data_vencimento' | 'status', children: React.ReactNode }) => (
    <button
      onClick={() => onSort?.(field)}
      className="flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {children}
      <ArrowUpDown className={`h-3 w-3 ${sortField === field ? 'text-foreground' : 'text-muted-foreground'}`} />
    </button>
  )

  const getStatusBadge = (status: string) => {
    const styles = {
      pendente: 'bg-yellow-100 dark:bg-yellow-950/50 text-yellow-800 dark:text-yellow-400',
      pago: 'bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-400',
      atrasado: 'bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-400',
      cancelado: 'bg-muted text-muted-foreground',
    }
    const labels = {
      pendente: 'Pendente',
      pago: 'Pago',
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
        <p className="mt-4 text-muted-foreground">Carregando contas a pagar...</p>
      </div>
    )
  }

  if (payables.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Nenhuma conta a pagar encontrada.</p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <SortButton field="fornecedor">Fornecedor</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <SortButton field="descricao">Descrição</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <SortButton field="valor">Valor</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <SortButton field="data_vencimento">Vencimento</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <SortButton field="status">Status</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Pagamento
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {payables.map((payable) => (
              <tr key={payable.id} className="hover:bg-accent/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-foreground">
                    {payable.fornecedor}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-foreground">
                    {payable.descricao}
                  </div>
                  {payable.observacoes && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {payable.observacoes}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-foreground">
                    {formatCurrency(payable.valor)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-foreground">
                    {formatDate(payable.data_vencimento)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(payable.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-foreground">
                    {payable.data_pagamento ? formatDate(payable.data_pagamento) : '-'}
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
                      {payable.status !== 'pago' && (
                        <DropdownMenuItem onClick={() => handleMarkAsPaid(payable.id)}>
                          <Check className="h-4 w-4 mr-2" />
                          Marcar como Pago
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => setEditPayable(payable)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleteId(payable.id)}
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
              Tem certeza que deseja excluir esta conta a pagar? Esta ação não pode ser desfeita.
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

      {editPayable && (
        <PayableDialog
          open={!!editPayable}
          onOpenChange={(open) => !open && setEditPayable(null)}
          payable={editPayable}
        />
      )}
    </>
  )
}
