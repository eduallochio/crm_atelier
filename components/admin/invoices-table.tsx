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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Search, Filter, MoreVertical, Download, Send, RefreshCcw } from 'lucide-react'

interface Invoice {
  id: string
  organizationName: string
  plan: string
  amount: number
  status: 'paid' | 'pending' | 'overdue' | 'failed'
  dueDate: string
  paidDate?: string
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

  const hasData = invoices.length > 0

  const handleProcessPayment = (invoiceId: string) => {
    // TODO: Implementar processamento de pagamento
    console.log('Processar pagamento:', invoiceId)
  }

  const handleRefund = (invoiceId: string) => {
    // TODO: Implementar reembolso
    console.log('Reembolsar:', invoiceId)
  }

  const handleResend = (invoiceId: string) => {
    // TODO: Implementar reenvio de fatura
    console.log('Reenviar fatura:', invoiceId)
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Faturas</h3>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
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
            <SelectItem value="enterprise">Enterprise</SelectItem>
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
                  <th className="text-left p-4 text-sm font-medium">Valor</th>
                  <th className="text-left p-4 text-sm font-medium">Status</th>
                  <th className="text-left p-4 text-sm font-medium">Vencimento</th>
                  <th className="text-left p-4 text-sm font-medium">Pagamento</th>
                  <th className="text-right p-4 text-sm font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoices.map((invoice) => {
                  const status = statusConfig[invoice.status]
                  return (
                    <tr key={invoice.id} className="hover:bg-muted/50 transition-colors">
                      <td className="p-4">
                        <div className="font-medium">{invoice.organizationName}</div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">{invoice.plan}</Badge>
                      </td>
                      <td className="p-4 font-medium">
                        R$ {invoice.amount.toLocaleString('pt-BR')}
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {invoice.status === 'pending' && (
                              <DropdownMenuItem onClick={() => handleProcessPayment(invoice.id)}>
                                <RefreshCcw className="h-4 w-4 mr-2" />
                                Processar Pagamento
                              </DropdownMenuItem>
                            )}
                            {invoice.status === 'paid' && (
                              <DropdownMenuItem onClick={() => handleRefund(invoice.id)}>
                                <RefreshCcw className="h-4 w-4 mr-2" />
                                Reembolsar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleResend(invoice.id)}>
                              <Send className="h-4 w-4 mr-2" />
                              Reenviar Fatura
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Baixar PDF
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
          <p className="text-muted-foreground">Nenhuma fatura encontrada</p>
        </div>
      )}
    </Card>
  )
}
