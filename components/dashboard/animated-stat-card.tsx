'use client'

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
    ? 'text-muted-foreground'
    : trendUp
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-red-500 dark:text-red-400'

  const displayValue = isMonetary
    ? typeof value === 'string'
      ? value
      : `R$ ${animatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : animatedValue.toLocaleString('pt-BR')

  return (
    <div className={cn(
      'relative bg-card rounded-2xl overflow-hidden',
      'border border-border/60 shadow-sm',
      'hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-default',
    )}>
      {/* Top accent bar */}
      <div className={cn('absolute top-0 left-0 right-0 h-[3px]', iconBg)} />

      {/* Subtle background tint */}
      <div className={cn('absolute inset-0 opacity-[0.15]', bgColor)} />

      <div className="relative p-5">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground leading-tight">
            {name}
          </p>
          <div className={cn('p-2 rounded-xl shadow-sm shrink-0', iconBg)}>
            <Icon className="h-3.5 w-3.5 text-white" />
          </div>
        </div>

        {/* Value */}
        <div className={cn(
          'font-bold tracking-tight leading-none mb-3',
          isMonetary ? 'text-2xl' : 'text-3xl',
          color,
        )}>
          {displayValue}
        </div>

        {/* Divider */}
        <div className="h-px bg-border/50 mb-3" />

        {/* Trend */}
        <div className="flex items-center gap-1.5 h-4">
          {trend === 0 ? (
            <Minus className={cn('h-3 w-3', trendColor)} />
          ) : trendUp ? (
            <TrendingUp className={cn('h-3 w-3', trendColor)} />
          ) : (
            <TrendingDown className={cn('h-3 w-3', trendColor)} />
          )}
          <span className={cn('text-[11px] font-semibold', trendColor)}>
            {Math.abs(trend)}%
          </span>
          <span className="text-[10px] text-muted-foreground">vs. mês anterior</span>
        </div>
      </div>
    </div>
  )
}
