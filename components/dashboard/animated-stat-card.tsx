'use client'

import { useCounterAnimation } from '@/hooks/use-counter-animation'
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

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
  href?: string
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
  href,
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

  const Wrapper = href ? Link : 'div'

  return (
    <Wrapper href={href ?? '#'} className={cn(
      'relative rounded-2xl overflow-hidden block',
      'border border-border/40 shadow-sm',
      'hover:shadow-lg hover:-translate-y-1 transition-all duration-300',
      href ? 'cursor-pointer' : 'cursor-default',
      'bg-card',
    )}>
      {/* Gradient background */}
      <div className={cn('absolute inset-0 opacity-[0.07] dark:opacity-[0.12]', bgColor)} />

      {/* Bottom-right glow */}
      <div className={cn(
        'absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-20 blur-2xl',
        iconBg,
      )} />

      <div className="relative p-5 flex flex-col gap-4">
        {/* Top row: label + icon */}
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
            {name}
          </p>
          <div className={cn(
            'p-2.5 rounded-xl shadow-md shrink-0',
            iconBg,
          )}>
            <Icon className="h-4 w-4 text-white" />
          </div>
        </div>

        {/* Value */}
        <div className={cn(
          'font-bold tracking-tight leading-none',
          isMonetary ? 'text-[1.6rem]' : 'text-[2.2rem]',
          color,
        )}>
          {displayValue}
        </div>

        {/* Trend */}
        <div className={cn(
          'flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg w-fit',
          trend === 0
            ? 'bg-muted/60 text-muted-foreground'
            : trendUp
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
              : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400',
        )}>
          {trend === 0 ? (
            <Minus className="h-3 w-3" />
          ) : trendUp ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          <span className="font-semibold">{Math.abs(trend)}%</span>
          <span className="opacity-70">vs. mês anterior</span>
        </div>
      </div>
    </Wrapper>
  )
}
