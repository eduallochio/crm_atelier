'use client'

import { Button } from '@/components/ui/button'
import { Settings, TrendingUp, Users, DollarSign, Check } from 'lucide-react'

interface PlanCardProps {
  plan: {
    id: string
    name: string
    color: string
    price?: number
    subscribers: number
    revenue: number
    conversionRate: number
    averageLifetime: string
    features: string[]
  }
}

export function PlanCard({ plan }: PlanCardProps) {
  const colorClasses = {
    gray: {
      bg: 'bg-gray-50 dark:bg-gray-950/50',
      border: 'border-gray-200 dark:border-gray-800',
      badge: 'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400',
      icon: 'text-gray-600 dark:text-gray-400',
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950/20',
      border: 'border-blue-200 dark:border-blue-800',
      badge: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400',
      icon: 'text-blue-600 dark:text-blue-400',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-950/20',
      border: 'border-purple-200 dark:border-purple-800',
      badge: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400',
      icon: 'text-purple-600 dark:text-purple-400',
    },
  }

  const colors = colorClasses[plan.color as keyof typeof colorClasses] || colorClasses.gray

  return (
    <div className={`${colors.bg} rounded-lg border-2 ${colors.border} p-6 hover:shadow-lg transition-shadow`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
          {plan.price !== undefined && plan.price > 0 ? (
            <p className="text-3xl font-bold">
              R$ {plan.price}
              <span className="text-sm font-normal text-muted-foreground">/mês</span>
            </p>
          ) : (
            <p className="text-2xl font-bold text-muted-foreground">Gratuito</p>
          )}
        </div>
        <Button variant="ghost" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className={`${colors.badge} rounded-lg p-3`}>
          <div className="flex items-center gap-2 mb-1">
            <Users className={`h-4 w-4 ${colors.icon}`} />
            <span className="text-xs font-medium">Assinantes</span>
          </div>
          <p className="text-lg font-bold">{plan.subscribers}</p>
        </div>
        <div className={`${colors.badge} rounded-lg p-3`}>
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className={`h-4 w-4 ${colors.icon}`} />
            <span className="text-xs font-medium">MRR</span>
          </div>
          <p className="text-lg font-bold">R$ {plan.revenue}</p>
        </div>
      </div>

      {/* Métricas Adicionais */}
      <div className="space-y-2 mb-4">
        {plan.conversionRate > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Taxa de Conversão</span>
            <span className="font-semibold flex items-center gap-1">
              <TrendingUp className={`h-3 w-3 ${colors.icon}`} />
              {plan.conversionRate}%
            </span>
          </div>
        )}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Tempo Médio</span>
          <span className="font-semibold">{plan.averageLifetime}</span>
        </div>
      </div>

      {/* Features */}
      <div className="border-t border-border pt-4">
        <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase">
          Recursos Inclusos
        </p>
        <ul className="space-y-2">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <Check className={`h-4 w-4 mt-0.5 shrink-0 ${colors.icon}`} />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Ações */}
      <div className="mt-4 pt-4 border-t border-border">
        <Button variant="outline" size="sm" className="w-full">
          Editar Configurações
        </Button>
      </div>
    </div>
  )
}
