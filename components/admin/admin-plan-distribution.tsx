'use client'

import { Package } from 'lucide-react'
import { DonutChart } from '@/components/tremor/DonutChart'

export function AdminPlanDistribution({ freePlanCount, proPlanCount }: { freePlanCount: number; proPlanCount: number }) {
  const data = [
    { name: 'Free', value: freePlanCount },
    { name: 'Pro',  value: proPlanCount  },
  ].filter((item) => item.value > 0)

  const total = freePlanCount + proPlanCount

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Package className="w-5 h-5 text-violet-500" />
        <h3 className="font-bold text-foreground">Distribuição de Planos</h3>
      </div>

      {data.length > 0 ? (
        <>
          <DonutChart
            className="h-[250px]"
            data={data}
            category="name"
            value="value"
            colors={['gray', 'blue']}
            valueFormatter={(v) => `${v} org${v !== 1 ? 's' : ''}`}
            showLabel
            label={`${total}`}
          />

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-xs text-muted-foreground mb-1">Free</p>
              <p className="text-lg font-bold text-foreground">{freePlanCount}</p>
              <p className="text-xs text-muted-foreground">
                {total > 0 ? Math.round((freePlanCount / total) * 100) : 0}%
              </p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-center">
              <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Pro</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{proPlanCount}</p>
              <p className="text-xs text-blue-500">
                {total > 0 ? Math.round((proPlanCount / total) * 100) : 0}%
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
          Nenhum dado disponível
        </div>
      )}
    </div>
  )
}
