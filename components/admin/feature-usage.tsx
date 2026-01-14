'use client'

import { Card } from '@/components/ui/card'

interface Feature {
  feature: string
  free: number
  pro: number
  enterprise: number
}

interface FeatureUsageProps {
  features: Feature[]
}

export function FeatureUsage({ features }: FeatureUsageProps) {
  const hasData = features.some(f => f.free > 0 || f.pro > 0 || f.enterprise > 0)

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Uso de Features por Plano</h3>
        <p className="text-sm text-muted-foreground">Percentual de uso por funcionalidade</p>
      </div>

      {hasData ? (
        <div className="space-y-6">
          {features.map((feature, index) => {
            const total = feature.free + feature.pro + feature.enterprise
            const freePercent = total > 0 ? (feature.free / total) * 100 : 0
            const proPercent = total > 0 ? (feature.pro / total) * 100 : 0
            const enterprisePercent = total > 0 ? (feature.enterprise / total) * 100 : 0

            return (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{feature.feature}</span>
                  <span className="text-xs text-muted-foreground">{total} usos</span>
                </div>

                {/* Barra Empilhada */}
                <div className="h-8 bg-muted rounded-lg overflow-hidden flex">
                  {freePercent > 0 && (
                    <div
                      className="bg-gray-400 flex items-center justify-center text-xs text-white font-medium"
                      style={{ width: `${freePercent}%` }}
                    >
                      {freePercent >= 10 && `${freePercent.toFixed(0)}%`}
                    </div>
                  )}
                  {proPercent > 0 && (
                    <div
                      className="bg-blue-500 flex items-center justify-center text-xs text-white font-medium"
                      style={{ width: `${proPercent}%` }}
                    >
                      {proPercent >= 10 && `${proPercent.toFixed(0)}%`}
                    </div>
                  )}
                  {enterprisePercent > 0 && (
                    <div
                      className="bg-purple-500 flex items-center justify-center text-xs text-white font-medium"
                      style={{ width: `${enterprisePercent}%` }}
                    >
                      {enterprisePercent >= 10 && `${enterprisePercent.toFixed(0)}%`}
                    </div>
                  )}
                </div>

                {/* Legenda */}
                <div className="flex items-center gap-4 mt-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-gray-400 rounded" />
                    <span className="text-muted-foreground">
                      Free ({feature.free})
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-500 rounded" />
                    <span className="text-muted-foreground">
                      Pro ({feature.pro})
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-purple-500 rounded" />
                    <span className="text-muted-foreground">
                      Enterprise ({feature.enterprise})
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="py-12 text-center border-2 border-dashed border-muted rounded-lg">
          <p className="text-sm text-muted-foreground">Nenhum dado de uso disponível</p>
        </div>
      )}
    </Card>
  )
}
