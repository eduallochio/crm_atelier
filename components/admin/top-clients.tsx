'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DollarSign, TrendingUp } from 'lucide-react'

interface Client {
  id: string
  name: string
  plan: string
  revenue: number
  growth: number
}

interface TopClientsProps {
  clients: Client[]
}

const planColors = {
  Free: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  Pro: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  Enterprise: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
}

export function TopClients({ clients }: TopClientsProps) {
  const hasData = clients.length > 0

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Top Clientes por Receita</h3>
          <p className="text-sm text-muted-foreground">Maiores contribuintes de receita</p>
        </div>
        <DollarSign className="h-5 w-5 text-green-500" />
      </div>

      {hasData ? (
        <div className="space-y-3">
          {clients.map((client, index) => (
            <div
              key={client.id}
              className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
              {/* Ranking */}
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted font-bold text-sm">
                {index + 1}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium truncate">{client.name}</p>
                  <Badge className={planColors[client.plan as keyof typeof planColors] || ''}>
                    {client.plan}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">
                    R$ {client.revenue.toLocaleString('pt-BR')}
                  </span>
                  {client.growth !== 0 && (
                    <span className={`flex items-center gap-1 ${
                      client.growth > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <TrendingUp className="h-3 w-3" />
                      {client.growth > 0 ? '+' : ''}{client.growth}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center border-2 border-dashed border-muted rounded-lg">
          <p className="text-sm text-muted-foreground">Nenhum cliente encontrado</p>
        </div>
      )}
    </Card>
  )
}
