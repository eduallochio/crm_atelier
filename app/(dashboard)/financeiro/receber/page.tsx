'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Calendar, DollarSign, Download, X, ArrowUpDown, ArrowLeft, FileSpreadsheet, FileText } from 'lucide-react'
import { Header } from '@/components/layouts/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useReceivables } from '@/hooks/use-financial'
import { ReceivableDialog } from '@/components/financial/receivable-dialog'
import { ReceivablesTable } from '@/components/financial/receivables-table'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

type SortField = 'descricao' | 'valor' | 'data_vencimento' | 'status'
type SortOrder = 'asc' | 'desc'

export default function ReceberPage() {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortField, setSortField] = useState<SortField>('data_vencimento')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  
  const { data: receivables, isLoading } = useReceivables()

  // Atalhos rápidos de datas
  const setQuickDateFilter = (type: 'today' | 'week' | 'month' | 'overdue') => {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    
    if (type === 'today') {
      setDateFrom(todayStr)
      setDateTo(todayStr)
    } else if (type === 'week') {
      const nextWeek = new Date(today)
      nextWeek.setDate(today.getDate() + 7)
      setDateFrom(todayStr)
      setDateTo(nextWeek.toISOString().split('T')[0])
    } else if (type === 'month') {
      const nextMonth = new Date(today)
      nextMonth.setMonth(today.getMonth() + 1)
      setDateFrom(todayStr)
      setDateTo(nextMonth.toISOString().split('T')[0])
    } else if (type === 'overdue') {
      setDateFrom('')
      setDateTo(todayStr)
      setStatusFilter('atrasado')
    }
  }

  // Limpar filtros
  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setDateFrom('')
    setDateTo('')
  }

  const filteredReceivables = useMemo(() => {
    if (!receivables) return []
    
    return receivables.filter(receivable => {
      const matchesSearch = receivable.descricao.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || receivable.status === statusFilter
      
      let matchesDate = true
      if (dateFrom && dateTo) {
        const vencimento = new Date(receivable.data_vencimento)
        const from = new Date(dateFrom)
        const to = new Date(dateTo)
        matchesDate = vencimento >= from && vencimento <= to
      }
      
      return matchesSearch && matchesStatus && matchesDate
    })
  }, [receivables, searchTerm, statusFilter, dateFrom, dateTo])

  // Ordenação
  const sortedReceivables = useMemo(() => {
    const sorted = [...filteredReceivables]
    
    sorted.sort((a, b) => {
      let comparison = 0
      
      if (sortField === 'descricao') {
        comparison = a.descricao.localeCompare(b.descricao)
      } else if (sortField === 'valor') {
        comparison = a.valor - b.valor
      } else if (sortField === 'data_vencimento') {
        comparison = new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime()
      } else if (sortField === 'status') {
        comparison = a.status.localeCompare(b.status)
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })
    
    return sorted
  }, [filteredReceivables, sortField, sortOrder])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  // Estatísticas filtradas
  const stats = useMemo(() => ({
    total: filteredReceivables.reduce((sum, r) => sum + (r.valor || 0), 0),
    pendente: filteredReceivables.filter(r => r.status === 'pendente').reduce((sum, r) => sum + (r.valor || 0), 0),
    recebido: filteredReceivables.filter(r => r.status === 'recebido').reduce((sum, r) => sum + (r.valor || 0), 0),
    atrasado: filteredReceivables.filter(r => r.status === 'atrasado').reduce((sum, r) => sum + (r.valor || 0), 0),
    count: filteredReceivables.length,
    totalCount: receivables?.length || 0,
  }), [filteredReceivables, receivables])

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  // Exportar para Excel (XLSX)
  const exportToExcel = () => {
    const data = sortedReceivables.map(r => ({
      'Descrição': r.descricao,
      'Valor': r.valor,
      'Vencimento': r.data_vencimento,
      'Status': r.status,
      'Recebimento': r.data_recebimento || '',
      'Observações': r.observacoes || ''
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    
    // Ajustar largura das colunas
    ws['!cols'] = [
      { wch: 30 }, // Descrição
      { wch: 15 }, // Valor
      { wch: 15 }, // Vencimento
      { wch: 12 }, // Status
      { wch: 15 }, // Recebimento
      { wch: 30 }  // Observações
    ]
    
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Contas a Receber')
    XLSX.writeFile(wb, `contas-receber-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  // Exportar para PDF
  const exportToPDF = () => {
    const doc = new jsPDF()
    
    doc.setFontSize(18)
    doc.text('Contas a Receber', 14, 22)
    
    doc.setFontSize(11)
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30)
    doc.text(`Total: ${formatCurrency(stats.total)}`, 14, 37)
    doc.text(`Registros: ${stats.count} de ${stats.totalCount}`, 14, 44)
    
    const tableData = sortedReceivables.map(r => [
      r.descricao,
      formatCurrency(r.valor),
      new Date(r.data_vencimento).toLocaleDateString('pt-BR'),
      r.status,
      r.data_recebimento ? new Date(r.data_recebimento).toLocaleDateString('pt-BR') : '-'
    ])
    
    autoTable(doc, {
      startY: 50,
      head: [['Descrição', 'Valor', 'Vencimento', 'Status', 'Recebimento']],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    })
    
    doc.save(`contas-receber-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  return (
    <div>
      <Header 
        title="Contas a Receber"
        description="Gerenciamento de recebimentos"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/financeiro')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <Button variant="outline" onClick={exportToExcel}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button variant="outline" onClick={exportToPDF}>
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Conta
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(stats.total)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.count} de {stats.totalCount} contas
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setStatusFilter(statusFilter === 'pendente' ? 'all' : 'pendente')}
            className={`bg-white rounded-lg border p-4 text-left transition-all hover:shadow-md ${
              statusFilter === 'pendente' ? 'ring-2 ring-yellow-500 shadow-md' : ''
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-50 rounded-lg">
                <Calendar className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pendente</p>
                <p className="text-xl font-bold text-yellow-600">
                  {formatCurrency(stats.pendente)}
                </p>
              </div>
            </div>
            {statusFilter === 'pendente' && (
              <p className="text-xs text-yellow-600 font-medium mt-1">✓ Filtro ativo</p>
            )}
          </button>

          <button
            onClick={() => setStatusFilter(statusFilter === 'recebido' ? 'all' : 'recebido')}
            className={`bg-white rounded-lg border p-4 text-left transition-all hover:shadow-md ${
              statusFilter === 'recebido' ? 'ring-2 ring-green-500 shadow-md' : ''
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-50 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Recebido</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(stats.recebido)}
                </p>
              </div>
            </div>
            {statusFilter === 'recebido' && (
              <p className="text-xs text-green-600 font-medium mt-1">✓ Filtro ativo</p>
            )}
          </button>

          <button
            onClick={() => setStatusFilter(statusFilter === 'atrasado' ? 'all' : 'atrasado')}
            className={`bg-white rounded-lg border p-4 text-left transition-all hover:shadow-md ${
              statusFilter === 'atrasado' ? 'ring-2 ring-red-500 shadow-md' : ''
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-50 rounded-lg">
                <Calendar className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Atrasado</p>
                <p className="text-xl font-bold text-red-600">
                  {formatCurrency(stats.atrasado)}
                </p>
              </div>
            </div>
            {statusFilter === 'atrasado' && (
              <p className="text-xs text-red-600 font-medium mt-1">✓ Filtro ativo</p>
            )}
          </button>
        </div>

        {/* Atalhos Rápidos */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Filtros Rápidos:</p>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickDateFilter('today')}
              className="bg-white"
            >
              Vence Hoje
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickDateFilter('week')}
              className="bg-white"
            >
              Próximos 7 Dias
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickDateFilter('month')}
              className="bg-white"
            >
              Próximos 30 Dias
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickDateFilter('overdue')}
              className="bg-white"
            >
              Em Atraso
            </Button>
            {(searchTerm || statusFilter !== 'all' || dateFrom || dateTo) && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="bg-white text-red-600 border-red-200 hover:bg-red-50"
              >
                <X className="h-4 w-4 mr-1" />
                Limpar Filtros
              </Button>
            )}
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  placeholder="Data inicial"
                  className="w-40"
                />
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  placeholder="Data final"
                  className="w-40"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                Todos
              </Button>
              <Button
                variant={statusFilter === 'pendente' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('pendente')}
              >
                Pendente
              </Button>
              <Button
                variant={statusFilter === 'recebido' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('recebido')}
              >
                Recebido
              </Button>
              <Button
                variant={statusFilter === 'atrasado' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('atrasado')}
              >
                Atrasado
              </Button>
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-lg border">
          <ReceivablesTable
            receivables={filteredReceivables || []}
            isLoading={isLoading}
          />
        </div>
      </div>

      <ReceivableDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  )
}
