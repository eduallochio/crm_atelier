'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, DollarSign, Package, Activity } from 'lucide-react'

interface DashboardChartsProps {
  ordersData: any[]
  servicesData: any[]
}

export function DashboardCharts({ ordersData, servicesData }: DashboardChartsProps) {
  // Dados mensais de faturamento
  const monthlyRevenue = ordersData.reduce((acc: any, order: any) => {
    if (order.status === 'concluido') {
      const month = new Date(order.data_conclusao || order.data_abertura).toLocaleDateString('pt-BR', { month: 'short' })
      const existing = acc.find((item: any) => item.mes === month)
      
      if (existing) {
        existing.valor += order.valor_total
      } else {
        acc.push({ mes: month, valor: order.valor_total })
      }
    }
    return acc
  }, [])

  // Serviços mais vendidos
  const servicesSold = servicesData
    .map((service: any) => ({
      nome: service.nome,
      quantidade: ordersData.reduce((count: number, order: any) => {
        const itemCount = order.items?.filter((item: any) => item.service_id === service.id).length || 0
        return count + itemCount
      }, 0)
    }))
    .filter((s: any) => s.quantidade > 0)
    .sort((a: any, b: any) => b.quantidade - a.quantidade)
    .slice(0, 5)

  // Status das ordens (para gráfico de pizza)
  const ordersByStatus = [
    { name: 'Pendente', value: ordersData.filter(o => o.status === 'pendente').length, color: '#f59e0b' },
    { name: 'Em Andamento', value: ordersData.filter(o => o.status === 'em_andamento').length, color: '#3b82f6' },
    { name: 'Concluído', value: ordersData.filter(o => o.status === 'concluido').length, color: '#10b981' },
    { name: 'Cancelado', value: ordersData.filter(o => o.status === 'cancelado').length, color: '#ef4444' },
  ].filter(s => s.value > 0)

  // Taxa de conclusão mensal
  const completionRate = ordersData.reduce((acc: any, order: any) => {
    const month = new Date(order.data_abertura).toLocaleDateString('pt-BR', { month: 'short' })
    const existing = acc.find((item: any) => item.mes === month)
    
    if (existing) {
      existing.total += 1
      if (order.status === 'concluido') existing.concluidas += 1
    } else {
      acc.push({
        mes: month,
        total: 1,
        concluidas: order.status === 'concluido' ? 1 : 0,
      })
    }
    return acc
  }, []).map((item: any) => ({
    mes: item.mes,
    taxa: item.total > 0 ? Math.round((item.concluidas / item.total) * 100) : 0
  }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Faturamento Mensal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Faturamento Mensal
          </CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                  labelStyle={{ color: '#000' }}
                />
                <Bar dataKey="valor" fill="#10b981" name="Faturamento" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-12 text-sm">
              Nenhuma ordem concluída ainda
            </p>
          )}
        </CardContent>
      </Card>

      {/* Serviços Mais Vendidos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Serviços Mais Vendidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {servicesSold.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={servicesSold} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="nome" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="quantidade" fill="#3b82f6" name="Vendidos" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-12 text-sm">
              Nenhum serviço vendido ainda
            </p>
          )}
        </CardContent>
      </Card>

      {/* Distribuição por Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-600" />
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
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {ordersByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-12 text-sm">
              Nenhuma ordem cadastrada ainda
            </p>
          )}
        </CardContent>
      </Card>

      {/* Taxa de Conclusão */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-600" />
            Taxa de Conclusão
          </CardTitle>
        </CardHeader>
        <CardContent>
          {completionRate.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={completionRate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip formatter={(value: number) => `${value}%`} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="taxa" 
                  stroke="#f97316" 
                  strokeWidth={2}
                  name="Taxa de Conclusão (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-12 text-sm">
              Dados insuficientes
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
