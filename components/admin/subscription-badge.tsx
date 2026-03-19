'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface PlanBadgeProps {
  plan: 'free' | 'pro'
}

export function PlanBadge({ plan }: PlanBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        plan === 'pro'
          ? 'border-blue-300 dark:border-blue-700 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400'
          : 'border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
      )}
    >
      {plan === 'pro' ? 'Pro' : 'Free'}
    </Badge>
  )
}

interface StateBadgeProps {
  state: 'active' | 'trial' | 'cancelled' | 'suspended'
}

const stateStyles: Record<string, string> = {
  active:    'border-green-300  dark:border-green-700  bg-green-100  dark:bg-green-950  text-green-700  dark:text-green-400',
  trial:     'border-yellow-300 dark:border-yellow-700 bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400',
  cancelled: 'border-red-300    dark:border-red-700    bg-red-100    dark:bg-red-950    text-red-700    dark:text-red-400',
  suspended: 'border-orange-300 dark:border-orange-700 bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400',
}

const stateLabels: Record<string, string> = {
  active: 'Ativo', trial: 'Trial', cancelled: 'Cancelado', suspended: 'Suspenso',
}

export function StateBadge({ state }: StateBadgeProps) {
  return (
    <Badge variant="outline" className={cn(stateStyles[state] ?? stateStyles.active)}>
      {stateLabels[state] ?? state}
    </Badge>
  )
}
