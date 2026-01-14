'use client'

import { 
  LucideIcon, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'

const iconMap: Record<string, LucideIcon> = {
  DollarSign,
  TrendingUp,
  Clock,
  AlertCircle,
}

interface Metric {
  title: string
  value: string
  target?: string
  progress?: number
  change: string
  trend: 'up' | 'down'
  icon: string
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow'
}

interface BillingMetricsGridProps {
  metrics: Metric[]
}

export function BillingMetricsGrid({ metrics }: BillingMetricsGridProps) {
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
      {metrics.map((metric) => {
        const Icon = iconMap[metric.icon] || DollarSign
        const TrendIcon = metric.trend === 'up' ? TrendingUp : TrendingDown
        const trendColor = metric.trend === 'up' ? 'text-green-500' : 'text-red-500'

        return (
          <div
            key={metric.title}
            className="bg-card rounded-lg border border-border p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${colorClasses[metric.color]}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="flex items-center gap-1 text-sm">
                <TrendIcon className={`h-4 w-4 ${trendColor}`} />
                <span className={`font-medium ${trendColor}`}>
                  {metric.change}
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">{metric.title}</p>
            <p className="text-2xl font-bold mb-2">{metric.value}</p>
            
            {metric.target && metric.progress !== undefined && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Meta: {metric.target}</span>
                  <span>{metric.progress}%</span>
                </div>
                <Progress value={metric.progress} className="h-2" />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
