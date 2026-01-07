'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCounterAnimation } from '@/hooks/use-counter-animation'
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AnimatedStatCardProps {
  name: string
  value: number | string
  icon: LucideIcon
  color: string
  bgColor: string
  iconBg: string
  trend?: number
  trendUp?: boolean
  isMonetary?: boolean
}

export function AnimatedStatCard({
  name,
  value,
  icon: Icon,
  color,
  bgColor,
  iconBg,
  trend = 0,
  trendUp = true,
  isMonetary = false,
}: AnimatedStatCardProps) {
  const numericValue = typeof value === 'number' ? value : 0
  const animatedValue = useCounterAnimation({ end: numericValue, duration: 1500 })

  const trendColor = trend === 0 
    ? 'text-gray-500 dark:text-gray-400' 
    : trendUp 
      ? 'text-green-600 dark:text-green-400' 
      : 'text-red-600 dark:text-red-400'

  return (
    <Card className={cn(
      'relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02]',
      'border-border/50'
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {name}
        </CardTitle>
        <div className={cn('p-2.5 rounded-lg shadow-sm', iconBg)}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between">
          <div className={cn('text-3xl font-bold tracking-tight', color)}>
            {isMonetary 
              ? typeof value === 'string' ? value : `R$ ${animatedValue.toLocaleString('pt-BR')}`
              : animatedValue.toLocaleString('pt-BR')
            }
          </div>
        </div>
        
        {(trend !== undefined && trend !== null) && (
          <div className="flex items-center gap-1">
            {trend === 0 ? (
              <Minus className={cn('h-4 w-4', trendColor)} />
            ) : trendUp ? (
              <TrendingUp className={cn('h-4 w-4', trendColor)} />
            ) : (
              <TrendingDown className={cn('h-4 w-4', trendColor)} />
            )}
            <span className={cn('text-sm font-medium', trendColor)}>
              {Math.abs(trend)}%
            </span>
            <span className="text-xs text-muted-foreground ml-1">
              vs. mês anterior
            </span>
          </div>
        )}
      </CardContent>
      
      {/* Gradient overlay */}
      <div className={cn(
        'absolute inset-0 -z-10 opacity-50',
        bgColor
      )} />
    </Card>
  )
}
