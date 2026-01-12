'use client'

interface PlanBadgeProps {
  plan: 'free' | 'pro' | 'enterprise'
}

const planConfig = {
  free: {
    label: 'Free',
    className: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700',
  },
  pro: {
    label: 'Pro',
    className: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700',
  },
  enterprise: {
    label: 'Enterprise',
    className: 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-700',
  },
}

export function PlanBadge({ plan }: PlanBadgeProps) {
  const config = planConfig[plan] || {
    label: plan || 'Unknown',
    className: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700',
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}
    >
      {config.label}
    </span>
  )
}

interface StateBadgeProps {
  state: 'active' | 'trial' | 'cancelled' | 'suspended'
}

const stateConfig = {
  active: {
    label: 'Ativo',
    className: 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700',
  },
  trial: {
    label: 'Trial',
    className: 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700',
  },
  cancelled: {
    label: 'Cancelado',
    className: 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700',
  },
  suspended: {
    label: 'Suspenso',
    className: 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-700',
  },
}

export function StateBadge({ state }: StateBadgeProps) {
  const config = stateConfig[state] || {
    label: state || 'Unknown',
    className: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700',
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}
    >
      {config.label}
    </span>
  )
}
