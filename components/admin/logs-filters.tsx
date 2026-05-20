'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Filter, Download, Calendar } from 'lucide-react'

export interface LogFilters {
  search: string
  action: string
  resourceType: string
  dateRange: string
}

interface LogsFiltersProps {
  filters: LogFilters
  availableActions: string[]
  onChange: (filters: LogFilters) => void
  onExport: () => void
}

export function LogsFilters({ filters, availableActions, onChange, onExport }: LogsFiltersProps) {
  function set(key: keyof LogFilters, value: string) {
    onChange({ ...filters, [key]: value })
  }

  function handleReset() {
    onChange({ search: '', action: 'all', resourceType: 'all', dateRange: '7days' })
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Filtros</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>Limpar Filtros</Button>
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Tudo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar nos logs..."
              value={filters.search}
              onChange={(e) => set('search', e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Select value={filters.action} onValueChange={(v) => set('action', v)}>
          <SelectTrigger>
            <SelectValue placeholder="Tipo de Ação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Ações</SelectItem>
            {availableActions.map((a) => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.resourceType} onValueChange={(v) => set('resourceType', v)}>
          <SelectTrigger>
            <SelectValue placeholder="Recurso" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Recursos</SelectItem>
            <SelectItem value="organization">Organizações</SelectItem>
            <SelectItem value="user">Usuários</SelectItem>
            <SelectItem value="plan">Planos</SelectItem>
            <SelectItem value="settings">Configurações</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4">
        <Select value={filters.dateRange} onValueChange={(v) => set('dateRange', v)}>
          <SelectTrigger className="max-w-xs">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="7days">Últimos 7 dias</SelectItem>
            <SelectItem value="30days">Últimos 30 dias</SelectItem>
            <SelectItem value="90days">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </Card>
  )
}
