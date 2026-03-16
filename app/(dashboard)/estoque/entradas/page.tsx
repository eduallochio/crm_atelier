'use client'

import { useState, useMemo } from 'react'
import { PackageOpen, Lock, Plus, CalendarDays, FileText, TrendingUp, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { usePlanUsage } from '@/hooks/use-plan-usage'
import { useStockEntries, type StockEntry } from '@/hooks/use-inventory'
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
            Faça upgrade para registrar entradas com NF-e, NF-Ce e acompanhar seu histórico de compras.
          </p>
        </div>
        <Button className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white">
          Fazer Upgrade para Pro
        </Button>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, bar }: {
  title: string
  value: string | number
  icon: React.ElementType
  bar: string
}) {
  return (
    <div className="relative bg-card rounded-2xl overflow-hidden border border-border/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
      <div className={`absolute top-0 left-0 right-0 h-[3px] ${bar}`} />
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between mb-3">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{title}</p>
          <div className={`p-2 rounded-xl shadow-sm shrink-0 ${bar}`}>
            <Icon className="h-3.5 w-3.5 text-white" />
          </div>
        </div>
        <p className={`font-bold text-foreground mb-3 ${typeof value === 'string' && value.startsWith('R$') ? 'text-2xl' : 'text-3xl'}`}>{value}</p>
        <div className="h-px bg-border/50" />
      </div>
    </div>
  )
}

const tipoBadge: Record<StockEntry['tipo'], { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  manual: { label: 'Manual', variant: 'secondary' },
  NFe: { label: 'NF-e', variant: 'default' },
  NFCe: { label: 'NF-Ce', variant: 'outline' },
}

export default function EntradasPage() {
  const { data: planData, isLoading: planLoading } = usePlanUsage()
  const { data: entries = [], isLoading: entriesLoading } = useStockEntries()
  const [entryDialogOpen, setEntryDialogOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<StockEntry | null>(null)

  const isFree = planData?.plan === 'free'

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' })
    const w = doc.internal.pageSize.width
    doc.setFillColor(30, 30, 46)
    doc.rect(0, 0, w, 28, 'F')
    doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255)
    doc.text('Meu Atelier', 14, 12)
    doc.setFontSize(10); doc.setFont('helvetica', 'normal')
    doc.text('Histórico de Entradas de Estoque', 14, 21)
    doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, w - 14, 21, { align: 'right' })
    doc.setTextColor(0, 0, 0)
    autoTable(doc, {
      startY: 36,
      head: [['Data', 'Tipo', 'Nº Nota / Série', 'Fornecedor / Emitente', 'Qtd. Itens', 'Valor Total']],
      body: entries.map(e => [
        new Date(e.created_at).toLocaleDateString('pt-BR'),
        e.tipo === 'manual' ? 'Manual' : e.tipo,
        e.numero_nota ? `${e.numero_nota}${e.serie_nota ? ' / ' + e.serie_nota : ''}` : '—',
        e.fornecedor_nome || e.emitente_nome || '—',
        e.itens?.length ?? 0,
        e.valor_total != null ? `R$ ${Number(e.valor_total).toFixed(2)}` : '—',
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [30, 30, 46] },
      foot: [['', '', '', 'TOTAL', entries.length, `R$ ${entries.reduce((s, e) => s + (e.valor_total ?? 0), 0).toFixed(2)}`]],
      footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
    })
    doc.save(`entradas-estoque-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const exportExcel = () => {
    const rows = entries.map(e => ({
      Data: new Date(e.created_at).toLocaleDateString('pt-BR'),
      Tipo: e.tipo === 'manual' ? 'Manual' : e.tipo,
      'Nº Nota': e.numero_nota || '',
      Série: e.serie_nota || '',
      'Fornecedor / Emitente': e.fornecedor_nome || e.emitente_nome || '',
      'CNPJ Emitente': e.emitente_cnpj || '',
      'Qtd. Itens': e.itens?.length ?? 0,
      'Valor Total (R$)': e.valor_total ?? '',
      'Chave de Acesso': e.chave_acesso || '',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [{ wch: 12 }, { wch: 8 }, { wch: 10 }, { wch: 6 }, { wch: 30 }, { wch: 20 }, { wch: 10 }, { wch: 14 }, { wch: 46 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Entradas')
    XLSX.writeFile(wb, `entradas-estoque-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const now = new Date()
  const entriesThisMonth = useMemo(() => {
    return entries.filter(e => {
      const d = new Date(e.created_at)
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    })
  }, [entries, now])

  const totalValue = useMemo(() => {
    return entries.reduce((acc, e) => acc + (e.valor_total ?? 0), 0)
  }, [entries])

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
            <PackageOpen className="h-6 w-6 text-indigo-500" />
            Entradas de Estoque
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Histórico de entradas e notas fiscais</p>
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
          <Button size="sm" className="h-9 gap-2" onClick={() => setEntryDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Nova Entrada
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total de Entradas"
          value={entries.length}
          icon={PackageOpen}
          bar="bg-indigo-500"
        />
        <StatCard
          title="Entradas Este Mês"
          value={entriesThisMonth.length}
          icon={CalendarDays}
          bar="bg-blue-500"
        />
        <StatCard
          title="Valor Total"
          value={`R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={TrendingUp}
          bar="bg-emerald-500"
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {entriesLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <PackageOpen className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium">Nenhuma entrada registrada</p>
            <Button variant="outline" size="sm" onClick={() => setEntryDialogOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Registrar primeira entrada
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Data</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tipo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nº Nota</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fornecedor</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Itens</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Valor Total</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ações</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => {
                  const badge = tipoBadge[entry.tipo] || tipoBadge.manual
                  const date = new Date(entry.created_at).toLocaleDateString('pt-BR')
                  return (
                    <tr
                      key={entry.id}
                      className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/10'}`}
                    >
                      <td className="px-4 py-3">
                        <span className="text-sm text-foreground">{date}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground">
                          {entry.numero_nota
                            ? `${entry.numero_nota}${entry.serie_nota ? ` / ${entry.serie_nota}` : ''}`
                            : <span className="text-muted-foreground/40">—</span>
                          }
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-foreground">
                          {entry.fornecedor_nome || entry.emitente_nome || <span className="text-muted-foreground/40">—</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-medium text-foreground">{entry.itens?.length ?? 0}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-semibold text-foreground">
                          {entry.valor_total != null
                            ? `R$ ${Number(entry.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                            : <span className="text-muted-foreground/40">—</span>
                          }
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedEntry(entry)}
                            className="h-8 px-2 text-xs"
                          >
                            <FileText className="h-3.5 w-3.5 mr-1" />
                            Detalhes
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

      {/* Entry Detail Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Detalhes da Entrada</h2>
              <button
                onClick={() => setSelectedEntry(null)}
                className="text-muted-foreground hover:text-foreground text-xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Tipo</p>
                  <Badge variant={tipoBadge[selectedEntry.tipo]?.variant || 'secondary'}>
                    {tipoBadge[selectedEntry.tipo]?.label || selectedEntry.tipo}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Data</p>
                  <p className="font-medium">{new Date(selectedEntry.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
                {selectedEntry.numero_nota && (
                  <div>
                    <p className="text-xs text-muted-foreground">Número da nota</p>
                    <p className="font-medium">{selectedEntry.numero_nota}{selectedEntry.serie_nota ? ` / ${selectedEntry.serie_nota}` : ''}</p>
                  </div>
                )}
                {(selectedEntry.fornecedor_nome || selectedEntry.emitente_nome) && (
                  <div>
                    <p className="text-xs text-muted-foreground">Fornecedor</p>
                    <p className="font-medium">{selectedEntry.fornecedor_nome || selectedEntry.emitente_nome}</p>
                  </div>
                )}
                {selectedEntry.valor_total != null && (
                  <div>
                    <p className="text-xs text-muted-foreground">Valor total</p>
                    <p className="font-semibold text-foreground">
                      R$ {Number(selectedEntry.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
              </div>

              {selectedEntry.chave_acesso && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Chave de acesso</p>
                  <p className="text-xs font-mono bg-muted rounded p-2 break-all">{selectedEntry.chave_acesso}</p>
                </div>
              )}

              {selectedEntry.observacoes && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Observações</p>
                  <p className="text-sm">{selectedEntry.observacoes}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground mb-2">Itens ({selectedEntry.itens?.length ?? 0})</p>
                <div className="space-y-2">
                  {(selectedEntry.itens || []).map(item => (
                    <div key={item.id} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.produto_nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {Number(item.quantidade).toLocaleString('pt-BR', { maximumFractionDigits: 3 })} {item.unidade}
                          {item.preco_unitario != null && ` × R$ ${Number(item.preco_unitario).toFixed(2)}`}
                        </p>
                      </div>
                      {item.preco_total != null && (
                        <p className="text-sm font-semibold">
                          R$ {Number(item.preco_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <StockEntryDialog
        open={entryDialogOpen}
        onOpenChange={setEntryDialogOpen}
      />
    </div>
  )
}
