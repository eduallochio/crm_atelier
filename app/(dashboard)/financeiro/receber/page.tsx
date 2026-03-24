'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, X, ArrowLeft, FileSpreadsheet, FileText, TrendingUp, Clock, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Header } from '@/components/layouts/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useReceivables } from '@/hooks/use-financial'
import { usePaymentMethods } from '@/hooks/use-payment-methods'
import { usePlanUsage } from '@/hooks/use-plan-usage'
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
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortField, setSortField] = useState<SortField>('data_vencimento')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  
  const { data: receivables, isLoading } = useReceivables()
  const { data: paymentMethods = [] } = usePaymentMethods()
  const { data: planUsage } = usePlanUsage()
  const isFree = planUsage?.plan === 'free'

  // Helper para formatar nome da forma de pagamento baseado nas configurações
  const getPaymentMethodName = (code: string | null | undefined): string => {
    if (!code) return 'Não informado'
    const method = paymentMethods.find(m => m.code === code)
    return method?.name || code
  }

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
    setPaymentMethodFilter('all')
    setDateFrom('')
    setDateTo('')
  }

  const filteredReceivables = useMemo(() => {
    if (!receivables) return []
    
    return receivables.filter(receivable => {
      const matchesSearch = receivable.descricao.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || receivable.status === statusFilter
      const matchesPaymentMethod = paymentMethodFilter === 'all' || 
        (paymentMethodFilter === 'outros' 
          ? (!receivable.forma_pagamento || !['pix','dinheiro','cartao_credito','cartao_debito','transferencia','boleto'].includes(receivable.forma_pagamento))
          : receivable.forma_pagamento === paymentMethodFilter)
      
      let matchesDate = true
      if (dateFrom && dateTo) {
        const vencimento = new Date(receivable.data_vencimento)
        const from = new Date(dateFrom)
        const to = new Date(dateTo)
        matchesDate = vencimento >= from && vencimento <= to
      }
      
      return matchesSearch && matchesStatus && matchesPaymentMethod && matchesDate
    })
  }, [receivables, searchTerm, statusFilter, paymentMethodFilter, dateFrom, dateTo])

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
  const stats = useMemo(() => {
    const recebidos = filteredReceivables.filter(r => r.status === 'recebido')
    
    // Calcular totais por forma de pagamento dinamicamente
    const byPaymentMethod: Record<string, number> = {}
    paymentMethods.forEach(method => {
      byPaymentMethod[method.code] = recebidos
        .filter(r => r.forma_pagamento === method.code)
        .reduce((sum, r) => sum + (r.valor || 0), 0)
    })
    
    // Calcular "outros" (formas não configuradas)
    const knownCodes = paymentMethods.map(m => m.code)
    byPaymentMethod['outros'] = recebidos
      .filter(r => !r.forma_pagamento || !knownCodes.includes(r.forma_pagamento))
      .reduce((sum, r) => sum + (r.valor || 0), 0)
    
    return {
      total: filteredReceivables.reduce((sum, r) => sum + (r.valor || 0), 0),
      pendente: filteredReceivables.filter(r => r.status === 'pendente').reduce((sum, r) => sum + (r.valor || 0), 0),
      recebido: recebidos.reduce((sum, r) => sum + (r.valor || 0), 0),
      atrasado: filteredReceivables.filter(r => r.status === 'atrasado').reduce((sum, r) => sum + (r.valor || 0), 0),
      count: filteredReceivables.length,
      totalCount: receivables?.length || 0,
      byPaymentMethod
    }
  }, [filteredReceivables, receivables, paymentMethods])

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
      'Forma de Pagamento': getPaymentMethodName(r.forma_pagamento),
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
      { wch: 18 }, // Forma de Pagamento
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
    
    // Adicionar resumo por forma de pagamento
    doc.setFontSize(10)
    doc.text('Resumo por Forma de Pagamento:', 14, 54)
    let yPos = 60
    if (stats.byPaymentMethod.pix > 0) {
      doc.text(`PIX: ${formatCurrency(stats.byPaymentMethod.pix)}`, 20, yPos)
      yPos += 6
    }
    if (stats.byPaymentMethod.dinheiro > 0) {
      doc.text(`Dinheiro: ${formatCurrency(stats.byPaymentMethod.dinheiro)}`, 20, yPos)
      yPos += 6
    }
    if (stats.byPaymentMethod.cartao_credito > 0) {
      doc.text(`Cartão Crédito: ${formatCurrency(stats.byPaymentMethod.cartao_credito)}`, 20, yPos)
      yPos += 6
    }
    if (stats.byPaymentMethod.cartao_debito > 0) {
      doc.text(`Cartão Débito: ${formatCurrency(stats.byPaymentMethod.cartao_debito)}`, 20, yPos)
      yPos += 6
    }
    if (stats.byPaymentMethod.transferencia > 0) {
      doc.text(`Transferência: ${formatCurrency(stats.byPaymentMethod.transferencia)}`, 20, yPos)
      yPos += 6
    }
    if (stats.byPaymentMethod.boleto > 0) {
      doc.text(`Boleto: ${formatCurrency(stats.byPaymentMethod.boleto)}`, 20, yPos)
      yPos += 6
    }
    if (stats.byPaymentMethod.outros > 0) {
      doc.text(`Outros: ${formatCurrency(stats.byPaymentMethod.outros)}`, 20, yPos)
      yPos += 6
    }
    
    const tableData = sortedReceivables.map(r => [
      r.descricao,
      formatCurrency(r.valor),
      new Date(r.data_vencimento).toLocaleDateString('pt-BR'),
      r.status,
      getPaymentMethodName(r.forma_pagamento),
      r.data_recebimento ? new Date(r.data_recebimento).toLocaleDateString('pt-BR') : '-'
    ])
    
    autoTable(doc, {
      startY: yPos + 6,
      head: [['Descrição', 'Valor', 'Vencimento', 'Status', 'Forma Pag.', 'Recebimento']],
      body: tableData,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [59, 130, 246] }
    })
    
    doc.save(`contas-receber-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  return (
    <div>
      <Header 
        title="Contas a Receber"
        description="Gerenciamento de recebimentos"
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
              Nova Conta a Receber
            </Button>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          {/* Total — estático */}
          <div className="relative bg-card rounded-2xl overflow-hidden border border-border/60 shadow-sm col-span-2 xl:col-span-1">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-blue-500" />
            <div className="p-4 pt-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Total</p>
                <div className="p-2 rounded-xl bg-blue-500 shadow-sm shrink-0">
                  <TrendingUp className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(stats.total)}</p>
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

          {/* Recebido — clicável */}
          <button
            onClick={() => setStatusFilter(statusFilter === 'recebido' ? 'all' : 'recebido')}
            className={`relative bg-card rounded-2xl overflow-hidden border shadow-sm text-left transition-all hover:shadow-md ${
              statusFilter === 'recebido' ? 'border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-400/30' : 'border-border/60'
            }`}
          >
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-emerald-500" />
            <div className="p-4 pt-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Recebido</p>
                <div className="p-2 rounded-xl bg-emerald-500 shadow-sm shrink-0">
                  <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(stats.recebido)}</p>
              <div className="h-px bg-border/50 mt-3 mb-2" />
              <p className="text-[11px] text-muted-foreground">{statusFilter === 'recebido' ? '✓ Filtro ativo' : 'clique para filtrar'}</p>
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

        {/* Formas de Pagamento - Valores Recebidos */}
        {paymentMethods.length > 0 && (
          <div className="bg-linear-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-lg border border-purple-200 dark:border-purple-900 p-4">
            <p className="text-sm font-medium text-foreground mb-3">Valores Recebidos por Forma de Pagamento:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-auto gap-2" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(120px, 1fr))` }}>
              {paymentMethods.map((method) => {
                const valor = stats.byPaymentMethod[method.code] || 0
                if (valor === 0 && !method.enabled) return null
                
                return (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethodFilter(paymentMethodFilter === method.code ? 'all' : method.code)}
                    className={`bg-card rounded-lg border p-3 text-center transition-all hover:shadow-md ${
                      paymentMethodFilter === method.code ? 'ring-2 shadow-md' : 'border-border'
                    }`}
                    style={{
                      borderColor: paymentMethodFilter === method.code ? method.color : undefined,
                      boxShadow: paymentMethodFilter === method.code ? `0 0 0 2px ${method.color}` : undefined
                    }}
                  >
                    <p className="text-xs text-muted-foreground mb-1 truncate">{method.name}</p>
                    <p 
                      className="text-sm font-bold"
                      style={{ color: method.color || '#6b7280' }}
                    >
                      {formatCurrency(valor)}
                    </p>
                  </button>
                )
              })}
              
              {/* Botão "Outros" sempre no final */}
              {stats.byPaymentMethod.outros > 0 && (
                <button
                  onClick={() => setPaymentMethodFilter(paymentMethodFilter === 'outros' ? 'all' : 'outros')}
                  className={`bg-card rounded-lg border p-3 text-center transition-all hover:shadow-md ${
                    paymentMethodFilter === 'outros' ? 'ring-2 ring-gray-500 shadow-md' : 'border-border'
                  }`}
                >
                  <p className="text-xs text-muted-foreground mb-1">Outros</p>
                  <p className="text-sm font-bold text-gray-600 dark:text-gray-400">
                    {formatCurrency(stats.byPaymentMethod.outros)}
                  </p>
                </button>
              )}
            </div>
            {paymentMethodFilter !== 'all' && (
              <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mt-2">✓ Filtro de forma de pagamento ativo</p>
            )}
          </div>
        )}

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
        <div className="bg-card rounded-lg border border-border">
          <ReceivablesTable
            receivables={sortedReceivables || []}
            isLoading={isLoading}
            onSort={handleSort}
            sortField={sortField}
            sortOrder={sortOrder}
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
