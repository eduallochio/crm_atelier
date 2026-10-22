'use client'

import { useMemo, useState } from 'react'
import { ArrowLeft, FileSpreadsheet, FileText, PackageOpen, Plus, Search, SearchX } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { Header } from '@/components/layouts/header'
import { useStockEntries, type StockEntry } from '@/hooks/use-inventory'
import { StockEntryDialog } from '@/components/inventory/stock-entry-dialog'
import { STOCK_CSS, StockGate, StockTabs, qty } from '@/components/inventory/stock-ui'
import { MASTER_DETAIL_CSS } from '@/components/dashboard/master-detail-css'
import { FIN_CSS, brl, shortDate, todayISO } from '@/components/financeiro/finance-ui'

type Chip = '' | 'nota' | 'manual' | 'month'
const TIPO: Record<string, string> = { manual: 'Manual', NFe: 'NF-e', NFCe: 'NFC-e' }
const fornecedor = (e: StockEntry) => e.fornecedor_nome || e.emitente_nome || null
const nota = (e: StockEntry) => (e.numero_nota ? `${e.numero_nota}${e.serie_nota ? ` / ${e.serie_nota}` : ''}` : null)

export default function EntradasPage() {
  return (
    <StockGate message="O controle de estoque está disponível a partir do plano Pro. Faça upgrade para registrar entradas com NF-e, NF-Ce e acompanhar seu histórico de compras.">
      <Entradas />
    </StockGate>
  )
}

/** Entradas (compras e notas) à esquerda, a nota com seus itens à direita */
function Entradas() {
  const { data: entries = [], isLoading } = useStockEntries()
  const [newOpen, setNewOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mobileDetail, setMobileDetail] = useState(false)
  const [query, setQuery] = useState('')
  const [chip, setChip] = useState<Chip>('')

  const thisMonth = todayISO().slice(0, 7)
  const counts = useMemo(() => ({
    nota: entries.filter((e) => e.tipo !== 'manual').length,
    manual: entries.filter((e) => e.tipo === 'manual').length,
    month: entries.filter((e) => e.created_at.slice(0, 7) === thisMonth).length,
  }), [entries, thisMonth])

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return entries
      .filter((e) => {
        if (q && !`${fornecedor(e) ?? ''} ${e.numero_nota ?? ''} ${(e.itens ?? []).map((i) => i.produto_nome).join(' ')}`.toLowerCase().includes(q)) return false
        if (chip === 'nota' && e.tipo === 'manual') return false
        if (chip === 'manual' && e.tipo !== 'manual') return false
        if (chip === 'month' && e.created_at.slice(0, 7) !== thisMonth) return false
        return true
      })
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  }, [entries, query, chip, thisMonth])

  const total = list.reduce((s, e) => s + (Number(e.valor_total) || 0), 0)
  const selected = list.find((e) => e.id === selectedId) ?? list[0] ?? null

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' })
    const w = doc.internal.pageSize.width
    doc.setFillColor(44, 24, 16); doc.rect(0, 0, w, 28, 'F')
    doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255); doc.text('Meu Atelier', 14, 12)
    doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.text('Histórico de Entradas de Estoque', 14, 21)
    doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, w - 14, 21, { align: 'right' })
    doc.setTextColor(0, 0, 0)
    autoTable(doc, {
      startY: 36,
      head: [['Data', 'Tipo', 'Nº Nota / Série', 'Fornecedor / Emitente', 'Qtd. Itens', 'Valor Total']],
      body: list.map((e) => [new Date(e.created_at).toLocaleDateString('pt-BR'), e.tipo === 'manual' ? 'Manual' : e.tipo, nota(e) ?? '—', fornecedor(e) ?? '—', e.itens?.length ?? 0, e.valor_total != null ? brl(Number(e.valor_total)) : '—']),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [44, 24, 16] },
      foot: [['', '', '', 'TOTAL', list.length, brl(total)]],
      footStyles: { fillColor: [247, 240, 230], textColor: [44, 24, 16], fontStyle: 'bold' },
    })
    doc.save(`entradas-estoque-${todayISO()}.pdf`)
  }
  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(list.map((e) => ({
      Data: new Date(e.created_at).toLocaleDateString('pt-BR'), Tipo: e.tipo === 'manual' ? 'Manual' : e.tipo, 'Nº Nota': e.numero_nota || '', Série: e.serie_nota || '',
      'Fornecedor / Emitente': fornecedor(e) || '', 'CNPJ Emitente': e.emitente_cnpj || '', 'Qtd. Itens': e.itens?.length ?? 0, 'Valor Total (R$)': e.valor_total ?? '', 'Chave de Acesso': e.chave_acesso || '',
    })))
    ws['!cols'] = [{ wch: 12 }, { wch: 8 }, { wch: 10 }, { wch: 6 }, { wch: 30 }, { wch: 20 }, { wch: 10 }, { wch: 14 }, { wch: 46 }]
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Entradas'); XLSX.writeFile(wb, `entradas-estoque-${todayISO()}.xlsx`)
  }

  return (
    <div className="flex h-full flex-col">
      <style>{MASTER_DETAIL_CSS + FIN_CSS + STOCK_CSS}</style>
      <Header
        title="Estoque"
        description="Entradas e notas fiscais"
        action={
          <>
            <span className="hidden gap-2 sm:flex">
              <button type="button" className="cli-ghost" style={{ minHeight: 42, padding: '0 12px' }} onClick={exportExcel} title="Exportar Excel" aria-label="Exportar Excel"><FileSpreadsheet className="h-4 w-4" aria-hidden="true" /></button>
              <button type="button" className="cli-ghost" style={{ minHeight: 42, padding: '0 12px' }} onClick={exportPDF} title="Exportar PDF" aria-label="Exportar PDF"><FileText className="h-4 w-4" aria-hidden="true" /></button>
            </span>
            <button type="button" className="cli-primary" onClick={() => setNewOpen(true)}><Plus className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">Nova entrada</span><span className="sm:hidden">Nova</span></button>
          </>
        }
      />
      <StockTabs />

      <div className="flex min-h-0 flex-1">
        <section aria-label="Lista de entradas" className={`flex min-h-0 w-full flex-col border-border/70 bg-card lg:w-[420px] lg:shrink-0 lg:border-r xl:w-[450px] ${mobileDetail ? 'hidden lg:flex' : 'flex'}`}>
          <div className="border-b border-dashed border-border px-4 pt-4 pb-3 sm:px-5">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por fornecedor, nota ou produto" aria-label="Buscar entradas"
                className="h-11 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-[15px] outline-none focus:border-[#C8714A] focus:ring-3 focus:ring-[#C8714A]/15" />
            </label>
            <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Filtros">
              {([['month', 'Este mês'], ['nota', 'Com nota fiscal'], ['manual', 'Manuais']] as const).map(([k, l]) => (
                <button key={k} type="button" className="cli-chip" aria-pressed={chip === k} onClick={() => setChip(chip === k ? '' : k)}>{l}{counts[k] ? <span className="tabular-nums opacity-70">{counts[k]}</span> : null}</button>
              ))}
            </div>
            <p className="mt-3 flex justify-between text-[13px] text-muted-foreground" aria-live="polite">
              <span>{isLoading ? 'Carregando...' : `${list.length} ${list.length === 1 ? 'entrada' : 'entradas'}`}</span>
              {list.length > 0 && <span>total <b className="font-semibold tabular-nums text-foreground">{brl(total)}</b></span>}
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
            {isLoading ? (
              <ul className="space-y-1 px-1">{Array.from({ length: 6 }, (_, i) => <li key={i} className="h-14 animate-pulse rounded-lg bg-muted/60" />)}</ul>
            ) : entries.length === 0 ? (
              <div className="px-6 py-14 text-center text-sm text-muted-foreground">
                <PackageOpen className="mx-auto h-7 w-7 text-[#C8A27A]" aria-hidden="true" />
                <p className="mt-3 mb-1 font-serif-display text-2xl text-foreground">Nenhuma entrada ainda</p>
                Registre uma compra à mão ou importe o XML da nota fiscal: o estoque dos produtos sobe sozinho.
                <div className="mt-4"><button type="button" onClick={() => setNewOpen(true)} className="cli-primary"><Plus className="h-4 w-4" aria-hidden="true" />Nova entrada</button></div>
              </div>
            ) : list.length === 0 ? (
              <div className="px-6 py-14 text-center text-sm text-muted-foreground">
                <SearchX className="mx-auto h-7 w-7 text-[#C8A27A]" aria-hidden="true" />
                <p className="mt-3 mb-1 font-serif-display text-2xl text-foreground">Nada encontrado</p>
                <div className="mt-4"><button type="button" onClick={() => { setQuery(''); setChip('') }} className="cli-ghost">Limpar busca e filtros</button></div>
              </div>
            ) : (
              <ul>
                {list.map((e) => {
                  const on = selected?.id === e.id
                  return (
                    <li key={e.id}>
                      <button type="button" onClick={() => { setSelectedId(e.id); setMobileDetail(true) }} aria-current={on ? 'true' : undefined} className={`cli-row ${on ? 'is-on' : ''}`}>
                        <span className="min-w-0 flex-1 pl-1">
                          <b className="block truncate text-[14.5px] font-semibold">{fornecedor(e) || (e.tipo === 'manual' ? 'Entrada manual' : 'Sem fornecedor')}</b>
                          <span className="block truncate text-[12.5px] text-muted-foreground">
                            {shortDate(e.created_at)} · {TIPO[e.tipo] ?? e.tipo}{nota(e) ? ` ${nota(e)}` : ''} · {e.itens?.length ?? 0} {(e.itens?.length ?? 0) === 1 ? 'item' : 'itens'}
                          </span>
                        </span>
                        <span className="shrink-0 text-[14px] font-semibold tabular-nums">{e.valor_total != null ? brl(Number(e.valor_total)) : '—'}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </section>

        <section aria-label="Detalhes da entrada" className={`min-h-0 flex-1 overflow-y-auto ${mobileDetail ? 'block' : 'hidden lg:block'}`}>
          {selected && (
            <div key={selected.id} className="cli-det px-4 py-5 sm:px-7 sm:py-7">
              <button type="button" onClick={() => setMobileDetail(false)} className="mb-4 -ml-1 inline-flex min-h-11 items-center gap-2 rounded-md px-1 text-sm text-muted-foreground hover:text-foreground lg:hidden">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Entradas
              </button>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{selected.tipo === 'manual' ? 'Entrada manual' : `${TIPO[selected.tipo]} ${nota(selected) ?? ''}`}</p>
              <h2 className="mt-1 font-serif-display text-[30px] leading-[1.05] sm:text-[34px]">{fornecedor(selected) || 'Sem fornecedor'}</h2>
              <p className="mt-1 text-[13px] text-muted-foreground">Registrada em {shortDate(selected.created_at)}{selected.data_emissao ? ` · nota emitida em ${shortDate(selected.data_emissao)}` : ''}</p>
              <p className="fin-num mt-4 text-[48px]">{selected.valor_total != null ? brl(Number(selected.valor_total)) : '—'}</p>

              <div className="mt-5 grid gap-2.5 sm:grid-cols-2 sm:gap-3">
                {selected.emitente_cnpj && <div className="rounded-xl border border-border/70 bg-card px-4 py-3.5"><h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">CNPJ do emitente</h3><p className="font-mono text-sm">{selected.emitente_cnpj}</p></div>}
                {selected.observacoes && <div className={`rounded-xl border border-border/70 bg-card px-4 py-3.5 ${selected.emitente_cnpj ? '' : 'sm:col-span-2'}`}><h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Observações</h3><p className="whitespace-pre-line text-sm">{selected.observacoes}</p></div>}
                {selected.chave_acesso && <div className="rounded-xl border border-border/70 bg-card px-4 py-3.5 sm:col-span-2"><h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Chave de acesso</h3><p className="break-all font-mono text-[12.5px]">{selected.chave_acesso}</p></div>}
              </div>

              <div className="mt-3 rounded-xl border border-border/70 bg-card px-4 py-3.5">
                <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Itens ({selected.itens?.length ?? 0})</h3>
                <ul className="divide-y divide-dashed divide-border">
                  {(selected.itens ?? []).map((i) => (
                    <li key={i.id} className="flex items-start justify-between gap-3 py-2.5 text-sm">
                      <span className="min-w-0">
                        <b className="block font-medium">{i.produto_nome}</b>
                        <small className="text-[12.5px] text-muted-foreground">{qty(i.quantidade)} {i.unidade}{i.preco_unitario != null ? ` × ${brl(Number(i.preco_unitario))}` : ''}{!i.product_id ? ' · produto não vinculado' : ''}</small>
                      </span>
                      {i.preco_total != null && <span className="shrink-0 font-semibold tabular-nums">{brl(Number(i.preco_total))}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>
      </div>

      <StockEntryDialog open={newOpen} onOpenChange={setNewOpen} />
    </div>
  )
}
