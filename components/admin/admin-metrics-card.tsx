'use client'

import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'

interface AdminMetricsCardProps {
  title: string
  value: string
  icon: LucideIcon
  trend?: number
  trendLabel?: string
  subtext?: string
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'indigo'
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950',
    icon: 'text-blue-600 dark:text-blue-400',
    trend: 'text-blue-600 dark:text-blue-400',
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-950',
    icon: 'text-green-600 dark:text-green-400',
    trend: 'text-green-600 dark:text-green-400',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-950',
    icon: 'text-red-600 dark:text-red-400',
    trend: 'text-red-600 dark:text-red-400',
  },
  yellow: {
    bg: 'bg-yellow-50 dark:bg-yellow-950',
    icon: 'text-yellow-600 dark:text-yellow-400',
    trend: 'text-yellow-600 dark:text-yellow-400',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-950',
    icon: 'text-purple-600 dark:text-purple-400',
    trend: 'text-purple-600 dark:text-purple-400',
  },
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-950',
    icon: 'text-indigo-600 dark:text-indigo-400',
    trend: 'text-indigo-600 dark:text-indigo-400',
  },
}

export function AdminMetricsCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  subtext,
  color = 'blue',
}: AdminMetricsCardProps) {
  const colors = colorClasses[color]
  const isTrendPositive = trend ? trend >= 0 : undefined

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg transition-shadow">
      {/* Header with Icon */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${colors.icon}`} />
        </div>
      </div>

      {/* Value */}
      <div className="mb-4">
        <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>

      {/* Trend or Subtext */}
      {trend !== undefined && trendLabel ? (
        <div className="flex items-center space-x-1">
          {isTrendPositive ? (
            <TrendingUp className={`w-4 h-4 ${colors.trend}`} />
          ) : (
            <TrendingDown className={`w-4 h-4 ${colors.trend}`} />
          )}
          <p className={`text-sm font-medium ${colors.trend}`}>
            {isTrendPositive ? '+' : ''}{trend} {trendLabel}
          </p>
        </div>
      ) : subtext ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">{subtext}</p>
      ) : null}
    </div>
  )
}
