'use client'

import { Card } from '@/components/ui/card'

interface RevenueData {
  month: string
  revenue: number
  forecast?: number
}

interface RevenueChartProps {
  data: RevenueData[]
}

export function RevenueChart({ data }: RevenueChartProps) {
  const maxValue = Math.max(...data.map(d => Math.max(d.revenue, d.forecast || 0)))
  const hasData = maxValue > 0

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Receita Mensal</h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 bg-blue-500 rounded-full" />
            <span className="text-muted-foreground">Realizado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 bg-blue-300 dark:bg-blue-700 rounded-full" />
            <span className="text-muted-foreground">Previsão</span>
          </div>
        </div>
      </div>

      {hasData ? (
        <div className="h-64 flex items-end justify-between gap-2">
          {data.map((item, index) => {
            const revenueHeight = maxValue > 0 ? (item.revenue / maxValue) * 100 : 0
            const forecastHeight = maxValue > 0 && item.forecast 
              ? (item.forecast / maxValue) * 100 
              : 0

            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex items-end justify-center gap-1 h-48">
                  {/* Barra de Receita */}
                  <div className="flex-1 relative group">
                    <div
                      className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                      style={{ height: `${revenueHeight}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-popover border border-border text-popover-foreground text-xs px-2 py-1 rounded whitespace-nowrap">
                        R$ {item.revenue.toLocaleString('pt-BR')}
                      </div>
                    </div>
                  </div>

                  {/* Barra de Previsão */}
                  {item.forecast !== undefined && (
                    <div className="flex-1 relative group">
                      <div
                        className="w-full bg-blue-300 dark:bg-blue-700 rounded-t transition-all hover:bg-blue-400 dark:hover:bg-blue-600"
                        style={{ height: `${forecastHeight}%` }}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-popover border border-border text-popover-foreground text-xs px-2 py-1 rounded whitespace-nowrap">
                          R$ {item.forecast.toLocaleString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <span className="text-xs text-muted-foreground">{item.month}</span>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
          <p className="text-sm text-muted-foreground">Nenhum dado de receita disponível</p>
        </div>
      )}
    </Card>
  )
}
