'use client'

import { useState, useMemo } from 'react'
import { Package, AlertTriangle, DollarSign, Lock, Plus, Search, Pencil, Trash2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePlanUsage } from '@/hooks/use-plan-usage'
import { useProducts, useDeleteProduct, type Product } from '@/hooks/use-inventory'
import { ProductDialog } from '@/components/inventory/product-dialog'
import { StockEntryDialog } from '@/components/inventory/stock-entry-dialog'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

function UpgradePrompt() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="flex flex-col items-center gap-4 max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center">
          <Lock className="h-8 w-8 text-indigo-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Recurso do Plano Pago</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            O controle de estoque está disponível a partir do plano Pro.
            Faça upgrade para gerenciar produtos, registrar entradas com nota fiscal e receber alertas de estoque baixo.
          </p>
        </div>
        <Button className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white">
          Fazer Upgrade para Pro
        </Button>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color, bar }: {
  title: string
  value: string | number
  icon: React.ElementType
  color: string
  bar?: string
}) {
  return (
    <div className="relative bg-card rounded-2xl overflow-hidden border border-border/60 shadow-sm hover:shadow-md transition-all duration-200">
      {bar && <div className={`absolute top-0 left-0 right-0 h-[3px] ${bar}`} />}
      <div className="p-5 pt-6">
        <div className="flex items-start justify-between mb-3">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground leading-tight">{title}</p>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <div className="h-px bg-border/40 mb-3" />
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </div>
    </div>
  )
}

export default function EstoquePage() {
  const { data: planData, isLoading: planLoading } = usePlanUsage()
  const { data: products = [], isLoading: productsLoading } = useProducts()
  const deleteProduct = useDeleteProduct()

  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [entryDialogOpen, setEntryDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'ativos' | 'inativos'>('all')
  const [categoryFilter, setCategoryFilter] = useState('')

  const isFree = planData?.plan === 'free'

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.categoria).filter(Boolean) as string[])
    return Array.from(cats).sort()
  }, [products])

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchSearch = !search ||
        p.nome.toLowerCase().includes(search.toLowerCase()) ||
        (p.categoria || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.codigo_barras || '').toLowerCase().includes(search.toLowerCase())
      const matchStatus =
        statusFilter === 'all' ? true :
        statusFilter === 'ativos' ? p.ativo :
        !p.ativo
      const matchCategory = !categoryFilter || p.categoria === categoryFilter
      return matchSearch && matchStatus && matchCategory
    })
  }, [products, search, statusFilter, categoryFilter])

  const activeProducts = products.filter(p => p.ativo)
  const lowStockProducts = activeProducts.filter(
    p => p.quantidade_minima > 0 && p.quantidade_atual <= p.quantidade_minima
  )
  const totalStockValue = activeProducts.reduce(
    (acc, p) => acc + (p.preco_custo ?? 0) * p.quantidade_atual, 0
  )

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setProductDialogOpen(true)
  }

  const handleDelete = async (product: Product) => {
    if (!confirm(`Desativar o produto "${product.nome}"?`)) return
    await deleteProduct.mutateAsync(product.id)
  }

  const handleNewProduct = () => {
    setEditingProduct(null)
    setProductDialogOpen(true)
  }

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' })
    const w = doc.internal.pageSize.width
    doc.setFillColor(30, 30, 46)
    doc.rect(0, 0, w, 28, 'F')
    doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255)
    doc.text('Meu Atelier', 14, 12)
    doc.setFontSize(10); doc.setFont('helvetica', 'normal')
    doc.text('Posição de Estoque', 14, 21)
    doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, w - 14, 21, { align: 'right' })
    doc.setTextColor(0, 0, 0)
    autoTable(doc, {
      startY: 36,
      head: [['Produto', 'Categoria', 'Estoque Atual', 'Mínimo', 'Unidade', 'Preço Custo', 'Valor Estoque', 'Status']],
      body: filtered.map(p => [
        p.nome,
        p.categoria || '—',
        Number(p.quantidade_atual).toLocaleString('pt-BR', { maximumFractionDigits: 3 }),
        Number(p.quantidade_minima).toLocaleString('pt-BR', { maximumFractionDigits: 3 }),
        p.unidade,
        p.preco_custo != null ? `R$ ${Number(p.preco_custo).toFixed(2)}` : '—',
        p.preco_custo != null ? `R$ ${(p.preco_custo * p.quantidade_atual).toFixed(2)}` : '—',
        p.quantidade_minima > 0 && p.quantidade_atual <= p.quantidade_minima ? 'BAIXO' : 'OK',
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [30, 30, 46] },
      didParseCell(d) {
        if (d.column.index === 7 && d.cell.raw === 'BAIXO') {
          d.cell.styles.textColor = [220, 38, 38]; d.cell.styles.fontStyle = 'bold'
        }
      },
    })
    doc.save(`estoque-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const exportExcel = () => {
    const rows = filtered.map(p => ({
      Produto: p.nome,
      Categoria: p.categoria || '',
      'Estoque Atual': Number(p.quantidade_atual),
      'Estoque Mínimo': Number(p.quantidade_minima),
      Unidade: p.unidade,
      'Preço Custo (R$)': p.preco_custo ?? '',
      'Valor em Estoque (R$)': p.preco_custo != null ? parseFloat((p.preco_custo * p.quantidade_atual).toFixed(2)) : '',
      Status: p.quantidade_minima > 0 && p.quantidade_atual <= p.quantidade_minima ? 'BAIXO' : 'OK',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [{ wch: 35 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 8 }, { wch: 16 }, { wch: 20 }, { wch: 8 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Estoque')
    XLSX.writeFile(wb, `estoque-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  if (planLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (isFree) return <UpgradePrompt />

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Package className="h-6 w-6 text-indigo-500" />
            Estoque
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie seus produtos e controle o estoque</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Export segmented group */}
          <div className="inline-flex items-center rounded-md border border-input bg-background shadow-sm">
            <Button variant="ghost" size="sm" onClick={exportExcel} className="rounded-r-none border-r border-input px-4 h-9 gap-2 hover:bg-muted font-normal">
              <Download className="h-4 w-4" />
              Excel
            </Button>
            <Button variant="ghost" size="sm" onClick={exportPDF} className="rounded-l-none px-4 h-9 gap-2 hover:bg-muted font-normal">
              <Download className="h-4 w-4" />
              PDF
            </Button>
          </div>
          <div className="h-6 w-px bg-border hidden sm:block" />
          <Button variant="outline" size="sm" className="h-9 gap-2" onClick={() => setEntryDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Nova Entrada
          </Button>
          <Button size="sm" className="h-9 gap-2" onClick={handleNewProduct}>
            <Plus className="h-4 w-4" />
            Novo Produto
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total de Produtos"
          value={activeProducts.length}
          icon={Package}
          color="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
          bar="bg-indigo-500"
        />
        <StatCard
          title="Estoque Baixo"
          value={lowStockProducts.length}
          icon={AlertTriangle}
          color={lowStockProducts.length > 0
            ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400"
            : "bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400"}
          bar={lowStockProducts.length > 0 ? "bg-red-500" : "bg-green-500"}
        />
        <StatCard
          title="Valor Total em Estoque"
          value={`R$ ${totalStockValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          color="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
          bar="bg-emerald-500"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, categoria ou código..."
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-auto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="ativos">Ativos</SelectItem>
            <SelectItem value="inativos">Inativos</SelectItem>
          </SelectContent>
        </Select>
        {categories.length > 0 && (
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-auto">
              <SelectValue placeholder="Todas as categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas as categorias</SelectItem>
              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {productsLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <Package className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium">Nenhum produto encontrado</p>
            {!search && (
              <Button variant="outline" size="sm" onClick={handleNewProduct}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Cadastrar primeiro produto
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nome</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Categoria</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Estoque Atual</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Estoque Mín.</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Unidade</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Preço Custo</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product, i) => {
                  const isLowStock = product.quantidade_minima > 0 && product.quantidade_atual <= product.quantidade_minima
                  return (
                    <tr
                      key={product.id}
                      className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/10'}`}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">{product.nome}</p>
                          {product.codigo_barras && (
                            <p className="text-xs text-muted-foreground">{product.codigo_barras}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {product.categoria ? (
                          <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
                            {product.categoria}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/40">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-semibold flex items-center justify-end gap-1 ${isLowStock ? 'text-red-500' : 'text-foreground'}`}>
                          {isLowStock && <AlertTriangle className="h-3.5 w-3.5" />}
                          {Number(product.quantidade_atual).toLocaleString('pt-BR', { maximumFractionDigits: 3 })}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm text-muted-foreground">
                          {Number(product.quantidade_minima).toLocaleString('pt-BR', { maximumFractionDigits: 3 })}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground">{product.unidade}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm text-foreground">
                          {product.preco_custo != null
                            ? `R$ ${Number(product.preco_custo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                            : <span className="text-muted-foreground/40">—</span>
                          }
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={product.ativo ? 'default' : 'secondary'}>
                          {product.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(product)}
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(product)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <ProductDialog
        open={productDialogOpen}
        onOpenChange={open => {
          setProductDialogOpen(open)
          if (!open) setEditingProduct(null)
        }}
        product={editingProduct}
      />
      <StockEntryDialog
        open={entryDialogOpen}
        onOpenChange={setEntryDialogOpen}
      />
    </div>
  )
}
