'use client'

import { ArrowRight } from 'lucide-react'

interface ConversionFunnelProps {
  data: {
    trial: number
    free: number
    pro: number
  }
}

export function ConversionFunnel({ data }: ConversionFunnelProps) {
  const total = data.trial + data.free + data.pro

  const calculatePercentage = (value: number) => {
    return ((value / total) * 100).toFixed(1)
  }

  const calculateConversionRate = (from: number, to: number) => {
    if (from === 0) return '0'
    return ((to / from) * 100).toFixed(1)
  }

  const stages = [
    {
      name: 'Trial',
      count: data.trial,
      color: 'bg-yellow-500',
      lightBg: 'bg-yellow-50 dark:bg-yellow-950/20',
      textColor: 'text-yellow-600 dark:text-yellow-400',
    },
    {
      name: 'Free',
      count: data.free,
      color: 'bg-gray-500',
      lightBg: 'bg-gray-50 dark:bg-gray-950/20',
      textColor: 'text-gray-600 dark:text-gray-400',
      conversionFrom: data.trial,
    },
    {
      name: 'Pro',
      count: data.pro,
      color: 'bg-blue-500',
      lightBg: 'bg-blue-50 dark:bg-blue-950/20',
      textColor: 'text-blue-600 dark:text-blue-400',
      conversionFrom: data.free,
    },
  ]

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h3 className="text-lg font-semibold mb-6">Funil de Conversão</h3>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 items-center">
        {stages.map((stage, index) => (
          <div key={stage.name} className="flex items-center gap-4 lg:contents">
            {/* Stage Card */}
            <div className={`${stage.lightBg} rounded-lg p-4 border border-border lg:col-span-1`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">{stage.name}</span>
                <span className={`text-xs font-medium ${stage.textColor}`}>
                  {calculatePercentage(stage.count)}%
                </span>
              </div>
              
              {/* Barra de progresso */}
              <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full ${stage.color} rounded-full transition-all`}
                  style={{ width: `${calculatePercentage(stage.count)}%` }}
                />
              </div>
              
              <p className="text-2xl font-bold">{stage.count}</p>
              <p className="text-xs text-muted-foreground">assinantes</p>
            </div>

            {/* Arrow with conversion rate */}
            {index < stages.length - 1 && (
              <div className="flex flex-col items-center justify-center lg:col-span-2 py-4 lg:py-0">
                <ArrowRight className="h-5 w-5 text-muted-foreground mb-1 hidden lg:block" />
                <div className="lg:hidden h-8 w-0.5 bg-muted" />
                {stage.conversionFrom !== undefined && (
                  <span className="text-xs font-medium text-muted-foreground">
                    {calculateConversionRate(stage.conversionFrom, stage.count)}% conversão
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Resumo */}
      <div className="mt-6 pt-6 border-t border-border">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Trial → Free</p>
            <p className="text-lg font-bold">
              {calculateConversionRate(data.trial, data.free)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Free → Pro</p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {calculateConversionRate(data.free, data.pro)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Trial → Pago</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              {calculateConversionRate(data.trial, data.pro)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
