'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from 'lucide-react'

export type PeriodFilter = '7d' | '30d' | '90d' | 'all'

interface PeriodFilterProps {
  value: PeriodFilter
  onChange: (value: PeriodFilter) => void
}

export function PeriodFilterSelect({ value, onChange }: PeriodFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-35">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7d">Últimos 7 dias</SelectItem>
          <SelectItem value="30d">Últimos 30 dias</SelectItem>
          <SelectItem value="90d">Últimos 90 dias</SelectItem>
          <SelectItem value="all">Todo período</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

export function filterDataByPeriod<T extends { created_at?: string; data_abertura?: string; data_conclusao?: string }>(
  data: T[],
  period: PeriodFilter
): T[] {
  if (period === 'all') return data

  const now = new Date()
  const daysMap = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
  }

  const daysAgo = daysMap[period]
  const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)

  return data.filter(item => {
    const dateStr = item.data_conclusao || item.data_abertura || item.created_at
    if (!dateStr) return false
    
    const itemDate = new Date(dateStr)
    return itemDate >= cutoffDate
  })
}
