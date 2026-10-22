'use client'

import { useMemo, useState } from 'react'
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, FileSpreadsheet, FileText, Plus, Search, SearchX } from 'lucide-react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Header } from '@/components/layouts/header'
import { useTransactions } from '@/hooks/use-financial'
import { useCashFlow } from '@/hooks/use-financial-stats'
import { usePlanUsage } from '@/hooks/use-plan-usage'
import { TransactionDialog } from '@/components/financial/transaction-dialog'
import { MASTER_DETAIL_CSS } from '@/components/dashboard/master-detail-css'
import { FIN_CSS, FinanceTabs, brl, dayLabel, todayISO } from '@/components/financeiro/finance-ui'
import type { Transaction } from '@/lib/validations/financial'

type Kind = '' | 'entrada' | 'saida'
type Period = 'all' | 'today' | 'week' | 'month' | 'lastMonth'
const PAGE = 120

const dateOf = (t: Transaction) => (t.data_transacao || t.data || t.created_at || '').slice(0, 10)

function inPeriod(d: string, p: Period) {
  if (p === 'all') return true
  const now = new Date()
  const today = todayISO(now)
  if (p === 'today') return d === today
  if (p === 'week') { const from = new Date(now); from.setDate(from.getDate() - 7); return d >= todayISO(from) && d <= today }
  if (p === 'month') return d.slice(0, 7) === today.slice(0, 7) && d <= today
  const first = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  return d.slice(0, 7) === todayISO(first).slice(0, 7)
}

/** O livro do fluxo de caixa: lançamentos agrupados por dia, e ao lado o resumo, as formas de pagamento e os últimos 6 meses */
export default function FluxoCaixaPage() {
  const { data: transactions = [], isLoading } = useTransactions()
  const { data: months = [] } = useCashFlow()
  const { data: planUsage } = usePlanUsage()
  const isFree = planUsage?.plan === 'free'
  const [newOpen, setNewOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState<Kind>('')
  const [period, setPeriod] = useState<Period>('month')
  const [oldestFirst, setOldestFirst] = useState(false)
  const [limit, setLimit] = useState(PAGE)

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return transactions
      .filter((t) => (!q || t.descricao.toLowerCase().includes(q)) && (!kind || t.tipo === kind) && inPeriod(dateOf(t), period))
      .sort((a, b) => (oldestFirst ? 1 : -1) * dateOf(a).localeCompare(dateOf(b)) || (oldestFirst ? 1 : -1) * (a.created_at ?? '').localeCompare(b.created_at ?? ''))
  }, [transactions, query, kind, period, oldestFirst])

  const stats = useMemo(() => {
    const ent = list.filter((t) => t.tipo === 'entrada').reduce((s, t) => s + (Number(t.valor) || 0), 0)
    const sai = list.filter((t) => t.tipo === 'saida').reduce((s, t) => s + (Number(t.valor) || 0), 0)
    const map = new Map<string, number>()
    for (const t of list.filter((x) => x.tipo === 'entrada')) {
      const k = t.payment_method_nome ?? 'Não identificado'
      map.set(k, (map.get(k) ?? 0) + (Number(t.valor) || 0))
    }
    const byMethod = [...map.entries()].map(([nome, total]) => ({ nome, total, pct: ent > 0 ? (total / ent) * 100 : 0 })).sort((a, b) => b.total - a.total)
    return { ent, sai, saldo: ent - sai, byMethod }
  }, [list])

  // agrupa por dia, com o líquido do dia
  const days = useMemo(() => {
    const out: { date: string; net: number; items: Transaction[] }[] = []
    for (const t of list.slice(0, limit)) {
      const d = dateOf(t)
      let g = out[out.length - 1]
      if (!g || g.date !== d) { g = { date: d, net: 0, items: [] }; out.push(g) }
      g.items.push(t)
      g.net += (t.tipo === 'entrada' ? 1 : -1) * (Number(t.valor) || 0)
    }
    return out
  }, [list, limit])

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(list.map((t) => ({ 'Data': t.data_transacao, 'Tipo': t.tipo === 'entrada' ? 'Entrada' : 'Saída', 'Descrição': t.descricao, 'Valor': t.valor, 'Observações': t.observacoes || '' })))
    ws['!cols'] = [{ wch: 15 }, { wch: 12 }, { wch: 35 }, { wch: 15 }, { wch: 30 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Fluxo de Caixa')
    XLSX.writeFile(wb, `fluxo-caixa-${todayISO()}.xlsx`)
  }
  const exportPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(18); doc.text('Fluxo de Caixa', 14, 22)
    doc.setFontSize(11)
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30)
    doc.text(`Entradas: ${brl(stats.ent)}`, 14, 37)
    doc.text(`Saídas: ${brl(stats.sai)}`, 14, 44)
    doc.text(`Saldo: ${brl(stats.saldo)}`, 14, 51)
    autoTable(doc, {
      startY: 58,
      head: [['Data', 'Tipo', 'Descrição', 'Valor']],
      body: list.map((t) => [dateOf(t).split('-').reverse().join('/'), t.tipo === 'entrada' ? 'Entrada' : 'Saída', t.descricao, brl(Number(t.valor))]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [200, 113, 74] },
    })
    doc.save(`fluxo-caixa-${todayISO()}.pdf`)
  }

  const peak = Math.max(1, ...months.map((m) => Math.max(Number(m.entradas) || 0, Number(m.saidas) || 0)))

  return (
    <div>
      <style>{MASTER_DETAIL_CSS + FIN_CSS + FLUXO_CSS}</style>
      <Header
        title="Financeiro"
        description="Fluxo de caixa"
        action={
          <>
<span className="hidden gap-2 sm:flex">
            <button type="button" className="cli-ghost" style={{ minHeight: 42, padding: '0 12px' }} onClick={exportExcel} disabled={isFree}
              title={isFree ? 'Disponível no plano Pro' : 'Exportar Excel'} aria-label="Exportar Excel"><FileSpreadsheet className="h-4 w-4" aria-hidden="true" /></button>
            <button type="button" className="cli-ghost" style={{ minHeight: 42, padding: '0 12px' }} onClick={exportPDF} disabled={isFree}
              title={isFree ? 'Disponível no plano Pro' : 'Exportar PDF'} aria-label="Exportar PDF"><FileText className="h-4 w-4" aria-hidden="true" /></button>
            </span>
            <button type="button" className="cli-primary" onClick={() => setNewOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">Lançamento</span><span className="sm:hidden">Novo</span>
            </button>
          </>
        }
      />
      <FinanceTabs />

      <div className="grid items-start gap-4 p-3 sm:p-6 lg:grid-cols-[1fr_360px] lg:gap-5">
        {/* ── livro ── */}
        <section aria-label="Lançamentos" className="fin-card min-w-0">
          <div className="border-b border-dashed border-border px-4 pt-4 pb-3 sm:px-5">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input type="search" value={query} onChange={(e) => { setQuery(e.target.value); setLimit(PAGE) }} placeholder="Buscar por descrição" aria-label="Buscar lançamentos"
                className="h-11 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-[15px] outline-none focus:border-[#C8714A] focus:ring-3 focus:ring-[#C8714A]/15" />
            </label>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <div className="fin-seg" role="group" aria-label="Tipo">
                {([['', 'Tudo'], ['entrada', 'Entradas'], ['saida', 'Saídas']] as const).map(([k, l]) => (
                  <button key={k} type="button" aria-pressed={kind === k} onClick={() => { setKind(k); setLimit(PAGE) }}>{l}</button>
                ))}
              </div>
              <select value={period} onChange={(e) => { setPeriod(e.target.value as Period); setLimit(PAGE) }} aria-label="Período"
                className="h-9 rounded-lg border border-border bg-background px-2.5 text-[13px] font-medium">
                <option value="today">Hoje</option>
                <option value="week">Últimos 7 dias</option>
                <option value="month">Este mês</option>
                <option value="lastMonth">Mês passado</option>
                <option value="all">Todo período</option>
              </select>
              <select value={oldestFirst ? 'old' : 'new'} onChange={(e) => setOldestFirst(e.target.value === 'old')} aria-label="Ordenar"
                className="h-9 rounded-lg border border-border bg-background px-2.5 text-[13px] font-medium">
                <option value="new">Mais recentes</option>
                <option value="old">Mais antigos</option>
              </select>
              <span className="ml-auto text-[13px] text-muted-foreground" aria-live="polite">{isLoading ? 'Carregando...' : `${list.length} ${list.length === 1 ? 'lançamento' : 'lançamentos'}`}</span>
            </div>
          </div>

          <div className="px-4 pb-3 sm:px-5">
            {isLoading ? (
              <div className="space-y-2 py-4">{Array.from({ length: 6 }, (_, i) => <div key={i} className="h-11 animate-pulse rounded bg-muted" />)}</div>
            ) : transactions.length === 0 ? (
              <div className="px-6 py-14 text-center text-sm text-muted-foreground">
                <ArrowLeftRight className="mx-auto h-7 w-7 text-[#C8A27A]" aria-hidden="true" />
                <p className="mt-3 mb-1 font-serif-display text-2xl text-foreground">Nenhum lançamento ainda</p>
                Recebimentos e pagamentos aparecem aqui sozinhos. Você também pode lançar uma entrada ou saída avulsa.
                <div className="mt-4"><button type="button" onClick={() => setNewOpen(true)} className="cli-primary"><Plus className="h-4 w-4" aria-hidden="true" />Lançamento</button></div>
              </div>
            ) : list.length === 0 ? (
              <div className="px-6 py-14 text-center text-sm text-muted-foreground">
                <SearchX className="mx-auto h-7 w-7 text-[#C8A27A]" aria-hidden="true" />
                <p className="mt-3 mb-1 font-serif-display text-2xl text-foreground">Nada neste período</p>
                Nenhum lançamento {query ? <>com &ldquo;{query}&rdquo;</> : 'com esse filtro'}.
                <div className="mt-4"><button type="button" onClick={() => { setQuery(''); setKind(''); setPeriod('all') }} className="cli-ghost">Ver todo o período</button></div>
              </div>
            ) : (
              <>
                {days.map((g) => (
                  <div key={g.date}>
                    <h3 className="sticky top-0 z-[1] -mx-4 flex items-center justify-between bg-card/95 px-4 pt-4 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground backdrop-blur sm:-mx-5 sm:px-5">
                      <span>{dayLabel(g.date)}</span>
                      <span className={`normal-case tracking-normal tabular-nums text-[12.5px] ${g.net < 0 ? 'fin-late' : 'fin-pos'}`}>{g.net < 0 ? '− ' : '+ '}{brl(Math.abs(g.net))}</span>
                    </h3>
                    <ul>
                      {g.items.map((t) => {
                        const inflow = t.tipo === 'entrada'
                        const Icon = inflow ? ArrowUpRight : ArrowDownLeft
                        return (
                          <li key={t.id} className="grid grid-cols-[30px_1fr_auto] items-center gap-3 border-t border-dashed border-border py-2.5 first:border-t-0">
                            <span className={`flex h-[30px] w-[30px] items-center justify-center rounded-full ${inflow ? 'bg-emerald-600/12 fin-pos' : 'bg-[#8A4B2C]/10 text-[#8A4B2C] dark:text-[#E39B78]'}`}>
                              <Icon className="h-4 w-4" aria-hidden="true" /><span className="sr-only">{inflow ? 'Entrada' : 'Saída'}</span>
                            </span>
                            <span className="min-w-0">
                              <b className="block truncate text-sm font-semibold">{t.descricao}</b>
                              <small className="block truncate text-[12px] text-muted-foreground">
                                {[t.payment_method_nome, t.receivable_id ? 'conta recebida' : t.payable_id ? 'conta paga' : 'lançamento avulso', t.observacoes].filter(Boolean).join(' · ')}
                              </small>
                            </span>
                            <span className={`text-sm font-semibold tabular-nums ${inflow ? 'fin-pos' : ''}`}>{inflow ? '+ ' : '− '}{brl(Number(t.valor))}</span>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ))}
                {list.length > limit && (
                  <div className="pt-3 text-center">
                    <button type="button" className="cli-ghost" onClick={() => setLimit(limit + PAGE)}>Mostrar mais ({list.length - limit})</button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* ── resumo ── */}
        <aside className="space-y-3">
          <div className="fin-card px-5 py-4">
            <p className="fin-cap">Saldo do filtro</p>
            <p className={`fin-num mt-2 text-[44px] ${stats.saldo < 0 ? 'fin-late' : ''}`}>{brl(stats.saldo)}</p>
            <dl className="mt-3 grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5 text-[13.5px]">
              <dt className="text-muted-foreground">Entradas</dt><dd className="fin-pos text-right font-semibold tabular-nums">{brl(stats.ent)}</dd>
              <dt className="text-muted-foreground">Saídas</dt><dd className="text-right font-semibold tabular-nums">{brl(stats.sai)}</dd>
            </dl>
          </div>

          {stats.byMethod.length > 0 && (
            <div className="fin-card px-5 py-4">
              <p className="fin-cap mb-2.5">Entradas por forma de pagamento</p>
              <ul className="space-y-2.5">
                {stats.byMethod.map((m) => (
                  <li key={m.nome} className="text-[13px]">
                    <span className="flex justify-between gap-2"><span className="truncate">{m.nome}</span><b className="font-semibold tabular-nums">{brl(m.total)}</b></span>
                    <span className="flx-meter mt-1" aria-hidden="true"><i style={{ width: `${Math.max(2, m.pct)}%` }} /></span>
                    <span className="sr-only">{Math.round(m.pct)}% das entradas</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {months.length > 0 && (
            <div className="fin-card px-5 py-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="fin-cap">Últimos 6 meses</p>
                <span className="flex gap-3 text-[11.5px] text-muted-foreground">
                  <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-[2px] bg-[#C8714A]" />Entradas</span>
                  <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-[2px] border border-dashed border-foreground" />Saídas</span>
                </span>
              </div>
              <div className="flx-chart" role="img" aria-label="Entradas e saídas dos últimos 6 meses">
                {months.map((m, i) => (
                  <div key={m.mesCompleto ?? i} className="flx-col" title={`${m.mes}: entrou ${brl(Number(m.entradas))}, saiu ${brl(Number(m.saidas))}`}>
                    <span className="flx-bar e" style={{ height: `${((Number(m.entradas) || 0) / peak) * 100}%`, animationDelay: `${i * 50}ms` }} />
                    <span className="flx-bar s" style={{ height: `${((Number(m.saidas) || 0) / peak) * 100}%`, animationDelay: `${i * 50 + 25}ms` }} />
                  </div>
                ))}
              </div>
              <div className="mt-1.5 grid text-center text-[11.5px] text-muted-foreground" style={{ gridTemplateColumns: `repeat(${months.length}, 1fr)` }}>
                {months.map((m, i) => (
                  <span key={m.mesCompleto ?? i}>{m.mes}<b className={`block text-[11.5px] font-semibold tabular-nums ${(Number(m.saldo) || 0) < 0 ? 'fin-late' : 'text-foreground'}`}>{Math.round(Number(m.saldo) || 0).toLocaleString('pt-BR')}</b></span>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      <TransactionDialog open={newOpen} onOpenChange={setNewOpen} />
    </div>
  )
}

const FLUXO_CSS = `
.flx-meter { display: block; height: 6px; border-radius: 3px; background: var(--muted); overflow: hidden; }
.flx-meter i { display: block; height: 100%; border-radius: 3px; background: #C8714A; }
.flx-chart { display: flex; align-items: flex-end; gap: 8px; height: 140px; border-bottom: 1px solid var(--border); }
.flx-col { flex: 1; display: flex; justify-content: center; align-items: flex-end; gap: 3px; height: 100%; }
.flx-bar { width: 40%; max-width: 16px; border-radius: 3px 3px 0 0; transform-origin: bottom; animation: flx-grow .6s cubic-bezier(.2,0,0,1) backwards; }
.flx-bar.e { background: #C8714A; }
.flx-bar.s { border: 1.5px dashed var(--foreground); border-bottom: 0; background: repeating-linear-gradient(135deg, color-mix(in oklab, var(--foreground) 8%, transparent) 0 4px, transparent 4px 8px); }
@keyframes flx-grow { from { transform: scaleY(0); } }
@media (prefers-reduced-motion: reduce) { .flx-bar { animation: none; } }
`
