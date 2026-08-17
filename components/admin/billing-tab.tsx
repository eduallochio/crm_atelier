'use client'

import { useEffect, useState } from 'react'
import { CreditCard, RefreshCw, CheckCircle2, Clock, AlertTriangle, XCircle, Loader2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Payment {
  id: string
  value: number
  netValue: number
  status: string
  dueDate: string
  paymentDate?: string
  billingType: string
  invoiceUrl?: string
}

interface SubscriptionData {
  id: string
  status: string
  value: number
  cycle: string
  nextDueDate: string
  billingType: string
  payments: Payment[]
}

interface BillingTabProps {
  organization: {
    id: string
    name: string
    plan: string
    state: string
    mrr: number
  }
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  RECEIVED:        { label: 'Pago',        icon: CheckCircle2,    color: 'text-emerald-600' },
  CONFIRMED:       { label: 'Confirmado',  icon: CheckCircle2,    color: 'text-emerald-600' },
  PENDING:         { label: 'Pendente',    icon: Clock,           color: 'text-amber-500' },
  OVERDUE:         { label: 'Vencido',     icon: AlertTriangle,   color: 'text-red-500' },
  REFUNDED:        { label: 'Estornado',   icon: XCircle,         color: 'text-gray-500' },
  DELETED:         { label: 'Cancelado',   icon: XCircle,         color: 'text-gray-500' },
  RECEIVED_IN_CASH: { label: 'Pago (dinheiro)', icon: CheckCircle2, color: 'text-emerald-600' },
}

const CYCLE_LABEL: Record<string, string> = { MONTHLY: 'Mensal', YEARLY: 'Anual' }
const BILLING_LABEL: Record<string, string> = { PIX: 'PIX', BOLETO: 'Boleto', CREDIT_CARD: 'Cartão' }

function fmtDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR')
}
function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function BillingTab({ organization }: BillingTabProps) {
  const [data, setData]       = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/organizations/${organization.id}/billing`)
      if (!res.ok) throw new Error('Erro ao carregar faturamento')
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setData(json)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [organization.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        Carregando faturamento...
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-12 text-center">
        <CreditCard className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400 mb-4">{error ?? 'Nenhuma assinatura encontrada para esta organização.'}</p>
        <Button variant="outline" size="sm" onClick={load} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Tentar novamente
        </Button>
      </div>
    )
  }

  const paidPayments = data.payments.filter(p => ['RECEIVED','CONFIRMED','RECEIVED_IN_CASH'].includes(p.status))
  const totalReceived = paidPayments.reduce((s, p) => s + p.netValue, 0)

  return (
    <div className="space-y-6">

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Valor da assinatura', value: fmtBRL(data.value) },
          { label: 'Ciclo',               value: CYCLE_LABEL[data.cycle] ?? data.cycle },
          { label: 'Próxima cobrança',    value: fmtDate(data.nextDueDate) },
          { label: 'Total recebido',      value: fmtBRL(totalReceived) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Histórico de pagamentos */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-white">Histórico de cobranças</h3>
          <Button variant="ghost" size="sm" onClick={load} className="gap-2 text-gray-500">
            <RefreshCw className="w-3.5 h-3.5" /> Atualizar
          </Button>
        </div>

        {data.payments.length === 0 ? (
          <p className="text-center text-gray-500 py-10 text-sm">Nenhuma cobrança encontrada.</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.payments.map((p) => {
              const cfg = STATUS_CONFIG[p.status] ?? { label: p.status, icon: Clock, color: 'text-gray-500' }
              const Icon = cfg.icon
              return (
                <div key={p.id} className="flex items-center gap-4 px-6 py-3">
                  <Icon className={`w-4 h-4 shrink-0 ${cfg.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {fmtBRL(p.value)} · {BILLING_LABEL[p.billingType] ?? p.billingType}
                    </p>
                    <p className="text-xs text-gray-500">
                      Venc. {fmtDate(p.dueDate)}
                      {p.paymentDate ? ` · Pago em ${fmtDate(p.paymentDate)}` : ''}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                  {p.invoiceUrl && (
                    <a href={p.invoiceUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
