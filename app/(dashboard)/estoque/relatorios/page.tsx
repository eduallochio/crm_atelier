'use client'

import { useState, useMemo } from 'react'
import {
  Download, AlertTriangle, Package, PackageOpen,
  TrendingUp, BarChart3, Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { usePlanUsage } from '@/hooks/use-plan-usage'
import { useProducts, useStockEntries } from '@/hooks/use-inventory'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

// ─── Upgrade prompt ────────────────────────────────────────────────────────────
function UpgradePrompt() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="flex flex-col items-center gap-4 max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center">
          <Lock className="h-8 w-8 text-indigo-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Recurso do Plano Pago</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Os relatórios de estoque estão disponíveis a partir do plano Pro.
          </p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">Fazer Upgrade para Pro</Button>
      </div>
    </div>
  )
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number) => `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
const fmtQty = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 3 })
const today = () => new Date().toLocaleDateString('pt-BR')
const filename = (base: string, ext: string) =>
  `${base}-${new Date().toISOString().split('T')[0]}.${ext}`

// ─── Cabeçalho PDF padrão ─────────────────────────────────────────────────────
function pdfHeader(doc: jsPDF, title: string, subtitle?: string) {
  const w = doc.internal.pageSize.width
  doc.setFillColor(30, 30, 46)
  doc.rect(0, 0, w, 28, 'F')
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('Meu Atelier', 14, 12)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(title, 14, 21)
  if (subtitle) {
    doc.setFontSize(8)
    doc.text(subtitle, w - 14, 21, { align: 'right' })
  }
  doc.setTextColor(0, 0, 0)
  return 36
}

// ─── Tipos de relatório ────────────────────────────────────────────────────────
type ReportType = 'posicao' | 'baixo' | 'entradas' | 'valoracao'

interface ReportCard {
  id: ReportType
  icon: React.ElementType
  title: string
  description: string
  bar: string
}

const REPORTS: ReportCard[] = [
  {
    id: 'posicao',
    icon: Package,
    title: 'Posição de Estoque',
    description: 'Todos os produtos com quantidade atual, mínima e valor em estoque.',
    bar: 'bg-indigo-500',
  },
  {
    id: 'baixo',
    icon: AlertTriangle,
    title: 'Estoque Baixo / Crítico',
    description: 'Somente produtos com estoque igual ou abaixo do mínimo.',
    bar: 'bg-red-500',
  },
  {
    id: 'entradas',
    icon: PackageOpen,
    title: 'Histórico de Entradas',
    description: 'Todas as entradas de estoque com tipo, fornecedor, itens e valor.',
    bar: 'bg-blue-500',
  },
  {
    id: 'valoracao',
    icon: TrendingUp,
    title: 'Valoração do Estoque',
    description: 'Valor total do estoque agrupado por categoria.',
    bar: 'bg-emerald-500',
  },
]

// ─── Página principal ─────────────────────────────────────────────────────────
export default function RelatoriosEstoquePage() {
  const { data: planData, isLoading: planLoading } = usePlanUsage()
  const { data: products = [] } = useProducts()
  const { data: entries = [] } = useStockEntries()
  const [selected, setSelected] = useState<ReportType>('posicao')

  const isFree = planData?.plan === 'free'

  // ─── Dados derivados ─────────────────────────────────────────────────────────
  const activeProducts = useMemo(() => products.filter(p => p.ativo), [products])

  const lowStock = useMemo(
    () => activeProducts.filter(p => p.quantidade_minima > 0 && p.quantidade_atual <= p.quantidade_minima),
    [activeProducts],
  )

  const valoracaoPorCategoria = useMemo(() => {
    const map = new Map<string, { count: number; valor: number }>()
    for (const p of activeProducts) {
      const cat = p.categoria || 'Sem categoria'
      const valor = (p.preco_custo ?? 0) * p.quantidade_atual
      const prev = map.get(cat) ?? { count: 0, valor: 0 }
      map.set(cat, { count: prev.count + 1, valor: prev.valor + valor })
    }
    return Array.from(map.entries())
      .map(([categoria, { count, valor }]) => ({ categoria, count, valor }))
      .sort((a, b) => b.valor - a.valor)
  }, [activeProducts])

  const totalEstoque = useMemo(
    () => activeProducts.reduce((s, p) => s + (p.preco_custo ?? 0) * p.quantidade_atual, 0),
    [activeProducts],
  )

  // ─── Preview da tabela atual ─────────────────────────────────────────────────
  const previewData = useMemo(() => {
    if (selected === 'posicao') return activeProducts
    if (selected === 'baixo') return lowStock
    if (selected === 'entradas') return entries
    return valoracaoPorCategoria
  }, [selected, activeProducts, lowStock, entries, valoracaoPorCategoria])

  // ─── Exportar PDF ────────────────────────────────────────────────────────────
  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' })
    const report = REPORTS.find(r => r.id === selected)!
    let y = pdfHeader(doc, report.title, `Gerado em ${today()}`)

    if (selected === 'posicao' || selected === 'baixo') {
      const data = selected === 'posicao' ? activeProducts : lowStock
      autoTable(doc, {
        startY: y,
        head: [['Produto', 'Categoria', 'Estoque Atual', 'Estoque Mínimo', 'Unidade', 'Preço Custo', 'Valor em Estoque', 'Status']],
        body: data.map(p => [
          p.nome,
          p.categoria || '—',
          fmtQty(p.quantidade_atual),
          fmtQty(p.quantidade_minima),
          p.unidade,
          p.preco_custo != null ? fmt(p.preco_custo) : '—',
          p.preco_custo != null ? fmt(p.preco_custo * p.quantidade_atual) : '—',
          p.quantidade_minima > 0 && p.quantidade_atual <= p.quantidade_minima ? 'BAIXO' : 'OK',
        ]),
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [30, 30, 46] },
        didParseCell(data) {
          if (data.column.index === 7 && data.cell.raw === 'BAIXO') {
            data.cell.styles.textColor = [220, 38, 38]
            data.cell.styles.fontStyle = 'bold'
          }
        },
        foot: [['', 'TOTAL', '', '', '', '', fmt(totalEstoque), '']],
        footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
      })
    }

    if (selected === 'entradas') {
      autoTable(doc, {
        startY: y,
        head: [['Data', 'Tipo', 'Nº Nota', 'Fornecedor / Emitente', 'Itens', 'Valor Total']],
        body: entries.map(e => [
          new Date(e.created_at).toLocaleDateString('pt-BR'),
          e.tipo === 'manual' ? 'Manual' : e.tipo,
          e.numero_nota ? `${e.numero_nota}${e.serie_nota ? '/' + e.serie_nota : ''}` : '—',
          e.fornecedor_nome || e.emitente_nome || '—',
          e.itens?.length ?? 0,
          e.valor_total != null ? fmt(e.valor_total) : '—',
        ]),
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [30, 30, 46] },
        foot: [['', '', '', 'TOTAL', entries.length, fmt(entries.reduce((s, e) => s + (e.valor_total ?? 0), 0))]],
        footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
      })
    }

    if (selected === 'valoracao') {
      autoTable(doc, {
        startY: y,
        head: [['Categoria', 'Qtd. Produtos', 'Valor em Estoque', '% do Total']],
        body: valoracaoPorCategoria.map(v => [
          v.categoria,
          v.count,
          fmt(v.valor),
          totalEstoque > 0 ? `${((v.valor / totalEstoque) * 100).toFixed(1)}%` : '0%',
        ]),
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [30, 30, 46] },
        foot: [['TOTAL', activeProducts.length, fmt(totalEstoque), '100%']],
        footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
      })
    }

    doc.save(filename(`relatorio-estoque-${selected}`, 'pdf'))
  }

  // ─── Exportar Excel ──────────────────────────────────────────────────────────
  const exportExcel = () => {
    const wb = XLSX.utils.book_new()

    if (selected === 'posicao' || selected === 'baixo') {
      const data = selected === 'posicao' ? activeProducts : lowStock
      const rows = data.map(p => ({
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
      XLSX.utils.book_append_sheet(wb, ws, selected === 'posicao' ? 'Posição de Estoque' : 'Estoque Baixo')
    }

    if (selected === 'entradas') {
      const rows = entries.map(e => ({
        Data: new Date(e.created_at).toLocaleDateString('pt-BR'),
        Tipo: e.tipo === 'manual' ? 'Manual' : e.tipo,
        'Nº Nota': e.numero_nota || '',
        Série: e.serie_nota || '',
        'Fornecedor/Emitente': e.fornecedor_nome || e.emitente_nome || '',
        'CNPJ Emitente': e.emitente_cnpj || '',
        'Qtd. Itens': e.itens?.length ?? 0,
        'Valor Total (R$)': e.valor_total ?? '',
        'Chave de Acesso': e.chave_acesso || '',
      }))
      const ws = XLSX.utils.json_to_sheet(rows)
      ws['!cols'] = [{ wch: 12 }, { wch: 8 }, { wch: 10 }, { wch: 6 }, { wch: 30 }, { wch: 20 }, { wch: 10 }, { wch: 14 }, { wch: 46 }]
      XLSX.utils.book_append_sheet(wb, ws, 'Entradas')
    }

    if (selected === 'valoracao') {
      const rows = valoracaoPorCategoria.map(v => ({
        Categoria: v.categoria,
        'Qtd. Produtos': v.count,
        'Valor em Estoque (R$)': parseFloat(v.valor.toFixed(2)),
        '% do Total': totalEstoque > 0 ? parseFloat(((v.valor / totalEstoque) * 100).toFixed(1)) : 0,
      }))
      const ws = XLSX.utils.json_to_sheet(rows)
      ws['!cols'] = [{ wch: 25 }, { wch: 14 }, { wch: 20 }, { wch: 12 }]
      XLSX.utils.book_append_sheet(wb, ws, 'Valoração')
    }

    XLSX.writeFile(wb, filename(`relatorio-estoque-${selected}`, 'xlsx'))
  }

  if (planLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (isFree) return <UpgradePrompt />

  const activeReport = REPORTS.find(r => r.id === selected)!

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-indigo-500" />
            Relatórios de Estoque
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie e exporte relatórios do seu controle de estoque
          </p>
        </div>
        {/* Export segmented group */}
        <div className="flex items-center gap-3">
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
        </div>
      </div>

      {/* Seleção de tipo de relatório */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {REPORTS.map(report => (
          <button
            key={report.id}
            onClick={() => setSelected(report.id)}
            className={`relative text-left bg-card rounded-2xl overflow-hidden border shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
              selected === report.id
                ? 'border-primary ring-2 ring-primary/20'
                : 'border-border/60'
            }`}
          >
            <div className={`absolute top-0 left-0 right-0 h-[3px] ${report.bar}`} />
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground pr-2">{report.title}</p>
                <div className={`p-2 rounded-xl shadow-sm shrink-0 ${report.bar}`}>
                  <report.icon className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
              <div className="h-px bg-border/50 mb-2" />
              <p className="text-xs text-muted-foreground leading-relaxed">{report.description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Sumário do relatório selecionado */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${activeReport.bar}`}>
              <activeReport.icon className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">{activeReport.title}</h2>
              <p className="text-xs text-muted-foreground">{activeReport.description}</p>
            </div>
          </div>
          <Badge variant="secondary">{previewData.length} {previewData.length === 1 ? 'registro' : 'registros'}</Badge>
        </div>

        {/* Preview da tabela */}
        <div className="overflow-x-auto rounded-lg border border-border">
          {selected === 'posicao' || selected === 'baixo' ? (
            <ProductTable products={(previewData as typeof activeProducts).slice(0, 20)} total={totalEstoque} />
          ) : selected === 'entradas' ? (
            <EntriesTable entries={(previewData as typeof entries).slice(0, 20)} />
          ) : (
            <ValuationTable rows={previewData as typeof valoracaoPorCategoria} total={totalEstoque} />
          )}
          {previewData.length > 20 && (
            <div className="px-4 py-2 text-xs text-muted-foreground bg-muted/20 text-center">
              Mostrando 20 de {previewData.length} registros. Exporte para ver todos.
            </div>
          )}
        </div>

        {/* Totalizadores rápidos */}
        <div className="mt-4 flex flex-wrap gap-3 pt-3 border-t border-border">
          {(selected === 'posicao' || selected === 'baixo') && (
            <>
              <Chip label="Total de produtos" value={String((previewData as typeof activeProducts).length)} />
              <Chip label="Em estoque baixo" value={String(lowStock.length)} warn={lowStock.length > 0} />
              <Chip label="Valor total em estoque" value={fmt(totalEstoque)} />
            </>
          )}
          {selected === 'entradas' && (
            <>
              <Chip label="Total de entradas" value={String(entries.length)} />
              <Chip
                label="NF-e / NF-Ce"
                value={String(entries.filter(e => e.tipo !== 'manual').length)}
              />
              <Chip label="Valor total importado" value={fmt(entries.reduce((s, e) => s + (e.valor_total ?? 0), 0))} />
            </>
          )}
          {selected === 'valoracao' && (
            <>
              <Chip label="Categorias" value={String(valoracaoPorCategoria.length)} />
              <Chip label="Produtos ativos" value={String(activeProducts.length)} />
              <Chip label="Valor total" value={fmt(totalEstoque)} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Sub-componentes de tabelas ───────────────────────────────────────────────

function Chip({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="bg-muted/40 rounded-lg px-3 py-2 text-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`font-semibold ${warn ? 'text-red-500' : 'text-foreground'}`}>{value}</p>
    </div>
  )
}

function ProductTable({ products, total }: { products: any[]; total: number }) {
  if (!products.length) return (
    <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
      <Package className="h-8 w-8 mr-2 opacity-40" /> Nenhum produto encontrado
    </div>
  )
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-muted/30 text-xs text-muted-foreground uppercase tracking-wide">
          <th className="text-left px-4 py-3">Produto</th>
          <th className="text-left px-4 py-3 hidden sm:table-cell">Categoria</th>
          <th className="text-right px-4 py-3">Estoque Atual</th>
          <th className="text-right px-4 py-3 hidden md:table-cell">Mínimo</th>
          <th className="text-left px-4 py-3 hidden md:table-cell">Unid.</th>
          <th className="text-right px-4 py-3 hidden lg:table-cell">Preço Custo</th>
          <th className="text-right px-4 py-3">Valor Estoque</th>
          <th className="text-center px-4 py-3">Status</th>
        </tr>
      </thead>
      <tbody>
        {products.map((p, i) => {
          const isLow = p.quantidade_minima > 0 && p.quantidade_atual <= p.quantidade_minima
          const valor = (p.preco_custo ?? 0) * p.quantidade_atual
          return (
            <tr key={p.id} className={`border-t border-border ${i % 2 ? 'bg-muted/10' : ''}`}>
              <td className="px-4 py-2.5 font-medium text-foreground">{p.nome}</td>
              <td className="px-4 py-2.5 text-muted-foreground hidden sm:table-cell">{p.categoria || '—'}</td>
              <td className={`px-4 py-2.5 text-right font-semibold ${isLow ? 'text-red-500' : 'text-foreground'}`}>
                {isLow && <AlertTriangle className="h-3 w-3 inline mr-1" />}
                {Number(p.quantidade_atual).toLocaleString('pt-BR', { maximumFractionDigits: 3 })}
              </td>
              <td className="px-4 py-2.5 text-right text-muted-foreground hidden md:table-cell">
                {Number(p.quantidade_minima).toLocaleString('pt-BR', { maximumFractionDigits: 3 })}
              </td>
              <td className="px-4 py-2.5 text-muted-foreground hidden md:table-cell">{p.unidade}</td>
              <td className="px-4 py-2.5 text-right text-muted-foreground hidden lg:table-cell">
                {p.preco_custo != null ? `R$ ${Number(p.preco_custo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}
              </td>
              <td className="px-4 py-2.5 text-right font-medium text-foreground">
                {p.preco_custo != null ? `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}
              </td>
              <td className="px-4 py-2.5 text-center">
                {isLow ? (
                  <Badge variant="destructive" className="text-xs">Baixo</Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs text-green-600 dark:text-green-400">OK</Badge>
                )}
              </td>
            </tr>
          )
        })}
      </tbody>
      <tfoot>
        <tr className="border-t-2 border-border bg-muted/30 font-semibold text-sm">
          <td colSpan={6} className="px-4 py-2.5 text-foreground">Total</td>
          <td className="px-4 py-2.5 text-right text-foreground">
            R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </td>
          <td />
        </tr>
      </tfoot>
    </table>
  )
}

function EntriesTable({ entries }: { entries: any[] }) {
  const tipoBadge: Record<string, string> = {
    manual: 'bg-muted text-muted-foreground',
    NFe: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    NFCe: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  }
  if (!entries.length) return (
    <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
      <PackageOpen className="h-8 w-8 mr-2 opacity-40" /> Nenhuma entrada registrada
    </div>
  )
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-muted/30 text-xs text-muted-foreground uppercase tracking-wide">
          <th className="text-left px-4 py-3">Data</th>
          <th className="text-left px-4 py-3">Tipo</th>
          <th className="text-left px-4 py-3 hidden sm:table-cell">Nº Nota</th>
          <th className="text-left px-4 py-3">Fornecedor / Emitente</th>
          <th className="text-center px-4 py-3 hidden md:table-cell">Itens</th>
          <th className="text-right px-4 py-3">Valor Total</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((e, i) => (
          <tr key={e.id} className={`border-t border-border ${i % 2 ? 'bg-muted/10' : ''}`}>
            <td className="px-4 py-2.5 text-muted-foreground">
              {new Date(e.created_at).toLocaleDateString('pt-BR')}
            </td>
            <td className="px-4 py-2.5">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tipoBadge[e.tipo] || tipoBadge.manual}`}>
                {e.tipo === 'manual' ? 'Manual' : e.tipo}
              </span>
            </td>
            <td className="px-4 py-2.5 text-muted-foreground hidden sm:table-cell">
              {e.numero_nota ? `${e.numero_nota}${e.serie_nota ? '/' + e.serie_nota : ''}` : '—'}
            </td>
            <td className="px-4 py-2.5 text-foreground">
              {e.fornecedor_nome || e.emitente_nome || <span className="text-muted-foreground/50">—</span>}
            </td>
            <td className="px-4 py-2.5 text-center text-muted-foreground hidden md:table-cell">
              {e.itens?.length ?? 0}
            </td>
            <td className="px-4 py-2.5 text-right font-medium text-foreground">
              {e.valor_total != null
                ? `R$ ${Number(e.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                : '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function ValuationTable({ rows, total }: { rows: any[]; total: number }) {
  if (!rows.length) return (
    <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
      <TrendingUp className="h-8 w-8 mr-2 opacity-40" /> Sem dados de valoração
    </div>
  )
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-muted/30 text-xs text-muted-foreground uppercase tracking-wide">
          <th className="text-left px-4 py-3">Categoria</th>
          <th className="text-center px-4 py-3">Qtd. Produtos</th>
          <th className="text-right px-4 py-3">Valor em Estoque</th>
          <th className="text-right px-4 py-3">% do Total</th>
          <th className="px-4 py-3 hidden sm:table-cell w-36"></th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => {
          const pct = total > 0 ? (row.valor / total) * 100 : 0
          return (
            <tr key={row.categoria} className={`border-t border-border ${i % 2 ? 'bg-muted/10' : ''}`}>
              <td className="px-4 py-2.5 font-medium text-foreground">{row.categoria}</td>
              <td className="px-4 py-2.5 text-center text-muted-foreground">{row.count}</td>
              <td className="px-4 py-2.5 text-right font-semibold text-foreground">
                R$ {row.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-2.5 text-right text-muted-foreground">{pct.toFixed(1)}%</td>
              <td className="px-4 py-2.5 hidden sm:table-cell">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-indigo-500 rounded-full"
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </td>
            </tr>
          )
        })}
      </tbody>
      <tfoot>
        <tr className="border-t-2 border-border bg-muted/30 font-semibold">
          <td className="px-4 py-2.5 text-foreground">Total</td>
          <td className="px-4 py-2.5 text-center text-foreground">
            {rows.reduce((s, r) => s + r.count, 0)}
          </td>
          <td className="px-4 py-2.5 text-right text-foreground">
            R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </td>
          <td className="px-4 py-2.5 text-right text-foreground">100%</td>
          <td className="hidden sm:table-cell" />
        </tr>
      </tfoot>
    </table>
  )
}
