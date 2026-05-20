'use client'

import { Activity } from 'lucide-react'
import { LineChart } from '@/components/tremor/LineChart'

interface MonthlyData {
  month: string
  users: number
  revenue: number
  growth: number
}

export function AdminGrowthChart({ monthly }: { monthly: MonthlyData[] }) {
  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Activity className="w-5 h-5 text-blue-500" />
        <h3 className="font-bold text-foreground">Crescimento de Assinantes</h3>
      </div>

      {monthly.length === 0 ? (
        <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
          Nenhum dado disponível
        </div>
      ) : (
        <LineChart
          className="h-[300px]"
          data={monthly}
          index="month"
          categories={['users']}
          colors={['blue']}
          valueFormatter={(v) => `${v} org${v !== 1 ? 's' : ''}`}
          showLegend={false}
          allowDecimals={false}
        />
      )}
    </div>
  )
}
