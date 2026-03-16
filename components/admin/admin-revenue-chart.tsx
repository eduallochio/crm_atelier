'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp } from 'lucide-react'

interface MonthlyData {
  month: string
  users: number
  revenue: number
  growth: number
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(value)

export function AdminRevenueChart({
  monthly,
  mrrTotal,
}: {
  monthly: MonthlyData[]
  mrrTotal: number
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center space-x-2 mb-6">
        <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
        <h3 className="font-bold text-gray-900 dark:text-white">Receita (MRR)</h3>
      </div>

      {monthly.length === 0 ? (
        <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">
          Nenhum dado disponível
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthly} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis
              stroke="#6b7280"
              tickFormatter={(v) => `R$${Math.round(v / 1000)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#f3f4f6',
              }}
              formatter={(value) => formatCurrency(value as number)}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 4 }}
              activeDot={{ r: 6 }}
              name="Receita"
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      <div className="mt-6 p-4 bg-linear-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg border border-green-200 dark:border-green-800">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">MRR Atual</p>
        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
          {formatCurrency(mrrTotal)}
        </p>
      </div>
    </div>
  )
}
