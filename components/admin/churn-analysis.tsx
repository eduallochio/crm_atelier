'use client'

import { Card } from '@/components/ui/card'
import { TrendingDown, TrendingUp } from 'lucide-react'

interface ChurnReason {
  reason: string
  count: number
  percentage: number
}

interface ChurnAnalysisProps {
  data: {
    rate: number
    trend: 'up' | 'down'
    reasons: ChurnReason[]
  }
}

export function ChurnAnalysis({ data }: ChurnAnalysisProps) {
  const TrendIcon = data.trend === 'down' ? TrendingDown : TrendingUp
  const trendColor = data.trend === 'down' ? 'text-green-500' : 'text-red-500'
  const hasReasons = data.reasons.some(r => r.count > 0)

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Análise de Churn</h3>
          <p className="text-sm text-muted-foreground">Motivos de cancelamento</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2">
            <TrendIcon className={`h-5 w-5 ${trendColor}`} />
            <span className="text-3xl font-bold">{data.rate}%</span>
          </div>
          <p className="text-xs text-muted-foreground">Taxa de Churn</p>
        </div>
      </div>

      {hasReasons ? (
        <div className="space-y-4">
          {data.reasons.map((reason, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{reason.reason}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {reason.count} cancelamentos
                  </span>
                  <span className="text-sm font-semibold min-w-[3rem] text-right">
                    {reason.percentage}%
                  </span>
                </div>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full transition-all"
                  style={{ width: `${reason.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center border-2 border-dashed border-muted rounded-lg">
          <p className="text-sm text-muted-foreground">Nenhum dado de churn disponível</p>
        </div>
      )}
    </Card>
  )
}
