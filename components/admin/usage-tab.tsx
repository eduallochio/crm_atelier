'use client'

import { useState } from 'react'
import { Activity, TrendingUp, Users, FileText, Calendar } from 'lucide-react'
import { Line, LineChart, Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface UsageTabProps {
  organization: {
    id: string
    name: string
    plan: 'free' | 'pro' | 'enterprise'
    created_at: string
  }
}

export function UsageTab({}: UsageTabProps) {
  // Dados simulados de logins por dia (últimos 14 dias)
  const [loginsData] = useState(() => Array.from({ length: 14 }, (_, i) => ({
    day: `${14 - i}d`,
    logins: Math.floor(Math.random() * 50) + 10,
  })).reverse())

  // Dados simulados de ordens criadas por dia
  const [ordersData] = useState(() => Array.from({ length: 14 }, (_, i) => ({
    day: `${14 - i}d`,
    orders: Math.floor(Math.random() * 20) + 2,
  })).reverse())

  // Dados simulados mensais
  const monthlyData = [
    { month: 'Jan', clients: 12, orders: 45, revenue: 2500 },
    { month: 'Fev', clients: 18, orders: 67, revenue: 3200 },
    { month: 'Mar', clients: 25, orders: 89, revenue: 4100 },
    { month: 'Abr', clients: 32, orders: 112, revenue: 5300 },
    { month: 'Mai', clients: 38, orders: 134, revenue: 6100 },
    { month: 'Jun', clients: 45, orders: 156, revenue: 7200 },
  ]

  // Métricas de comparação
  const avgStats = {
    logins: 25,
    orders: 78,
    clients: 35,
    revenue: 4500,
  }

  const orgStats = {
    logins: loginsData.reduce((sum, d) => sum + d.logins, 0) / loginsData.length,
    orders: 134,
    clients: 45,
    revenue: 7200,
  }

  return (
    <div className="space-y-6">
      {/* Métricas de Uso */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-950 rounded-lg">
              <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Logins/dia (média)</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {orgStats.logins.toFixed(0)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className={`${
              orgStats.logins > avgStats.logins 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {orgStats.logins > avgStats.logins ? '+' : '-'}
              {Math.abs(((orgStats.logins - avgStats.logins) / avgStats.logins) * 100).toFixed(0)}%
            </span>
            <span className="text-gray-600 dark:text-gray-400">vs média</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-950 rounded-lg">
              <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ordens (este mês)</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {orgStats.orders}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className={`${
              orgStats.orders > avgStats.orders 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {orgStats.orders > avgStats.orders ? '+' : '-'}
              {Math.abs(((orgStats.orders - avgStats.orders) / avgStats.orders) * 100).toFixed(0)}%
            </span>
            <span className="text-gray-600 dark:text-gray-400">vs média</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 dark:bg-green-950 rounded-lg">
              <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Clientes Ativos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {orgStats.clients}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className={`${
              orgStats.clients > avgStats.clients 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {orgStats.clients > avgStats.clients ? '+' : '-'}
              {Math.abs(((orgStats.clients - avgStats.clients) / avgStats.clients) * 100).toFixed(0)}%
            </span>
            <span className="text-gray-600 dark:text-gray-400">vs média</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 dark:bg-orange-950 rounded-lg">
              <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Receita Gerada</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                R$ {(orgStats.revenue / 1000).toFixed(1)}k
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className={`${
              orgStats.revenue > avgStats.revenue 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {orgStats.revenue > avgStats.revenue ? '+' : '-'}
              {Math.abs(((orgStats.revenue - avgStats.revenue) / avgStats.revenue) * 100).toFixed(0)}%
            </span>
            <span className="text-gray-600 dark:text-gray-400">vs média</span>
          </div>
        </div>
      </div>

      {/* Gráfico de Logins */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Logins por Dia (Últimos 14 dias)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={loginsData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis 
              dataKey="day" 
              className="text-gray-600 dark:text-gray-400"
            />
            <YAxis className="text-gray-600 dark:text-gray-400" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--tooltip-bg)', 
                border: '1px solid var(--tooltip-border)',
                borderRadius: '6px'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="logins" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico de Ordens */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Ordens Criadas por Dia (Últimos 14 dias)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={ordersData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis 
              dataKey="day" 
              className="text-gray-600 dark:text-gray-400"
            />
            <YAxis className="text-gray-600 dark:text-gray-400" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--tooltip-bg)', 
                border: '1px solid var(--tooltip-border)',
                borderRadius: '6px'
              }}
            />
            <Bar dataKey="orders" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Crescimento Mensal */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Crescimento Mensal
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Mês
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Novos Clientes
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Ordens
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Receita
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {monthlyData.map((month) => (
                <tr key={month.month} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="py-3 px-4 text-sm text-gray-900 dark:text-white font-medium">
                    {month.month}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900 dark:text-white text-right">
                    {month.clients}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900 dark:text-white text-right">
                    {month.orders}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900 dark:text-white text-right font-medium">
                    R$ {month.revenue.toLocaleString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
