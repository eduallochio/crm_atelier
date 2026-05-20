'use client'

import { TrendingUp } from 'lucide-react'
import { LineChart } from '@/components/tremor/LineChart'

interface MonthlyData {
  month: string
  users: number
  revenue: number
  growth: number
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(value)

export function AdminRevenueChart({ monthly, mrrTotal }: { monthly: MonthlyData[]; mrrTotal: number }) {
  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center space-x-2 mb-6">
        <TrendingUp className="w-5 h-5 text-emerald-500" />
        <h3 className="font-bold text-foreground">Receita (MRR)</h3>
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
          categories={['revenue']}
          colors={['emerald']}
          valueFormatter={formatCurrency}
          showLegend={false}
          yAxisWidth={72}
        />
      )}

      <div className="mt-6 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30">
        <p className="text-sm text-muted-foreground mb-1">MRR Atual</p>
        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
          {formatCurrency(mrrTotal)}
        </p>
      </div>
    </div>
  )
}
