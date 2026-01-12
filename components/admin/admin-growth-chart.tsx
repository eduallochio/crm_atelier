'use client'

import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Activity } from 'lucide-react'

interface GrowthData {
  month: string
  total: number
  active: number
}

export function AdminGrowthChart({ 
  totalOrganizations, 
  activeOrganizations 
}: { 
  totalOrganizations: number
  activeOrganizations: number
}) {
  const data = useMemo(() => {
    // Simular dados dos últimos 6 meses
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun']
    return months.map((month, index) => ({
      month,
      total: Math.floor(totalOrganizations * (0.5 + index * 0.1)),
      active: Math.floor(activeOrganizations * (0.6 + index * 0.08)),
    }))
  }, [totalOrganizations, activeOrganizations])

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-6">
        <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h3 className="font-bold text-gray-900 dark:text-white">Crescimento de Assinantes</h3>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-800" />
          <XAxis 
            dataKey="month" 
            stroke="#6b7280"
            className="dark:text-gray-400"
          />
          <YAxis 
            stroke="#6b7280"
            className="dark:text-gray-400"
          />
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
            dataKey="total"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 4 }}
            activeDot={{ r: 6 }}
            name="Total"
          />
          <Line
            type="monotone"
            dataKey="active"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 4 }}
            activeDot={{ r: 6 }}
            name="Ativas"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center space-x-6 mt-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-gray-600 dark:text-gray-400">Total</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-gray-600 dark:text-gray-400">Ativas</span>
        </div>
      </div>
    </div>
  )
}
