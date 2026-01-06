'use client'

import { TrendingUp, TrendingDown, ArrowUpDown } from 'lucide-react'
import { Transaction } from '@/lib/validations/financial'

interface TransactionsTableProps {
  transactions: Transaction[]
  isLoading: boolean
  onSort?: (field: 'descricao' | 'valor' | 'data' | 'tipo') => void
  sortField?: 'descricao' | 'valor' | 'data' | 'tipo'
  sortOrder?: 'asc' | 'desc'
}

export function TransactionsTable({ transactions, isLoading, onSort, sortField, sortOrder }: TransactionsTableProps) {
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR')
  }

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('pt-BR')
  }

  const SortButton = ({ field, children }: { field: 'descricao' | 'valor' | 'data' | 'tipo', children: React.ReactNode }) => (
    <button
      onClick={() => onSort?.(field)}
      className="flex items-center gap-1 hover:text-gray-900 transition-colors"
    >
      {children}
      <ArrowUpDown className={`h-3 w-3 ${sortField === field ? 'text-gray-900' : 'text-gray-400'}`} />
    </button>
  )

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
        <p className="mt-4 text-gray-500">Carregando transações...</p>
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Nenhuma transação encontrada.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <SortButton field="data">Data</SortButton>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <SortButton field="tipo">Tipo</SortButton>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <SortButton field="descricao">Descrição</SortButton>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <SortButton field="valor">Valor</SortButton>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Registrado em
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {transactions.map((transaction) => (
            <tr key={transaction.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {formatDate(transaction.data)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  {transaction.tipo === 'entrada' ? (
                    <>
                      <div className="p-1 bg-green-50 rounded">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="text-sm font-medium text-green-600">Entrada</span>
                    </>
                  ) : (
                    <>
                      <div className="p-1 bg-red-50 rounded">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      </div>
                      <span className="text-sm font-medium text-red-600">Saída</span>
                    </>
                  )}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">
                  {transaction.descricao}
                </div>
                {transaction.observacoes && (
                  <div className="text-xs text-gray-500 mt-1">
                    {transaction.observacoes}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className={`text-sm font-semibold ${
                  transaction.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.tipo === 'entrada' ? '+' : '-'} {formatCurrency(transaction.valor)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-xs text-gray-500">
                  {formatDateTime(transaction.created_at)}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
