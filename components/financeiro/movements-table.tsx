'use client'

import { TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CashierMovement } from '@/lib/validations/cashier'

interface MovementsTableProps {
  movements: CashierMovement[]
  isLoading: boolean
}

const typeIcons = {
  entrada: TrendingUp,
  saida: TrendingDown,
  sangria: ArrowDownCircle,
  reforco: ArrowUpCircle,
}

const typeColors = {
  entrada: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/50',
  saida: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50',
  sangria: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/50',
  reforco: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50',
}

const typeLabels = {
  entrada: 'Entrada',
  saida: 'Saída',
  sangria: 'Sangria',
  reforco: 'Reforço',
}

const paymentLabels: Record<string, string> = {
  dinheiro: 'Dinheiro',
  pix: 'PIX',
  credito: 'Crédito',
  debito: 'Débito',
  boleto: 'Boleto',
  transferencia: 'Transferência',
  cheque: 'Cheque',
  outros: 'Outros',
}

export function MovementsTable({ movements, isLoading }: MovementsTableProps) {
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('pt-BR')
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
        <p className="mt-4 text-muted-foreground">Carregando movimentos...</p>
      </div>
    )
  }

  if (movements.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Nenhum movimento registrado</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Forma de Pagamento</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Data/Hora</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.map((movement) => {
            const Icon = typeIcons[movement.tipo]
            return (
              <TableRow key={movement.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded ${typeColors[movement.tipo]}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{typeLabels[movement.tipo]}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`font-semibold ${
                    movement.tipo === 'entrada' || movement.tipo === 'reforco' 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {movement.tipo === 'entrada' || movement.tipo === 'reforco' ? '+' : '-'}
                    {formatCurrency(movement.valor)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="px-2 py-1 bg-muted text-foreground text-xs font-medium rounded-full">
                    {movement.metodo_pagamento_id ? paymentLabels[movement.metodo_pagamento_id] || movement.metodo_pagamento_id : '-'}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground">
                    {movement.descricao || '-'}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {movement.created_at ? formatDateTime(movement.created_at) : '-'}
                  </span>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
