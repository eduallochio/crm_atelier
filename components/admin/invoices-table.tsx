'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Filter, ExternalLink } from 'lucide-react'

interface Invoice {
  id: string
  organizationName: string
  plan: string
  amount: number
  netAmount: number
  status: 'paid' | 'pending' | 'overdue' | 'failed'
  dueDate: string
  paidDate?: string | null
  invoiceUrl?: string | null
}

interface InvoicesTableProps {
  invoices: Invoice[]
}

const statusConfig = {
  paid: { label: 'Pago', variant: 'default' as const, color: 'bg-green-500' },
  pending: { label: 'Pendente', variant: 'secondary' as const, color: 'bg-yellow-500' },
  overdue: { label: 'Vencido', variant: 'destructive' as const, color: 'bg-red-500' },
  failed: { label: 'Falhou', variant: 'destructive' as const, color: 'bg-red-500' },
}

export function InvoicesTable({ invoices }: InvoicesTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [planFilter, setPlanFilter] = useState<string>('all')

  const filtered = invoices.filter((invoice) => {
    if (statusFilter !== 'all' && invoice.status !== statusFilter) return false
    if (planFilter !== 'all' && invoice.plan !== planFilter) return false
    if (searchTerm && !invoice.organizationName.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  const hasData = filtered.length > 0

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Faturas</h3>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por organização..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-45">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="paid">Pago</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="overdue">Vencido</SelectItem>
            <SelectItem value="failed">Falhou</SelectItem>
          </SelectContent>
        </Select>
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-full sm:w-45">
            <SelectValue placeholder="Plano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Planos</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      {hasData ? (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 text-sm font-medium">Organização</th>
                  <th className="text-left p-4 text-sm font-medium">Plano</th>
                  <th className="text-left p-4 text-sm font-medium">Valor Bruto</th>
                  <th className="text-left p-4 text-sm font-medium">Taxa Asaas</th>
                  <th className="text-left p-4 text-sm font-medium">Valor Líquido</th>
                  <th className="text-left p-4 text-sm font-medium">Status</th>
                  <th className="text-left p-4 text-sm font-medium">Vencimento</th>
                  <th className="text-left p-4 text-sm font-medium">Pagamento</th>
                  <th className="text-right p-4 text-sm font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((invoice) => {
                  const status = statusConfig[invoice.status]
                  const fee = Math.max(0, invoice.amount - invoice.netAmount)
                  return (
                    <tr key={invoice.id} className="hover:bg-muted/50 transition-colors">
                      <td className="p-4">
                        <div className="font-medium">{invoice.organizationName}</div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">{invoice.plan}</Badge>
                      </td>
                      <td className="p-4 font-medium">
                        R$ {invoice.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-sm text-red-600 dark:text-red-400">
                        {invoice.status === 'paid'
                          ? `- R$ ${fee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : '—'
                        }
                      </td>
                      <td className="p-4 font-medium text-green-600 dark:text-green-400">
                        {invoice.status === 'paid'
                          ? `R$ ${invoice.netAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : '—'
                        }
                      </td>
                      <td className="p-4">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {new Date(invoice.dueDate).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {invoice.paidDate 
                          ? new Date(invoice.paidDate).toLocaleDateString('pt-BR')
                          : '-'
                        }
                      </td>
                      <td className="p-4 text-right">
                        {invoice.invoiceUrl ? (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={invoice.invoiceUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Ver no Asaas
                            </a>
                          </Button>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-muted rounded-lg p-12 text-center">
          <p className="text-muted-foreground">
            {invoices.length === 0 ? 'Nenhuma fatura encontrada' : 'Nenhuma fatura corresponde aos filtros'}
          </p>
        </div>
      )}
    </Card>
  )
}
