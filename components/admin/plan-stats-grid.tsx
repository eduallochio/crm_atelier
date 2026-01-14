'use client'

import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'

interface Stat {
  title: string
  value: string
  change: string
  trend: 'up' | 'down'
  icon: LucideIcon
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow'
}

interface PlanStatsGridProps {
  stats: Stat[]
}

export function PlanStatsGrid({ stats }: PlanStatsGridProps) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-950/50 text-green-600 dark:text-green-400',
    purple: 'bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400',
    red: 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-950/50 text-yellow-600 dark:text-yellow-400',
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.title}
          className="bg-card rounded-lg border border-border p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${colorClasses[stat.color]}`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div className="flex items-center gap-1 text-sm">
              {stat.trend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span
                className={`font-medium ${
                  stat.trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {stat.change}
              </span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
          <p className="text-2xl font-bold">{stat.value}</p>
        </div>
      ))}
    </div>
  )
}
