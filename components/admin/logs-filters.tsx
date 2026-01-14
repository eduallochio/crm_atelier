'use client'

import { useState } from 'react'
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

export function LogsFilters() {
  const [searchTerm, setSearchTerm] = useState('')
  const [actionType, setActionType] = useState('all')
  const [resource, setResource] = useState('all')
  const [admin, setAdmin] = useState('all')
  const [dateRange, setDateRange] = useState('7days')

  const handleReset = () => {
    setSearchTerm('')
    setActionType('all')
    setResource('all')
    setAdmin('all')
    setDateRange('7days')
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Filtros</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            Limpar Filtros
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Busca por texto */}
        <div className="lg:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar nos logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Tipo de Ação */}
        <Select value={actionType} onValueChange={setActionType}>
          <SelectTrigger>
            <SelectValue placeholder="Tipo de Ação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Ações</SelectItem>
            <SelectItem value="create">Criação</SelectItem>
            <SelectItem value="update">Atualização</SelectItem>
            <SelectItem value="delete">Exclusão</SelectItem>
            <SelectItem value="login">Login</SelectItem>
            <SelectItem value="logout">Logout</SelectItem>
            <SelectItem value="export">Exportação</SelectItem>
          </SelectContent>
        </Select>

        {/* Recurso */}
        <Select value={resource} onValueChange={setResource}>
          <SelectTrigger>
            <SelectValue placeholder="Recurso" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Recursos</SelectItem>
            <SelectItem value="organization">Organizações</SelectItem>
            <SelectItem value="user">Usuários</SelectItem>
            <SelectItem value="plan">Planos</SelectItem>
            <SelectItem value="billing">Faturamento</SelectItem>
            <SelectItem value="settings">Configurações</SelectItem>
          </SelectContent>
        </Select>

        {/* Período */}
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger>
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="7days">Últimos 7 dias</SelectItem>
            <SelectItem value="30days">Últimos 30 dias</SelectItem>
            <SelectItem value="90days">Últimos 90 dias</SelectItem>
            <SelectItem value="custom">Período Customizado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Admin Filter (segunda linha) */}
      <div className="mt-4">
        <Select value={admin} onValueChange={setAdmin}>
          <SelectTrigger className="max-w-xs">
            <SelectValue placeholder="Filtrar por Admin" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Admins</SelectItem>
            {/* TODO: Listar admins dinamicamente */}
          </SelectContent>
        </Select>
      </div>
    </Card>
  )
}
