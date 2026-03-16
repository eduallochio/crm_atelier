'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Activity } from 'lucide-react'

interface MonthlyData {
  month: string
  users: number
  revenue: number
  growth: number
}

export function AdminGrowthChart({ monthly }: { monthly: MonthlyData[] }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h3 className="font-bold text-gray-900 dark:text-white">Crescimento de Assinantes</h3>
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
            <YAxis stroke="#6b7280" allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#f3f4f6',
              }}
            />
            <Line
              type="monotone"
              dataKey="users"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
              name="Novas orgs"
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      <div className="flex items-center space-x-6 mt-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-gray-600 dark:text-gray-400">Novas organizações/mês</span>
        </div>
      </div>
    </div>
  )
}
