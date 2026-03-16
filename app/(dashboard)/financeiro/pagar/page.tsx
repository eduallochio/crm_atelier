'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, X, ArrowLeft, FileSpreadsheet, FileText, Wallet, Clock, CheckCircle2, AlertTriangle } from 'lucide-react'
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
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          {/* Total — estático */}
          <div className="relative bg-card rounded-2xl overflow-hidden border border-border/60 shadow-sm col-span-2 xl:col-span-1">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-slate-500" />
            <div className="p-4 pt-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Total</p>
                <div className="p-2 rounded-xl bg-slate-500 shadow-sm shrink-0">
                  <Wallet className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.total)}</p>
              <div className="h-px bg-border/50 mt-3 mb-2" />
              <p className="text-[11px] text-muted-foreground">{stats.count} de {stats.totalCount} contas</p>
            </div>
          </div>

          {/* Pendente — clicável */}
          <button
            onClick={() => setStatusFilter(statusFilter === 'pendente' ? 'all' : 'pendente')}
            className={`relative bg-card rounded-2xl overflow-hidden border shadow-sm text-left transition-all hover:shadow-md ${
              statusFilter === 'pendente' ? 'border-amber-400 dark:border-amber-600 ring-2 ring-amber-400/30' : 'border-border/60'
            }`}
          >
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-amber-500" />
            <div className="p-4 pt-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Pendente</p>
                <div className="p-2 rounded-xl bg-amber-500 shadow-sm shrink-0">
                  <Clock className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{formatCurrency(stats.pendente)}</p>
              <div className="h-px bg-border/50 mt-3 mb-2" />
              <p className="text-[11px] text-muted-foreground">{statusFilter === 'pendente' ? '✓ Filtro ativo' : 'clique para filtrar'}</p>
            </div>
          </button>

          {/* Pago — clicável */}
          <button
            onClick={() => setStatusFilter(statusFilter === 'pago' ? 'all' : 'pago')}
            className={`relative bg-card rounded-2xl overflow-hidden border shadow-sm text-left transition-all hover:shadow-md ${
              statusFilter === 'pago' ? 'border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-400/30' : 'border-border/60'
            }`}
          >
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-emerald-500" />
            <div className="p-4 pt-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Pago</p>
                <div className="p-2 rounded-xl bg-emerald-500 shadow-sm shrink-0">
                  <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(stats.pago)}</p>
              <div className="h-px bg-border/50 mt-3 mb-2" />
              <p className="text-[11px] text-muted-foreground">{statusFilter === 'pago' ? '✓ Filtro ativo' : 'clique para filtrar'}</p>
            </div>
          </button>

          {/* Atrasado — clicável */}
          <button
            onClick={() => setStatusFilter(statusFilter === 'atrasado' ? 'all' : 'atrasado')}
            className={`relative bg-card rounded-2xl overflow-hidden border shadow-sm text-left transition-all hover:shadow-md ${
              statusFilter === 'atrasado' ? 'border-red-400 dark:border-red-600 ring-2 ring-red-400/30' : 'border-border/60'
            }`}
          >
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-red-500" />
            <div className="p-4 pt-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Atrasado</p>
                <div className="p-2 rounded-xl bg-red-500 shadow-sm shrink-0">
                  <AlertTriangle className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(stats.atrasado)}</p>
              <div className="h-px bg-border/50 mt-3 mb-2" />
              <p className="text-[11px] text-muted-foreground">{statusFilter === 'atrasado' ? '✓ Filtro ativo' : 'clique para filtrar'}</p>
            </div>
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
