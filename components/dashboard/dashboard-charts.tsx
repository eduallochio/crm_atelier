'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, DollarSign, Package, Activity } from 'lucide-react'

interface Order {
  id: string
  status: string
  data_abertura: string
  data_conclusao?: string
  valor_total: number
  items?: { service_id: string }[]
}

interface Service {
  id: string
  nome: string
}

interface DashboardChartsProps {
  ordersData: Order[]
  servicesData: Service[]
}

interface ServiceSold {
  nome: string
  quantidade: number
}

export function DashboardCharts({ ordersData, servicesData }: DashboardChartsProps) {
  // Dados mensais de faturamento
  const monthlyRevenue = ordersData.reduce((acc: { mes: string; valor: number }[], order: Order) => {
    if (order.status === 'concluido') {
      const month = new Date(order.data_conclusao || order.data_abertura).toLocaleDateString('pt-BR', { month: 'short' })
      const existing = acc.find((item: { mes: string; valor: number }) => item.mes === month)
      
      if (existing) {
        existing.valor += order.valor_total
      } else {
        acc.push({ mes: month, valor: order.valor_total })
      }
    }
    return acc
  }, [])

  // Serviços mais vendidos
  const servicesSold: ServiceSold[] = servicesData
    .map((service: Service) => ({
      nome: service.nome,
      quantidade: ordersData.reduce((count: number, order: Order) => {
        const itemCount = order.items?.filter((item) => item.service_id === service.id).length || 0
        return count + itemCount
      }, 0)
    }))
    .filter((s) => s.quantidade > 0)
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 5)

  // Status das ordens (para gráfico de pizza)
  const ordersByStatus = [
    { name: 'Pendente', value: ordersData.filter(o => o.status === 'pendente').length, color: '#f59e0b' },
    { name: 'Em Andamento', value: ordersData.filter(o => o.status === 'em_andamento').length, color: '#3b82f6' },
    { name: 'Concluído', value: ordersData.filter(o => o.status === 'concluido').length, color: '#10b981' },
    { name: 'Cancelado', value: ordersData.filter(o => o.status === 'cancelado').length, color: '#ef4444' },
  ].filter(s => s.value > 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {/* Faturamento Mensal */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
            Faturamento Mensal
          </CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="mes" 
                  className="text-xs"
                  stroke="currentColor"
                />
                <YAxis 
                  className="text-xs"
                  stroke="currentColor"
                />
                <Tooltip 
                  formatter={(value: number | undefined) => value !== undefined ? `R$ ${value.toFixed(2)}` : 'N/A'}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                    color: 'hsl(var(--foreground))'
                  }}
                />
                <Bar dataKey="valor" fill="#10b981" name="Faturamento" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-12 text-sm">
              Nenhuma ordem concluída ainda
            </p>
          )}
        </CardContent>
      </Card>

      {/* Serviços Mais Vendidos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Serviços Mais Vendidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {servicesSold.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={servicesSold} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" className="text-xs" stroke="currentColor" />
                <YAxis 
                  dataKey="nome" 
                  type="category" 
                  width={120}
                  className="text-xs"
                  stroke="currentColor"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                    color: 'hsl(var(--foreground))'
                  }}
                />
                <Bar dataKey="quantidade" fill="#3b82f6" name="Vendidos" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-12 text-sm">
              Nenhum serviço vendido ainda
            </p>
          )}
        </CardContent>
      </Card>

      {/* Distribuição por Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            Ordens por Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ordersByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ordersByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {ordersByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                    color: 'hsl(var(--foreground))'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-12 text-sm">
              Nenhuma ordem cadastrada ainda
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
