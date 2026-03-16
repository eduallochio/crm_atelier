'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  CreditCard, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertCircle 
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BillingTabProps {
  organization: {
    id: string
    name: string
    plan: 'free' | 'pro'
    state: 'active' | 'trial' | 'cancelled' | 'suspended'
    mrr: number
  }
}

interface Invoice {
  id: string
  date: string
  amount: number
  status: 'paid' | 'pending' | 'failed' | 'refunded'
  method: string
  invoice_url?: string
}

export function BillingTab({ organization }: BillingTabProps) {
  // Dados simulados de faturas
  const invoices: Invoice[] = [
    {
      id: 'INV-2026-001',
      date: '2026-01-01',
      amount: organization.mrr,
      status: 'paid',
      method: 'Cartão •••• 4242',
      invoice_url: '#',
    },
    {
      id: 'INV-2025-012',
      date: '2025-12-01',
      amount: organization.mrr,
      status: 'paid',
      method: 'Cartão •••• 4242',
      invoice_url: '#',
    },
    {
      id: 'INV-2025-011',
      date: '2025-11-01',
      amount: organization.mrr,
      status: 'paid',
      method: 'Cartão •••• 4242',
      invoice_url: '#',
    },
    {
      id: 'INV-2025-010',
      date: '2025-10-01',
      amount: organization.mrr,
      status: 'failed',
      method: 'Cartão •••• 4242',
    },
    {
      id: 'INV-2025-009',
      date: '2025-09-01',
      amount: organization.mrr,
      status: 'paid',
      method: 'Cartão •••• 4242',
      invoice_url: '#',
    },
  ]

  const getStatusIcon = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
      case 'refunded':
        return <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-400" />
    }
  }

  const getStatusLabel = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return 'Paga'
      case 'pending':
        return 'Pendente'
      case 'failed':
        return 'Falhou'
      case 'refunded':
        return 'Reembolsada'
    }
  }

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700'
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700'
      case 'failed':
        return 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700'
      case 'refunded':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border-gray-300 dark:border-gray-700'
    }
  }

  // Calcular próxima cobrança
  const nextBillingDate = new Date()
  nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)

  // Total faturado
  const totalBilled = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0)

  // Pagamentos falhados
  const failedPayments = invoices.filter(inv => inv.status === 'failed')

  if (organization.plan === 'free') {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-12 text-center">
        <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Plano Gratuito
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Esta organização está no plano gratuito e não possui histórico de faturamento.
        </p>
        <Button>Fazer Upgrade para Plano Pago</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 dark:bg-green-950 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Faturado</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                R$ {totalBilled.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-950 rounded-lg">
              <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Próxima Cobrança</p>
              <p className="text-base font-medium text-gray-900 dark:text-white">
                {format(nextBillingDate, 'dd/MM/yyyy', { locale: ptBR })}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                R$ {organization.mrr.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 dark:bg-orange-950 rounded-lg">
              <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pagamentos Falhados</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {failedPayments.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Método de Pagamento */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Método de Pagamento
        </h3>
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-950 rounded-lg">
              <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Cartão de Crédito
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                •••• •••• •••• 4242
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Expira em 12/2028
              </p>
            </div>
          </div>
          <Button variant="outline">Atualizar</Button>
        </div>
      </div>

      {/* Histórico de Faturas */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Histórico de Faturas
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Fatura
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Data
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Método
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Valor
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="py-4 px-4 text-sm font-medium text-gray-900 dark:text-white">
                    {invoice.id}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                    {format(new Date(invoice.date), 'dd/MM/yyyy', { locale: ptBR })}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(invoice.status)}`}>
                      {getStatusIcon(invoice.status)}
                      {getStatusLabel(invoice.status)}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                    {invoice.method}
                  </td>
                  <td className="py-4 px-4 text-sm font-medium text-gray-900 dark:text-white text-right">
                    R$ {invoice.amount.toFixed(2)}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {invoice.status === 'paid' && (
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                      {invoice.status === 'failed' && (
                        <Button variant="outline" size="sm">
                          Reprocessar
                        </Button>
                      )}
                      {invoice.status === 'paid' && (
                        <Button variant="ghost" size="sm">
                          Reembolsar
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Falhas de Pagamento */}
      {failedPayments.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Atenção: Pagamentos Falhados
          </h3>
          <p className="text-sm text-red-700 dark:text-red-300 mb-4">
            Esta organização possui {failedPayments.length} pagamento(s) que falharam. 
            Considere entrar em contato para resolver a situação ou processar manualmente.
          </p>
          <div className="flex gap-2">
            <Button variant="outline">Enviar Email de Cobrança</Button>
            <Button>Processar Pagamento Manual</Button>
          </div>
        </div>
      )}
    </div>
  )
}
