'use client'

import { CreditCard } from 'lucide-react'

interface BillingTabProps {
  organization: {
    id: string
    name: string
    plan: string
    state: 'active' | 'trial' | 'cancelled' | 'suspended'
    mrr: number
  }
}

export function BillingTab({ organization: _ }: BillingTabProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-12 text-center">
      <CreditCard className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Faturamento não implementado
      </h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
        Esta seção exigirá integração com uma plataforma de pagamento (Stripe, PagSeguro, etc.).
        Nenhum dado de cobrança real está disponível no momento.
      </p>
    </div>
  )
}
