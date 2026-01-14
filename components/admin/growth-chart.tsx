'use client'

import { Card } from '@/components/ui/card'
import { TrendingUp, Users, DollarSign } from 'lucide-react'

interface GrowthData {
  month: string
  users: number
  revenue: number
  growth: number
}

interface GrowthChartProps {
  data: GrowthData[]
}

export function GrowthChart({ data }: GrowthChartProps) {
  const maxUsers = Math.max(...data.map(d => d.users))
  const maxRevenue = Math.max(...data.map(d => d.revenue))
  const hasData = maxUsers > 0 || maxRevenue > 0

  // Calcular métricas
  const totalUsers = data.reduce((sum, d) => sum + d.users, 0)
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0)
  const avgGrowth = data.length > 0 
    ? data.reduce((sum, d) => sum + d.growth, 0) / data.length 
    : 0

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Crescimento Mensal</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-blue-500" />
            <span className="text-muted-foreground">Usuários</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-green-500" />
            <span className="text-muted-foreground">Receita</span>
          </div>
        </div>
      </div>

      {/* Métricas Resumidas */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Total de Usuários</p>
          <p className="text-2xl font-bold">{totalUsers}</p>
        </div>
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Receita Total</p>
          <p className="text-2xl font-bold">R$ {totalRevenue.toLocaleString('pt-BR')}</p>
        </div>
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Crescimento Médio</p>
          <div className="flex items-center justify-center gap-1">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <p className="text-2xl font-bold">{avgGrowth.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {hasData ? (
        <div className="h-64 flex items-end justify-between gap-2">
          {data.map((item, index) => {
            const usersHeight = maxUsers > 0 ? (item.users / maxUsers) * 100 : 0
            const revenueHeight = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0

            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex items-end justify-center gap-1 h-48">
                  {/* Barra de Usuários */}
                  <div className="flex-1 relative group">
                    <div
                      className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                      style={{ height: `${usersHeight}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-popover border border-border text-popover-foreground text-xs px-2 py-1 rounded whitespace-nowrap">
                        {item.users} usuários
                      </div>
                    </div>
                  </div>

                  {/* Barra de Receita */}
                  <div className="flex-1 relative group">
                    <div
                      className="w-full bg-green-500 rounded-t transition-all hover:bg-green-600"
                      style={{ height: `${revenueHeight}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-popover border border-border text-popover-foreground text-xs px-2 py-1 rounded whitespace-nowrap">
                        R$ {item.revenue.toLocaleString('pt-BR')}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">{item.month}</p>
                  {item.growth !== 0 && (
                    <p className={`text-xs font-medium ${
                      item.growth > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {item.growth > 0 ? '+' : ''}{item.growth}%
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
          <p className="text-sm text-muted-foreground">Nenhum dado de crescimento disponível</p>
        </div>
      )}
    </Card>
  )
}
