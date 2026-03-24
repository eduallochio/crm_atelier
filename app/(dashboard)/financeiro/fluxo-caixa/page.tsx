'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Calendar, TrendingUp, TrendingDown, ArrowLeft, X, DollarSign, FileSpreadsheet, FileText } from 'lucide-react'
import { Header } from '@/components/layouts/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTransactions } from '@/hooks/use-financial'
import { usePlanUsage } from '@/hooks/use-plan-usage'
import { TransactionDialog } from '@/components/financial/transaction-dialog'
import { TransactionsTable } from '@/components/financial/transactions-table'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

type SortField = 'descricao' | 'valor' | 'data' | 'tipo'
type SortOrder = 'asc' | 'desc'

export default function FluxoCaixaPage() {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortField, setSortField] = useState<SortField>('data')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  
  const { data: transactions, isLoading } = useTransactions()
  const { data: planUsage } = usePlanUsage()
  const isFree = planUsage?.plan === 'free'

  // Atalhos rápidos de datas
  const setQuickDateFilter = (type: 'today' | 'week' | 'month' | 'lastMonth') => {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    
    if (type === 'today') {
      setDateFrom(todayStr)
      setDateTo(todayStr)
    } else if (type === 'week') {
      const weekAgo = new Date(today)
      weekAgo.setDate(today.getDate() - 7)
      setDateFrom(weekAgo.toISOString().split('T')[0])
      setDateTo(todayStr)
    } else if (type === 'month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
      setDateFrom(firstDay.toISOString().split('T')[0])
      setDateTo(todayStr)
    } else if (type === 'lastMonth') {
      const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const lastDay = new Date(today.getFullYear(), today.getMonth(), 0)
      setDateFrom(firstDay.toISOString().split('T')[0])
      setDateTo(lastDay.toISOString().split('T')[0])
    }
  }

  // Limpar filtros
  const clearFilters = () => {
    setSearchTerm('')
    setTypeFilter('all')
    setDateFrom('')
    setDateTo('')
  }

  // Filtrar transações
  const filteredTransactions = useMemo(() => {
    if (!transactions) return []
    
    return transactions.filter(transaction => {
      const matchesSearch = transaction.descricao.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = typeFilter === 'all' || transaction.tipo === typeFilter
      
      let matchesDate = true
      if (dateFrom && dateTo) {
        const transactionDate = new Date(transaction.data_transacao)
        const from = new Date(dateFrom)
        const to = new Date(dateTo)
        matchesDate = transactionDate >= from && transactionDate <= to
      }
      
      return matchesSearch && matchesType && matchesDate
    })
  }, [transactions, searchTerm, typeFilter, dateFrom, dateTo])

  // Ordenação
  const sortedTransactions = useMemo(() => {
    const sorted = [...filteredTransactions]
    
    sorted.sort((a, b) => {
      let comparison = 0
      
      if (sortField === 'descricao') {
        comparison = a.descricao.localeCompare(b.descricao)
      } else if (sortField === 'valor') {
        comparison = a.valor - b.valor
      } else if (sortField === 'data') {
        comparison = new Date(a.data_transacao).getTime() - new Date(b.data_transacao).getTime()
      } else if (sortField === 'tipo') {
        comparison = a.tipo.localeCompare(b.tipo)
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })
    
    return sorted
  }, [filteredTransactions, sortField, sortOrder])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  // Calcular estatísticas filtradas
  const stats = useMemo(() => {
    const totalEntradas = filteredTransactions.filter(t => t.tipo === 'entrada').reduce((sum, t) => sum + t.valor, 0)
    const totalSaidas = filteredTransactions.filter(t => t.tipo === 'saida').reduce((sum, t) => sum + t.valor, 0)
    return {
      totalEntradas,
      totalSaidas,
      saldo: totalEntradas - totalSaidas,
      count: filteredTransactions.length,
      totalCount: transactions?.length || 0,
    }
  }, [filteredTransactions, transactions])

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  // Exportar para Excel (XLSX)
  const exportToExcel = () => {
    const data = sortedTransactions.map(t => ({
      'Data': t.data_transacao,
      'Tipo': t.tipo === 'entrada' ? 'Entrada' : 'Saída',
      'Descrição': t.descricao,
      'Valor': t.valor,
      'Observações': t.observacoes || ''
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    
    // Ajustar largura das colunas
    ws['!cols'] = [
      { wch: 15 }, // Data
      { wch: 12 }, // Tipo
      { wch: 35 }, // Descrição
      { wch: 15 }, // Valor
      { wch: 30 }  // Observações
    ]
    
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Fluxo de Caixa')
    XLSX.writeFile(wb, `fluxo-caixa-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  // Exportar para PDF
  const exportToPDF = () => {
    const doc = new jsPDF()
    
    doc.setFontSize(18)
    doc.text('Fluxo de Caixa', 14, 22)
    
    doc.setFontSize(11)
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30)
    doc.text(`Entradas: ${formatCurrency(stats.totalEntradas)}`, 14, 37)
    doc.text(`Saídas: ${formatCurrency(stats.totalSaidas)}`, 14, 44)
    doc.text(`Saldo: ${formatCurrency(stats.saldo)}`, 14, 51)
    
    const tableData = sortedTransactions.map(t => [
      new Date(t.data_transacao).toLocaleDateString('pt-BR'),
      t.tipo === 'entrada' ? 'Entrada' : 'Saída',
      t.descricao,
      formatCurrency(t.valor)
    ])
    
    autoTable(doc, {
      startY: 58,
      head: [['Data', 'Tipo', 'Descrição', 'Valor']],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    })
    
    doc.save(`fluxo-caixa-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  return (
    <div>
      <Header 
        title="Fluxo de Caixa"
        description="Visualize todas as transações financeiras"
      />

      <div className="p-6 space-y-6">
        {/* Barra de Ações */}
        <div className="flex items-center justify-between bg-card rounded-lg border border-border p-4">
          <Button variant="outline" onClick={() => router.push('/financeiro')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToExcel} disabled={isFree} title={isFree ? 'Disponível no plano Pro' : undefined}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
            <Button variant="outline" onClick={exportToPDF} disabled={isFree} title={isFree ? 'Disponível no plano Pro' : undefined}>
              <FileText className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Transação
            </Button>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={() => setTypeFilter(typeFilter === 'entrada' ? 'all' : 'entrada')}
            className={`bg-card rounded-lg border border-border p-4 text-left transition-all hover:shadow-md ${
              typeFilter === 'entrada' ? 'ring-2 ring-green-500 shadow-md' : ''
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-50 dark:bg-green-950/50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Entradas</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(stats.totalEntradas)}
                </p>
              </div>
            </div>
            {typeFilter === 'entrada' && (
              <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">✓ Filtro ativo</p>
            )}
          </button>

          <button
            onClick={() => setTypeFilter(typeFilter === 'saida' ? 'all' : 'saida')}
            className={`bg-card rounded-lg border border-border p-4 text-left transition-all hover:shadow-md ${
              typeFilter === 'saida' ? 'ring-2 ring-red-500 shadow-md' : ''
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-50 dark:bg-red-950/50 rounded-lg">
                <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saídas</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(stats.totalSaidas)}
                </p>
              </div>
            </div>
            {typeFilter === 'saida' && (
              <p className="text-xs text-red-600 dark:text-red-400 font-medium mt-1">✓ Filtro ativo</p>
            )}
          </button>

          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${stats.saldo >= 0 ? 'bg-blue-50 dark:bg-blue-950/50' : 'bg-orange-50 dark:bg-orange-950/50'}`}>
                <DollarSign className={`h-5 w-5 ${stats.saldo >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saldo</p>
                <p className={`text-xl font-bold ${stats.saldo >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                  {formatCurrency(stats.saldo)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-50 dark:bg-purple-950/50 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Transações</p>
                <p className="text-xl font-bold text-foreground">
                  {stats.count}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  de {stats.totalCount} totais
                </p>
              </div>
            </div>
          </div>
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
              Hoje
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickDateFilter('week')}
              className="bg-card"
            >
              Últimos 7 Dias
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickDateFilter('month')}
              className="bg-card"
            >
              Este Mês
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickDateFilter('lastMonth')}
              className="bg-card"
            >
              Mês Passado
            </Button>
            {(searchTerm || typeFilter !== 'all' || dateFrom || dateTo) && (
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
                variant={typeFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter('all')}
              >
                Todos
              </Button>
              <Button
                variant={typeFilter === 'entrada' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter('entrada')}
              >
                Entradas
              </Button>
              <Button
                variant={typeFilter === 'saida' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter('saida')}
              >
                Saídas
              </Button>
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-card rounded-lg border border-border">
          <TransactionsTable
            transactions={sortedTransactions || []}
            isLoading={isLoading}
            onSort={handleSort}
            sortField={sortField}
            sortOrder={sortOrder}
          />
        </div>
      </div>

      <TransactionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  )
}
