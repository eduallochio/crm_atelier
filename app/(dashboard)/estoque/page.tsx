'use client'

import { useMemo, useState } from 'react'
import {
  AlertTriangle, ArrowDownLeft, ArrowLeft, ArrowUpRight, Barcode, Ellipsis, FileSpreadsheet, FileText, Package, PackageOpen,
  Pencil, Plus, Power, Search, SearchX,
} from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { Header } from '@/components/layouts/header'
import { useDeleteProduct, useProducts, useStockEntries, useStockExits, type Product } from '@/hooks/use-inventory'
import { ProductDialog } from '@/components/inventory/product-dialog'
import { StockEntryDialog } from '@/components/inventory/stock-entry-dialog'
import { StockExitDialog } from '@/components/inventory/stock-exit-dialog'
import { STOCK_CSS, StockGate, StockMeter, StockTabs, isLow, isOut, qty } from '@/components/inventory/stock-ui'
import { MASTER_DETAIL_CSS } from '@/components/dashboard/master-detail-css'
import { FIN_CSS, brl, shortDate, todayISO } from '@/components/financeiro/finance-ui'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type Chip = '' | 'low' | 'out' | 'active' | 'inactive'
type Sort = 'name' | 'low' | 'value'

export default function EstoquePage() {
  return (
    <StockGate message="O controle de estoque está disponível a partir do plano Pro. Faça upgrade para gerenciar produtos, registrar entradas com nota fiscal e receber alertas de estoque baixo.">
      <Produtos />
    </StockGate>
  )
}

/** Produtos à esquerda, ficha do produto à direita: quanto tem, quanto vale, e o que entrou e saiu */
function Produtos() {
  const { data: products = [], isLoading } = useProducts()
  const [productOpen, setProductOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [entryFor, setEntryFor] = useState<Product | null | undefined>(undefined)
  const [exitFor, setExitFor] = useState<Product | null | undefined>(undefined)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mobileDetail, setMobileDetail] = useState(false)
  const [query, setQuery] = useState('')
  const [chip, setChip] = useState<Chip>('active')
  const [category, setCategory] = useState('all')
  const [sortBy, setSortBy] = useState<Sort>('name')

  const categories = useMemo(() => [...new Set(products.map((p) => p.categoria).filter((c): c is string => !!c))].sort((a, b) => a.localeCompare(b, 'pt-BR')), [products])
  const counts = useMemo(() => ({
    low: products.filter(isLow).length,
    out: products.filter(isOut).length,
    active: products.filter((p) => p.ativo).length,
    inactive: products.filter((p) => !p.ativo).length,
  }), [products])

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products
      .filter((p) => {
        if (q && !`${p.nome} ${p.categoria ?? ''} ${p.codigo_barras ?? ''}`.toLowerCase().includes(q)) return false
        if (chip === 'low' && !isLow(p)) return false
        if (chip === 'out' && !isOut(p)) return false
        if (chip === 'active' && !p.ativo) return false
        if (chip === 'inactive' && p.ativo) return false
        if (category !== 'all' && p.categoria !== category) return false
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'value') return (Number(b.preco_custo) || 0) * Number(b.quantidade_atual) - (Number(a.preco_custo) || 0) * Number(a.quantidade_atual)
        if (sortBy === 'low') {
          const r = (p: Product) => (Number(p.quantidade_minima) > 0 ? Number(p.quantidade_atual) / Number(p.quantidade_minima) : Infinity)
          return r(a) - r(b)
        }
        return a.nome.localeCompare(b.nome, 'pt-BR')
      })
  }, [products, query, chip, category, sortBy])

  const totalValue = useMemo(() => products.filter((p) => p.ativo).reduce((s, p) => s + (Number(p.preco_custo) || 0) * (Number(p.quantidade_atual) || 0), 0), [products])
  const selected = list.find((p) => p.id === selectedId) ?? list[0] ?? null
  const openProduct = (p: Product) => { setSelectedId(p.id); setMobileDetail(true) }
  const handleNew = () => { setEditing(null); setProductOpen(true) }

  // ── exportações (mesmas colunas de antes) ──
  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' })
    const w = doc.internal.pageSize.width
    doc.setFillColor(44, 24, 16); doc.rect(0, 0, w, 28, 'F')
    doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255); doc.text('Meu Atelier', 14, 12)
    doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.text('Posição de Estoque', 14, 21)
    doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, w - 14, 21, { align: 'right' })
    doc.setTextColor(0, 0, 0)
    autoTable(doc, {
      startY: 36,
      head: [['Produto', 'Categoria', 'Estoque Atual', 'Mínimo', 'Unidade', 'Preço Custo', 'Valor Estoque', 'Status']],
      body: list.map((p) => [p.nome, p.categoria || '—', qty(p.quantidade_atual), qty(p.quantidade_minima), p.unidade,
        p.preco_custo != null ? brl(Number(p.preco_custo)) : '—', p.preco_custo != null ? brl(Number(p.preco_custo) * Number(p.quantidade_atual)) : '—', isLow(p) ? 'BAIXO' : 'OK']),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [44, 24, 16] },
      didParseCell(d) { if (d.column.index === 7 && d.cell.raw === 'BAIXO') { d.cell.styles.textColor = [185, 28, 28]; d.cell.styles.fontStyle = 'bold' } },
    })
    doc.save(`estoque-${todayISO()}.pdf`)
  }
  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(list.map((p) => ({
      Produto: p.nome, Categoria: p.categoria || '', 'Estoque Atual': Number(p.quantidade_atual), 'Estoque Mínimo': Number(p.quantidade_minima), Unidade: p.unidade,
      'Preço Custo (R$)': p.preco_custo ?? '', 'Valor em Estoque (R$)': p.preco_custo != null ? parseFloat((Number(p.preco_custo) * Number(p.quantidade_atual)).toFixed(2)) : '',
      Status: isLow(p) ? 'BAIXO' : 'OK',
    })))
    ws['!cols'] = [{ wch: 35 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 8 }, { wch: 16 }, { wch: 20 }, { wch: 8 }]
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Estoque'); XLSX.writeFile(wb, `estoque-${todayISO()}.xlsx`)
  }

  const CHIPS: { key: Exclude<Chip, ''>; label: string }[] = [
    { key: 'low', label: 'Estoque baixo' }, { key: 'out', label: 'Zerados' }, { key: 'active', label: 'Ativos' }, { key: 'inactive', label: 'Inativos' },
  ]

  return (
    <div className="flex h-full flex-col">
      <style>{MASTER_DETAIL_CSS + FIN_CSS + STOCK_CSS}</style>
      <Header
        title="Estoque"
        description={`${counts.active} produtos ativos · ${brl(totalValue)} em estoque`}
        action={
          <>
            <span className="hidden gap-2 sm:flex">
              <button type="button" className="cli-ghost" style={{ minHeight: 42, padding: '0 12px' }} onClick={exportExcel} title="Exportar Excel" aria-label="Exportar Excel"><FileSpreadsheet className="h-4 w-4" aria-hidden="true" /></button>
              <button type="button" className="cli-ghost" style={{ minHeight: 42, padding: '0 12px' }} onClick={exportPDF} title="Exportar PDF" aria-label="Exportar PDF"><FileText className="h-4 w-4" aria-hidden="true" /></button>
              <button type="button" className="cli-ghost" style={{ minHeight: 42 }} onClick={() => setEntryFor(null)}><PackageOpen className="h-4 w-4" aria-hidden="true" />Nova entrada</button>
            </span>
            <button type="button" className="cli-primary" onClick={handleNew}>
              <Plus className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">Novo produto</span><span className="sm:hidden">Novo</span>
            </button>
          </>
        }
      />
      <StockTabs />

      <div className="flex min-h-0 flex-1">
        <section aria-label="Lista de produtos"
          className={`flex min-h-0 w-full flex-col border-border/70 bg-card lg:w-[420px] lg:shrink-0 lg:border-r xl:w-[450px] ${mobileDetail ? 'hidden lg:flex' : 'flex'}`}>
          <div className="border-b border-dashed border-border px-4 pt-4 pb-3 sm:px-5">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nome, categoria ou código" aria-label="Buscar produtos"
                className="h-11 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-[15px] outline-none focus:border-[#C8714A] focus:ring-3 focus:ring-[#C8714A]/15" />
            </label>
            <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Filtros">
              {CHIPS.map(({ key, label }) => (
                <button key={key} type="button" aria-pressed={chip === key} onClick={() => setChip(chip === key ? '' : key)}
                  className={`cli-chip ${key === 'low' && counts.low ? 'ord-chip-late' : ''}`}>
                  {key === 'low' && <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />}{label}{counts[key] ? <span className="tabular-nums opacity-70">{counts[key]}</span> : null}
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="shrink-0 text-[13px] text-muted-foreground" aria-live="polite">{isLoading ? 'Carregando...' : `${list.length} ${list.length === 1 ? 'produto' : 'produtos'}`}</p>
              <div className="flex min-w-0 gap-1.5">
                {categories.length > 0 && (
                  <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Categoria" className="h-9 min-w-0 max-w-[150px] rounded-lg border border-border bg-background px-2.5 text-[13px] font-medium">
                    <option value="all">Categorias</option>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                )}
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as Sort)} aria-label="Ordenar" className="h-9 rounded-lg border border-border bg-background px-2.5 text-[13px] font-medium">
                  <option value="name">A–Z</option>
                  <option value="low">Acabando primeiro</option>
                  <option value="value">Maior valor</option>
                </select>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
            {isLoading ? (
              <ul className="space-y-1 px-1">{Array.from({ length: 6 }, (_, i) => <li key={i} className="h-14 animate-pulse rounded-lg bg-muted/60" />)}</ul>
            ) : products.length === 0 ? (
              <div className="px-6 py-14 text-center text-sm text-muted-foreground">
                <Package className="mx-auto h-7 w-7 text-[#C8A27A]" aria-hidden="true" />
                <p className="mt-3 mb-1 font-serif-display text-2xl text-foreground">Nenhum produto ainda</p>
                Cadastre linhas, tecidos, zíperes e aviamentos para saber quanto tem e quando comprar mais.
                <div className="mt-4"><button type="button" onClick={handleNew} className="cli-primary"><Plus className="h-4 w-4" aria-hidden="true" />Novo produto</button></div>
              </div>
            ) : list.length === 0 ? (
              <div className="px-6 py-14 text-center text-sm text-muted-foreground">
                <SearchX className="mx-auto h-7 w-7 text-[#C8A27A]" aria-hidden="true" />
                <p className="mt-3 mb-1 font-serif-display text-2xl text-foreground">Nada encontrado</p>
                Nenhum produto {query ? <>com &ldquo;{query}&rdquo;</> : 'com esse filtro'}.
                <div className="mt-4"><button type="button" onClick={() => { setQuery(''); setChip(''); setCategory('all') }} className="cli-ghost">Limpar busca e filtros</button></div>
              </div>
            ) : (
              <ul>
                {list.map((p) => {
                  const on = selected?.id === p.id
                  const low = isLow(p)
                  return (
                    <li key={p.id}>
                      <button type="button" onClick={() => openProduct(p)} aria-current={on ? 'true' : undefined} className={`cli-row ${on ? 'is-on' : ''}`}>
                        <span className="min-w-0 flex-1 pl-1">
                          <b className={`block truncate text-[14.5px] font-semibold ${p.ativo ? 'text-foreground' : 'text-muted-foreground'}`}>{p.nome}</b>
                          <span className="block truncate text-[12.5px] text-muted-foreground">{[p.categoria, p.codigo_barras].filter(Boolean).join(' · ') || 'Sem categoria'}</span>
                          <StockMeter p={p} className="mt-1.5 w-[70%]" />
                        </span>
                        <span className="shrink-0 text-right">
                          <span className={`flex items-center justify-end gap-1 text-[14px] font-semibold tabular-nums ${low ? 'fin-late' : p.ativo ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {low && <AlertTriangle className="h-3.5 w-3.5" aria-label="Estoque baixo" />}{qty(p.quantidade_atual)} <small className="text-[12px] font-medium text-muted-foreground">{p.unidade}</small>
                          </span>
                          {!p.ativo && <span className="block text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Inativo</span>}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </section>

        <section aria-label="Ficha do produto" className={`min-h-0 flex-1 overflow-y-auto ${mobileDetail ? 'block' : 'hidden lg:block'}`}>
          {selected ? (
            <ProductDetail key={selected.id} p={selected}
              onEdit={() => { setEditing(selected); setProductOpen(true) }}
              onEntry={() => setEntryFor(selected)} onExit={() => setExitFor(selected)}
              onBack={() => setMobileDetail(false)} />
          ) : !isLoading && products.length > 0 ? <p className="p-10 text-sm text-muted-foreground">Escolha um produto na lista.</p> : null}
        </section>
      </div>

      <ProductDialog open={productOpen} onOpenChange={(o) => { setProductOpen(o); if (!o) setEditing(null) }} product={editing} />
      <StockEntryDialog open={entryFor !== undefined} onOpenChange={(o) => { if (!o) setEntryFor(undefined) }} defaultProduct={entryFor ?? null} />
      <StockExitDialog open={exitFor !== undefined} onOpenChange={(o) => { if (!o) setExitFor(undefined) }} defaultProduct={exitFor ?? null} />
    </div>
  )
}

function ProductDetail({ p, onEdit, onEntry, onExit, onBack }: { p: Product; onEdit: () => void; onEntry: () => void; onExit: () => void; onBack: () => void }) {
  const { data: entries = [] } = useStockEntries()
  const { data: exits = [] } = useStockExits()
  const deleteProduct = useDeleteProduct()
  const [confirmOff, setConfirmOff] = useState(false)
  const low = isLow(p)
  const custo = p.preco_custo != null ? Number(p.preco_custo) : null

  const moves = useMemo(() => {
    const ins = entries.flatMap((e) => (e.itens ?? []).filter((i) => i.product_id === p.id).map((i) => ({
      id: `e-${i.id}`, kind: 'in' as const, date: e.data_emissao || e.created_at, q: Number(i.quantidade), un: i.unidade,
      label: e.numero_nota ? `Nota ${e.numero_nota}` : 'Entrada manual', who: e.fornecedor_nome || e.emitente_nome || null,
    })))
    const outs = exits.flatMap((x) => (x.itens ?? []).filter((i) => i.product_id === p.id).map((i) => ({
      id: `s-${i.id}`, kind: 'out' as const, date: x.created_at, q: Number(i.quantidade), un: i.unidade,
      label: x.tipo === 'ordem_servico' ? 'Usado em ordem de serviço' : 'Saída manual', who: x.observacoes || null,
    })))
    return [...ins, ...outs].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '')).slice(0, 12)
  }, [entries, exits, p.id])

  const box = 'rounded-xl border border-border/70 bg-card px-4 py-3.5'
  const boxTitle = 'mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground'

  return (
    <div className="cli-det px-4 py-5 sm:px-7 sm:py-7">
      <button type="button" onClick={onBack} className="mb-4 -ml-1 inline-flex min-h-11 items-center gap-2 rounded-md px-1 text-sm text-muted-foreground hover:text-foreground lg:hidden">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Produtos
      </button>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{p.categoria || 'Produto'}</p>
      <div className="mt-1 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <h2 className="min-w-0 font-serif-display text-[30px] leading-[1.05] text-foreground sm:text-[34px]">{p.nome}</h2>
        {!p.ativo ? <span className="inline-flex h-7 items-center rounded-full bg-muted px-3 text-[12.5px] font-semibold text-muted-foreground">Inativo</span>
          : low ? <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-red-600/12 px-3 text-[12.5px] font-semibold text-red-700 dark:text-red-400"><AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />Estoque baixo</span>
          : null}
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-x-6 gap-y-2">
        <p className={`fin-num text-[52px] ${low ? 'fin-late' : ''}`}>{qty(p.quantidade_atual)} <span className="text-[26px] text-muted-foreground">{p.unidade}</span></p>
        {Number(p.quantidade_minima) > 0 && (
          <div className="mb-2 min-w-[180px] flex-1 max-w-[280px]">
            <StockMeter p={p} />
            <p className="mt-1.5 text-[12.5px] text-muted-foreground">mínimo {qty(p.quantidade_minima)} {p.unidade}{low ? ' · hora de comprar' : ''}</p>
          </div>
        )}
      </div>

      <div className="mt-5 mb-6 flex flex-wrap gap-2">
        <button type="button" className="cli-primary" style={{ minHeight: 44 }} onClick={onEntry} disabled={!p.ativo}><ArrowUpRight className="h-4 w-4" aria-hidden="true" />Registrar entrada</button>
        <button type="button" className="cli-ghost" onClick={onExit} disabled={!p.ativo}><ArrowDownLeft className="h-4 w-4" aria-hidden="true" />Saída</button>
        <button type="button" className="cli-ghost" onClick={onEdit}><Pencil className="h-4 w-4" aria-hidden="true" />Editar</button>
        {p.ativo && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="cli-ghost" style={{ paddingLeft: 12, paddingRight: 12 }} aria-label="Mais ações"><Ellipsis className="h-4 w-4" aria-hidden="true" /></button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onSelect={() => setConfirmOff(true)} className="cursor-pointer text-red-600 focus:text-red-600">
                <Power className="mr-2 h-4 w-4" aria-hidden="true" /> Desativar produto
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="mb-5 grid grid-cols-3 gap-2.5 sm:gap-3">
        {[
          { l: 'Preço de custo', v: custo != null ? brl(custo) : '—' },
          { l: 'Valor em estoque', v: custo != null ? brl(custo * Number(p.quantidade_atual)) : '—' },
          { l: 'Mínimo', v: Number(p.quantidade_minima) > 0 ? `${qty(p.quantidade_minima)} ${p.unidade}` : '—' },
        ].map((s) => (
          <div key={s.l} className={box}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{s.l}</p>
            <p className="fin-num mt-1.5 pt-1 text-[19px] sm:text-[26px]">{s.v}</p>
          </div>
        ))}
      </div>

      {(p.descricao || p.codigo_barras) && (
        <div className="mb-5 grid gap-2.5 sm:grid-cols-2 sm:gap-3">
          {p.descricao && <div className={`${box} ${p.codigo_barras ? '' : 'sm:col-span-2'}`}><h3 className={boxTitle}>Descrição</h3><p className="whitespace-pre-line text-sm">{p.descricao}</p></div>}
          {p.codigo_barras && <div className={box}><h3 className={boxTitle}>Código de barras</h3><p className="flex items-center gap-2 font-mono text-sm"><Barcode className="h-4 w-4 text-muted-foreground" aria-hidden="true" />{p.codigo_barras}</p></div>}
        </div>
      )}

      <div className={box}>
        <h3 className={boxTitle}>Entradas e saídas</h3>
        {moves.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum movimento ainda. <button type="button" onClick={onEntry} className="font-semibold text-[#8A4B2C] hover:underline dark:text-[#E39B78]">Registrar a primeira entrada</button></p>
        ) : (
          <ul className="divide-y divide-dashed divide-border">
            {moves.map((m) => (
              <li key={m.id} className="grid grid-cols-[28px_1fr_auto] items-center gap-3 py-2.5 text-sm">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full ${m.kind === 'in' ? 'bg-emerald-600/12 fin-pos' : 'bg-[#8A4B2C]/10 text-[#8A4B2C] dark:text-[#E39B78]'}`}>
                  {m.kind === 'in' ? <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /> : <ArrowDownLeft className="h-3.5 w-3.5" aria-hidden="true" />}
                  <span className="sr-only">{m.kind === 'in' ? 'Entrada' : 'Saída'}</span>
                </span>
                <span className="min-w-0"><b className="block truncate font-medium">{m.label}</b><small className="block truncate text-[12px] text-muted-foreground">{shortDate(m.date)}{m.who ? ` · ${m.who}` : ''}</small></span>
                <span className={`font-semibold tabular-nums ${m.kind === 'in' ? 'fin-pos' : ''}`}>{m.kind === 'in' ? '+ ' : '− '}{qty(m.q)} {m.un}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AlertDialog open={confirmOff} onOpenChange={setConfirmOff}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar o produto &ldquo;{p.nome}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>Ele sai das listas de entrada e saída, mas o histórico continua guardado.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); deleteProduct.mutateAsync(p.id).then(() => setConfirmOff(false)).catch(() => {}) }}
              disabled={deleteProduct.isPending} className="bg-red-600 text-white hover:bg-red-700">
              {deleteProduct.isPending ? 'Desativando...' : 'Desativar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
