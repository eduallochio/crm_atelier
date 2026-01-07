'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Calendar, DollarSign, X, ArrowLeft, CreditCard, FileSpreadsheet, FileText } from 'lucide-react'
import { Header } from '@/components/layouts/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { usePayables } from '@/hooks/use-financial'
import { PayableDialog } from '@/components/financial/payable-dialog'
import { PayablesTable } from '@/components/financial/payables-table'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

type SortField = 'descricao' | 'fornecedor' | 'valor' | 'data_vencimento' | 'status'
type SortOrder = 'asc' | 'desc'

export default function PagarPage() {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortField, setSortField] = useState<SortField>('data_vencimento')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  
  const { data: payables, isLoading } = usePayables()

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

  const filteredPayables = useMemo(() => {
    if (!payables) return []
    
    return payables.filter(payable => {
      const matchesSearch = 
        payable.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payable.fornecedor.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || payable.status === statusFilter
      
      let matchesDate = true
      if (dateFrom && dateTo) {
        const vencimento = new Date(payable.data_vencimento)
        const from = new Date(dateFrom)
        const to = new Date(dateTo)
        matchesDate = vencimento >= from && vencimento <= to
      }
      
      return matchesSearch && matchesStatus && matchesDate
    })
  }, [payables, searchTerm, statusFilter, dateFrom, dateTo])

  // Ordenação
  const sortedPayables = useMemo(() => {
    const sorted = [...filteredPayables]
    
    sorted.sort((a, b) => {
      let comparison = 0
      
      if (sortField === 'descricao') {
        comparison = a.descricao.localeCompare(b.descricao)
      } else if (sortField === 'fornecedor') {
        comparison = a.fornecedor.localeCompare(b.fornecedor)
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
  }, [filteredPayables, sortField, sortOrder])

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
    total: filteredPayables.reduce((sum, p) => sum + (p.valor || 0), 0),
    pendente: filteredPayables.filter(p => p.status === 'pendente').reduce((sum, p) => sum + (p.valor || 0), 0),
    pago: filteredPayables.filter(p => p.status === 'pago').reduce((sum, p) => sum + (p.valor || 0), 0),
    atrasado: filteredPayables.filter(p => p.status === 'atrasado').reduce((sum, p) => sum + (p.valor || 0), 0),
    count: filteredPayables.length,
    totalCount: payables?.length || 0,
  }), [filteredPayables, payables])

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  // Exportar para Excel (XLSX)
  const exportToExcel = () => {
    const data = sortedPayables.map(p => ({
      'Fornecedor': p.fornecedor,
      'Descrição': p.descricao,
      'Valor': p.valor,
      'Vencimento': p.data_vencimento,
      'Status': p.status,
      'Pagamento': p.data_pagamento || '',
      'Observações': p.observacoes || ''
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    
    // Ajustar largura das colunas
    ws['!cols'] = [
      { wch: 25 }, // Fornecedor
      { wch: 30 }, // Descrição
      { wch: 15 }, // Valor
      { wch: 15 }, // Vencimento
      { wch: 12 }, // Status
      { wch: 15 }, // Pagamento
      { wch: 30 }  // Observações
    ]
    
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Contas a Pagar')
    XLSX.writeFile(wb, `contas-pagar-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  // Exportar para PDF
  const exportToPDF = () => {
    const doc = new jsPDF()
    
    doc.setFontSize(18)
    doc.text('Contas a Pagar', 14, 22)
    
    doc.setFontSize(11)
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30)
    doc.text(`Total: ${formatCurrency(stats.total)}`, 14, 37)
    doc.text(`Registros: ${stats.count} de ${stats.totalCount}`, 14, 44)
    
    const tableData = sortedPayables.map(p => [
      p.fornecedor,
      p.descricao,
      formatCurrency(p.valor),
      new Date(p.data_vencimento).toLocaleDateString('pt-BR'),
      p.status
    ])
    
    autoTable(doc, {
      startY: 50,
      head: [['Fornecedor', 'Descrição', 'Valor', 'Vencimento', 'Status']],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    })
    
    doc.save(`contas-pagar-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  return (
    <div>
      <Header 
        title="Contas a Pagar"
        description="Gerenciamento de pagamentos"
      />

      <div className="p-6 space-y-6">
        {/* Barra de Ações */}
        <div className="flex items-center justify-between bg-card rounded-lg border border-border p-4">
          <Button variant="outline" onClick={() => router.push('/financeiro')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToExcel}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
            <Button variant="outline" onClick={exportToPDF}>
              <FileText className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Conta a Pagar
            </Button>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 dark:bg-blue-950/50 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-xl font-bold text-foreground">
                  {formatCurrency(stats.total)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.count} de {stats.totalCount} contas
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setStatusFilter(statusFilter === 'pendente' ? 'all' : 'pendente')}
            className={`bg-card rounded-lg border border-border p-4 text-left transition-all hover:shadow-md ${
              statusFilter === 'pendente' ? 'ring-2 ring-yellow-500 shadow-md' : ''
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-50 dark:bg-yellow-950/50 rounded-lg">
                <Calendar className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendente</p>
                <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                  {formatCurrency(stats.pendente)}
                </p>
              </div>
            </div>
            {statusFilter === 'pendente' && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium mt-1">✓ Filtro ativo</p>
            )}
          </button>

          <button
            onClick={() => setStatusFilter(statusFilter === 'pago' ? 'all' : 'pago')}
            className={`bg-card rounded-lg border border-border p-4 text-left transition-all hover:shadow-md ${
              statusFilter === 'pago' ? 'ring-2 ring-green-500 shadow-md' : ''
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-50 dark:bg-green-950/50 rounded-lg">
                <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pago</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(stats.pago)}
                </p>
              </div>
            </div>
            {statusFilter === 'pago' && (
              <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">✓ Filtro ativo</p>
            )}
          </button>

          <button
            onClick={() => setStatusFilter(statusFilter === 'atrasado' ? 'all' : 'atrasado')}
            className={`bg-card rounded-lg border border-border p-4 text-left transition-all hover:shadow-md ${
              statusFilter === 'atrasado' ? 'ring-2 ring-red-500 shadow-md' : ''
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-50 dark:bg-red-950/50 rounded-lg">
                <Calendar className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Atrasado</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(stats.atrasado)}
                </p>
              </div>
            </div>
            {statusFilter === 'atrasado' && (
              <p className="text-xs text-red-600 dark:text-red-400 font-medium mt-1">✓ Filtro ativo</p>
            )}
          </button>
        </div>

        {/* Atalhos Rápidos */}
        <div className="bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-200 dark:border-blue-900 p-4">
          <p className="text-sm font-medium text-foreground mb-3">Filtros Rápidos:</p>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickDateFilter('today')}
              className="bg-card"
            >
              Vence Hoje
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickDateFilter('week')}
              className="bg-card"
            >
              Próximos 7 Dias
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickDateFilter('month')}
              className="bg-card"
            >
              Próximos 30 Dias
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickDateFilter('overdue')}
              className="bg-card"
            >
              Em Atraso
            </Button>
            {(searchTerm || statusFilter !== 'all' || dateFrom || dateTo) && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="bg-card text-red-600 dark:text-red-400 border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/50"
              >
                <X className="h-4 w-4 mr-1" />
                Limpar Filtros
              </Button>
            )}
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por fornecedor ou descrição..."
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
                variant={statusFilter === 'pago' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('pago')}
              >
                Pago
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
        <div className="bg-card rounded-lg border border-border">
          <PayablesTable
            payables={sortedPayables || []}
            isLoading={isLoading}
            onSort={handleSort}
            sortField={sortField}
            sortOrder={sortOrder}
          />
        </div>
      </div>

      <PayableDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  )
}
