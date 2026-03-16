'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Package } from 'lucide-react'

interface PlanDistributionData {
  name: string
  value: number
  color: string
  [key: string]: string | number
}

export function AdminPlanDistribution({
  freePlanCount,
  proPlanCount,
}: {
  freePlanCount: number
  proPlanCount: number
}) {
  const data: PlanDistributionData[] = [
    { name: 'Free', value: freePlanCount, color: '#6b7280' },
    { name: 'Pro', value: proPlanCount, color: '#3b82f6' },
  ].filter((item) => item.value > 0)

  const total = freePlanCount + proPlanCount

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-6">
        <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        <h3 className="font-bold text-gray-900 dark:text-white">Distribuição de Planos</h3>
      </div>

      {/* Chart */}
      {data.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f3f4f6',
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Free</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{freePlanCount}</p>
              <p className="text-xs text-gray-500">
                {total > 0 ? ((freePlanCount / total) * 100).toFixed(0) : 0}%
              </p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-center">
              <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Pro</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{proPlanCount}</p>
              <p className="text-xs text-blue-500">
                {total > 0 ? ((proPlanCount / total) * 100).toFixed(0) : 0}%
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="h-64 flex items-center justify-center text-gray-500">
          Nenhum dado disponível
        </div>
      )}
    </div>
  )
}
