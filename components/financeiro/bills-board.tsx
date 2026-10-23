'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Check, CircleCheck, Ellipsis, FileSpreadsheet, FileText, Pencil, Plus, ReceiptText, Repeat, Search, SearchX, Trash2,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Header } from '@/components/layouts/header'
import {
  useReceivables, usePayables, useUpdateReceivable, useUpdatePayable, useDeleteReceivable, useDeletePayable,
} from '@/hooks/use-financial'
import { usePaymentMethods } from '@/hooks/use-payment-methods'
import { usePlanUsage } from '@/hooks/use-plan-usage'
import type { Payable, Receivable } from '@/lib/validations/financial'
import { ReceivableDialog } from '@/components/financial/receivable-dialog'
import { PayableDialog } from '@/components/financial/payable-dialog'
import { MASTER_DETAIL_CSS } from '@/components/dashboard/master-detail-css'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { FIN_CSS, FinanceTabs, brl, dayLabel, daysFromToday, isLate, shortDate, todayISO } from './finance-ui'
import { payInput, receiveInput } from './week-bills'

type Kind = 'r' | 'p'
type Chip = '' | 'late' | 'week' | 'open' | 'done' | 'cancelled'
type Due = 'all' | 'today' | '7' | '30' | 'month' | 'lastMonth'
type Sort = 'due' | 'value' | 'name'

interface Bill {
  id: string
  descricao: string
  valor: number
  venc: string
  paidAt: string | null
  status: 'open' | 'late' | 'done' | 'cancelled'
  forma: string | null
  who: string | null
  categoria: string | null
  recurring: boolean
  osId: string | null
  observacoes: string | null
  raw: Receivable | Payable
}

const TXT = {
  r: { title: 'Contas a receber', one: 'conta a receber', done: 'Recebida', doneVerb: 'Marcar como recebida', settle: 'Receber', paidAt: 'Recebida em', file: 'contas-receber', sheet: 'Contas a Receber' },
  p: { title: 'Contas a pagar', one: 'conta a pagar', done: 'Paga', doneVerb: 'Marcar como paga', settle: 'Pagar', paidAt: 'Paga em', file: 'contas-pagar', sheet: 'Contas a Pagar' },
}

function toBill(kind: Kind, raw: Receivable | Payable): Bill {
  const done = kind === 'r' ? raw.status === 'recebido' : raw.status === 'pago'
  const status: Bill['status'] = raw.status === 'cancelado' ? 'cancelled' : done ? 'done' : isLate(raw) ? 'late' : 'open'
  const p = kind === 'p' ? (raw as Payable) : null
  const r = kind === 'r' ? (raw as Receivable) : null
  return {
    id: raw.id,
    descricao: raw.descricao,
    valor: Number(raw.valor) || 0,
    venc: raw.data_vencimento,
    paidAt: r ? r.data_recebimento : p!.data_pagamento,
    status,
    forma: raw.forma_pagamento,
    who: p?.fornecedor ?? null,
    categoria: p?.categoria ?? null,
    recurring: !!p?.recurring_expense_id,
    osId: r?.service_order_id ?? null,
    observacoes: raw.observacoes,
    raw,
  }
}

function inDue(b: Bill, due: Due) {
  if (due === 'all') return true
  const n = daysFromToday(b.venc)
  if (n === null) return false
  if (due === 'today') return n === 0
  if (due === '7') return n >= 0 && n <= 7
  if (due === '30') return n >= 0 && n <= 30
  const now = new Date()
  const m = due === 'month' ? now.getMonth() : now.getMonth() - 1
  const ref = new Date(now.getFullYear(), m, 1)
  return b.venc.slice(0, 7) === todayISO(ref).slice(0, 7)
}

/** Contas a receber ou a pagar: lista à esquerda, ficha da conta à direita (no celular, uma de cada vez) */
export function BillsBoard({ kind }: { kind: Kind }) {
  const t = TXT[kind]
  const recQ = useReceivables()
  const payQ = usePayables()
  const { data: paymentMethods = [] } = usePaymentMethods()
  const { data: planUsage } = usePlanUsage()
  const isFree = planUsage?.plan === 'free'
  const q = kind === 'r' ? recQ : payQ
  const isLoading = q.isLoading

  const [newOpen, setNewOpen] = useState(false)
  const [editing, setEditing] = useState<Bill | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mobileDetail, setMobileDetail] = useState(false)
  const [query, setQuery] = useState('')
  const [chip, setChip] = useState<Chip>('')
  const [due, setDue] = useState<Due>('all')
  const [forma, setForma] = useState('all')
  const [sortBy, setSortBy] = useState<Sort>('due')

  const methodName = (code: string | null | undefined) => (code ? paymentMethods.find((m) => m.code === code)?.name ?? code : 'Não informado')

  const bills = useMemo(
    () => ((kind === 'r' ? recQ.data : payQ.data) ?? []).map((raw) => toBill(kind, raw)),
    [kind, recQ.data, payQ.data],
  )

  const formas = useMemo(() => [...new Set(bills.map((b) => b.forma).filter((f): f is string => !!f))], [bills])

  const counts = useMemo(() => ({
    late: bills.filter((b) => b.status === 'late').length,
    week: bills.filter((b) => (b.status === 'open') && (daysFromToday(b.venc) ?? 99) <= 7).length,
    open: bills.filter((b) => b.status === 'open' || b.status === 'late').length,
    done: bills.filter((b) => b.status === 'done').length,
    cancelled: bills.filter((b) => b.status === 'cancelled').length,
  }), [bills])

  const list = useMemo(() => {
    const s = query.trim().toLowerCase()
    return bills
      .filter((b) => {
        if (s && !`${b.descricao} ${b.who ?? ''} ${b.categoria ?? ''}`.toLowerCase().includes(s)) return false
        if (chip === 'late' && b.status !== 'late') return false
        if (chip === 'week' && !(b.status === 'open' && (daysFromToday(b.venc) ?? 99) <= 7)) return false
        if (chip === 'open' && !(b.status === 'open' || b.status === 'late')) return false
        if (chip === 'done' && b.status !== 'done') return false
        if (chip === 'cancelled' && b.status !== 'cancelled') return false
        if (forma !== 'all' && b.forma !== forma) return false
        return inDue(b, due)
      })
      .sort((a, b) => {
        if (sortBy === 'value') return b.valor - a.valor
        if (sortBy === 'name') return a.descricao.localeCompare(b.descricao, 'pt-BR')
        // abertas primeiro, por vencimento; depois as quitadas/canceladas, mais recentes primeiro
        const ao = a.status === 'open' || a.status === 'late', bo = b.status === 'open' || b.status === 'late'
        if (ao !== bo) return ao ? -1 : 1
        return ao ? a.venc.localeCompare(b.venc) : b.venc.localeCompare(a.venc)
      })
  }, [bills, query, chip, forma, due, sortBy])

  const totals = useMemo(() => ({
    open: list.filter((b) => b.status === 'open' || b.status === 'late').reduce((s, b) => s + b.valor, 0),
    late: list.filter((b) => b.status === 'late').reduce((s, b) => s + b.valor, 0),
    done: list.filter((b) => b.status === 'done').reduce((s, b) => s + b.valor, 0),
    all: list.reduce((s, b) => s + b.valor, 0),
  }), [list])

  const selected = list.find((b) => b.id === selectedId) ?? list[0] ?? null
  const openBill = (b: Bill) => { setSelectedId(b.id); setMobileDetail(true) }
  const clearFilters = () => { setQuery(''); setChip(''); setDue('all'); setForma('all') }

  // ── exportações (mesmos campos de antes) ──
  const exportExcel = () => {
    const data = kind === 'r'
      ? list.map((b) => ({ 'Descrição': b.descricao, 'Valor': b.valor, 'Vencimento': b.venc, 'Status': b.raw.status, 'Forma de Pagamento': methodName(b.forma), 'Recebimento': b.paidAt || '', 'Observações': b.observacoes || '' }))
      : list.map((b) => ({ 'Fornecedor': b.who, 'Descrição': b.descricao, 'Valor': b.valor, 'Vencimento': b.venc, 'Status': b.raw.status, 'Pagamento': b.paidAt || '', 'Observações': b.observacoes || '' }))
    const ws = XLSX.utils.json_to_sheet(data)
    ws['!cols'] = kind === 'r'
      ? [{ wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 18 }, { wch: 15 }, { wch: 30 }]
      : [{ wch: 25 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 30 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, t.sheet)
    XLSX.writeFile(wb, `${t.file}-${todayISO()}.xlsx`)
  }
  const exportPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(18); doc.text(t.sheet, 14, 22)
    doc.setFontSize(11)
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30)
    doc.text(`Total: ${brl(totals.all)}`, 14, 37)
    doc.text(`Registros: ${list.length} de ${bills.length}`, 14, 44)
    let y = 50
    if (kind === 'r') {
      const byMethod = new Map<string, number>()
      for (const b of list.filter((x) => x.status === 'done')) byMethod.set(methodName(b.forma), (byMethod.get(methodName(b.forma)) ?? 0) + b.valor)
      if (byMethod.size) {
        doc.setFontSize(10); doc.text('Resumo por Forma de Pagamento:', 14, 54); y = 60
        for (const [nome, v] of byMethod) { doc.text(`${nome}: ${brl(v)}`, 20, y); y += 6 }
      }
    }
    const fmt = (d: string | null) => (d ? d.split('T')[0].split('-').reverse().join('/') : '-')
    autoTable(doc, kind === 'r'
      ? { startY: y + 6, head: [['Descrição', 'Valor', 'Vencimento', 'Status', 'Forma Pag.', 'Recebimento']], body: list.map((b) => [b.descricao, brl(b.valor), fmt(b.venc), b.raw.status, methodName(b.forma), fmt(b.paidAt)]), styles: { fontSize: 7 }, headStyles: { fillColor: [200, 113, 74] } }
      : { startY: y, head: [['Fornecedor', 'Descrição', 'Valor', 'Vencimento', 'Status']], body: list.map((b) => [b.who ?? '', b.descricao, brl(b.valor), fmt(b.venc), b.raw.status]), styles: { fontSize: 8 }, headStyles: { fillColor: [200, 113, 74] } })
    doc.save(`${t.file}-${todayISO()}.pdf`)
  }

  const CHIPS: { key: Exclude<Chip, ''>; label: string }[] = [
    { key: 'late', label: 'Atrasadas' },
    { key: 'week', label: 'Vencem em 7 dias' },
    { key: 'open', label: 'Em aberto' },
    { key: 'done', label: kind === 'r' ? 'Recebidas' : 'Pagas' },
    { key: 'cancelled', label: 'Canceladas' },
  ]

  return (
    <div className="flex h-full flex-col">
      <style>{MASTER_DETAIL_CSS + FIN_CSS}</style>
      <Header
        title="Financeiro"
        description={t.title}
        action={
          <>
<span className="hidden gap-2 sm:flex">
            <button type="button" className="cli-ghost" style={{ minHeight: 42, padding: '0 12px' }} onClick={exportExcel} disabled={isFree}
              title={isFree ? 'Disponível no plano Pro' : 'Exportar Excel'} aria-label="Exportar Excel">
              <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
            </button>
            <button type="button" className="cli-ghost" style={{ minHeight: 42, padding: '0 12px' }} onClick={exportPDF} disabled={isFree}
              title={isFree ? 'Disponível no plano Pro' : 'Exportar PDF'} aria-label="Exportar PDF">
              <FileText className="h-4 w-4" aria-hidden="true" />
            </button>
            </span>
            <button type="button" className="cli-primary" onClick={() => setNewOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">Nova conta</span><span className="sm:hidden">Nova</span>
            </button>
          </>
        }
      />
      <FinanceTabs />

      <div className="flex min-h-0 flex-1">
        {/* ── lista ── */}
        <section aria-label={`Lista de ${t.title.toLowerCase()}`}
          className={`flex min-h-0 w-full flex-col border-border/70 bg-card lg:w-[420px] lg:shrink-0 lg:border-r xl:w-[450px] ${mobileDetail ? 'hidden lg:flex' : 'flex'}`}>
          <div className="border-b border-dashed border-border px-4 pt-4 pb-3 sm:px-5">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder={kind === 'r' ? 'Buscar por descrição' : 'Buscar por descrição ou fornecedor'} aria-label="Buscar contas"
                className="h-11 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-[15px] outline-none focus:border-[#C8714A] focus:ring-3 focus:ring-[#C8714A]/15" />
            </label>
            <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Filtros">
              {CHIPS.map(({ key, label }) => (
                <button key={key} type="button" aria-pressed={chip === key} onClick={() => setChip(chip === key ? '' : key)}
                  className={`cli-chip ${key === 'late' && counts.late ? 'ord-chip-late' : ''}`}>
                  {label}{counts[key] ? <span className="tabular-nums opacity-70">{counts[key]}</span> : null}
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <select value={due} onChange={(e) => setDue(e.target.value as Due)} aria-label="Vencimento"
                className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-background px-2.5 text-[13px] font-medium">
                <option value="all">Qualquer data</option>
                <option value="today">Vence hoje</option>
                <option value="7">Próximos 7 dias</option>
                <option value="30">Próximos 30 dias</option>
                <option value="month">Este mês</option>
                <option value="lastMonth">Mês passado</option>
              </select>
              {formas.length > 0 && (
                <select value={forma} onChange={(e) => setForma(e.target.value)} aria-label="Forma de pagamento"
                  className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-background px-2.5 text-[13px] font-medium">
                  <option value="all">Toda forma</option>
                  {formas.map((f) => <option key={f} value={f}>{methodName(f)}</option>)}
                </select>
              )}
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as Sort)} aria-label="Ordenar"
                className="h-9 rounded-lg border border-border bg-background px-2.5 text-[13px] font-medium">
                <option value="due">Por vencimento</option>
                <option value="value">Por valor</option>
                <option value="name">A–Z</option>
              </select>
            </div>
            <p className="mt-3 flex flex-wrap justify-between gap-x-3 text-[13px] text-muted-foreground" aria-live="polite">
              <span>{isLoading ? 'Carregando...' : `${list.length} ${list.length === 1 ? 'conta' : 'contas'}`}</span>
              {!isLoading && list.length > 0 && (
                <span className="tabular-nums">
                  em aberto <b className="font-semibold text-foreground">{brl(totals.open)}</b>
                  {totals.late > 0 && <> · <b className="fin-late font-semibold">{brl(totals.late)}</b> em atraso</>}
                </span>
              )}
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
            {isLoading ? (
              <ul className="space-y-1 px-1">{Array.from({ length: 6 }, (_, i) => <li key={i} className="h-14 animate-pulse rounded-lg bg-muted/60" />)}</ul>
            ) : bills.length === 0 ? (
              <div className="px-6 py-14 text-center text-sm text-muted-foreground">
                <ReceiptText className="mx-auto h-7 w-7 text-[#C8A27A]" aria-hidden="true" />
                <p className="mt-3 mb-1 font-serif-display text-2xl text-foreground">Nenhuma {t.one} ainda</p>
                {kind === 'r' ? 'Ordens concluídas sem pagamento viram contas a receber aqui. Você também pode lançar uma à mão.' : 'Lance aluguel, contas e compras de material para não perder nenhum vencimento.'}
                <div className="mt-4"><button type="button" onClick={() => setNewOpen(true)} className="cli-primary"><Plus className="h-4 w-4" aria-hidden="true" />Nova conta</button></div>
              </div>
            ) : list.length === 0 ? (
              <div className="px-6 py-14 text-center text-sm text-muted-foreground">
                <SearchX className="mx-auto h-7 w-7 text-[#C8A27A]" aria-hidden="true" />
                <p className="mt-3 mb-1 font-serif-display text-2xl text-foreground">Nada encontrado</p>
                Nenhuma conta {query ? <>com &ldquo;{query}&rdquo;</> : 'com esse filtro'}.
                <div className="mt-4"><button type="button" onClick={clearFilters} className="cli-ghost">Limpar busca e filtros</button></div>
              </div>
            ) : (
              <ul>
                {list.map((b) => {
                  const on = selected?.id === b.id
                  return (
                    <li key={b.id}>
                      <button type="button" onClick={() => openBill(b)} aria-current={on ? 'true' : undefined} className={`cli-row ${on ? 'is-on' : ''}`}>
                        <span className="min-w-0 flex-1 pl-1">
                          <b className={`flex items-center gap-1.5 text-[14.5px] font-semibold ${b.status === 'cancelled' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                            <span className="truncate">{b.descricao}</span>
                            {b.recurring && <Repeat className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-label="Recorrente" />}
                          </b>
                          <span className="block truncate text-[12.5px] text-muted-foreground">
                            <DueText b={b} paidLabel={t.paidAt} />{b.who ? ` · ${b.who}` : b.categoria ? ` · ${b.categoria}` : ''}
                          </span>
                        </span>
                        <span className={`shrink-0 text-right text-[14px] font-semibold tabular-nums ${b.status === 'done' || b.status === 'cancelled' ? 'text-muted-foreground' : 'text-foreground'}`}>
                          {brl(b.valor)}
                          {b.status === 'done' && <span className="block text-[11px] font-semibold uppercase tracking-[0.1em] fin-pos">{t.done}</span>}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </section>

        {/* ── ficha ── */}
        <section aria-label="Ficha da conta" className={`min-h-0 flex-1 overflow-y-auto ${mobileDetail ? 'block' : 'hidden lg:block'}`}>
          {selected ? (
            <BillDetail key={selected.id} kind={kind} bill={selected} methodName={methodName}
              onEdit={() => setEditing(selected)}
              onDeleted={() => { setSelectedId(null); setMobileDetail(false) }}
              onBack={() => setMobileDetail(false)} />
          ) : !isLoading && bills.length > 0 ? (
            <p className="p-10 text-sm text-muted-foreground">Escolha uma conta na lista.</p>
          ) : null}
        </section>
      </div>

      {kind === 'r' ? (
        <>
          <ReceivableDialog open={newOpen} onOpenChange={setNewOpen} />
          {editing && <ReceivableDialog open onOpenChange={(v) => { if (!v) setEditing(null) }} receivable={editing.raw as Receivable} />}
        </>
      ) : (
        <>
          <PayableDialog open={newOpen} onOpenChange={setNewOpen} />
          {editing && <PayableDialog open onOpenChange={(v) => { if (!v) setEditing(null) }} payable={editing.raw as Payable} />}
        </>
      )}
    </div>
  )
}

function DueText({ b, paidLabel }: { b: Bill; paidLabel: string }) {
  if (b.status === 'cancelled') return <>Cancelada</>
  if (b.status === 'done') return <>{paidLabel} {shortDate(b.paidAt ?? b.venc, false)}</>
  const n = daysFromToday(b.venc) ?? 0
  if (n < 0) return <span className="fin-late font-semibold">Atrasada {-n} {n === -1 ? 'dia' : 'dias'}</span>
  if (n === 0) return <span className="font-semibold text-[#8A4B2C] dark:text-[#E39B78]">Vence hoje</span>
  return <>Vence {n === 1 ? 'amanhã' : dayLabel(b.venc)}</>
}

function BillDetail({ kind, bill, methodName, onEdit, onDeleted, onBack }: {
  kind: Kind; bill: Bill; methodName: (c: string | null) => string; onEdit: () => void; onDeleted: () => void; onBack: () => void
}) {
  const t = TXT[kind]
  const updateR = useUpdateReceivable()
  const updateP = useUpdatePayable()
  const deleteR = useDeleteReceivable()
  const deleteP = useDeletePayable()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const settling = updateR.isPending || updateP.isPending
  const deleting = deleteR.isPending || deleteP.isPending
  const n = daysFromToday(bill.venc) ?? 0
  const open = bill.status === 'open' || bill.status === 'late'

  const settle = async () => {
    try {
      if (kind === 'r') await updateR.mutateAsync({ id: bill.id, input: receiveInput(bill.raw as Receivable) })
      else await updateP.mutateAsync({ id: bill.id, input: payInput() })
    } catch { /* o hook já mostra o erro */ }
  }
  const remove = async () => {
    try {
      await (kind === 'r' ? deleteR : deleteP).mutateAsync(bill.id)
      setConfirmDelete(false)
      onDeleted()
    } catch { /* o hook já mostra o erro */ }
  }

  const statusChip = bill.status === 'late'
    ? { text: `Atrasada ${-n} ${n === -1 ? 'dia' : 'dias'}`, cls: 'bg-red-600/12 text-red-700 dark:text-red-400' }
    : bill.status === 'done' ? { text: t.done, cls: 'bg-emerald-600/12 text-emerald-800 dark:text-emerald-300' }
    : bill.status === 'cancelled' ? { text: 'Cancelada', cls: 'bg-muted text-muted-foreground' }
    : n === 0 ? { text: 'Vence hoje', cls: 'bg-[#C8714A]/15 text-[#8A4B2C] dark:text-[#E39B78]' }
    : { text: 'Em aberto', cls: 'bg-[#D4A85A]/20 text-[#7A5A1E] dark:text-[#E8C98A]' }

  const box = 'rounded-xl border border-border/70 bg-card px-4 py-3.5'
  const boxTitle = 'mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground'

  return (
    <div className="cli-det px-4 py-5 sm:px-7 sm:py-7">
      <button type="button" onClick={onBack}
        className="mb-4 -ml-1 inline-flex min-h-11 items-center gap-2 rounded-md px-1 text-sm text-muted-foreground hover:text-foreground lg:hidden">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {t.title}
      </button>

      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{kind === 'r' ? 'Conta a receber' : 'Conta a pagar'}</p>
      <div className="mt-1 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <h2 className="min-w-0 font-serif-display text-[30px] leading-[1.05] text-foreground sm:text-[34px]">{bill.descricao}</h2>
        <span className={`inline-flex h-7 shrink-0 items-center rounded-full px-3 text-[12.5px] font-semibold ${statusChip.cls}`}>{statusChip.text}</span>
      </div>
      <p className={`fin-num mt-3 text-[48px] ${bill.status === 'cancelled' ? 'text-muted-foreground line-through' : ''}`}>{brl(bill.valor)}</p>

      <div className="mt-5 mb-6 flex flex-wrap gap-2">
        {open && (
          <button type="button" onClick={settle} disabled={settling} className="cli-primary" style={{ minHeight: 44 }}>
            <Check className="h-4 w-4" aria-hidden="true" /> {settling ? 'Salvando...' : t.doneVerb}
          </button>
        )}
        <button type="button" onClick={onEdit} className="cli-ghost"><Pencil className="h-4 w-4" aria-hidden="true" /> Editar</button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="cli-ghost" style={{ paddingLeft: 12, paddingRight: 12 }} aria-label="Mais ações">
              <Ellipsis className="h-4 w-4" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onSelect={() => setConfirmDelete(true)} className="cursor-pointer text-red-600 focus:text-red-600">
              <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" /> Excluir conta
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
        <div className={box}>
          <h3 className={boxTitle}>Vencimento</h3>
          <p className="text-sm">{shortDate(bill.venc)}{open && <span className="text-muted-foreground"> · {n === 0 ? 'hoje' : n < 0 ? `há ${-n} ${n === -1 ? 'dia' : 'dias'}` : `daqui a ${n} ${n === 1 ? 'dia' : 'dias'}`}</span>}</p>
          {bill.paidAt && <p className="fin-pos mt-1 flex items-center gap-1.5 text-sm"><CircleCheck className="h-4 w-4" aria-hidden="true" />{t.paidAt} {shortDate(bill.paidAt)}</p>}
        </div>
        <div className={box}>
          <h3 className={boxTitle}>Forma de pagamento</h3>
          <p className="text-sm">{bill.forma ? methodName(bill.forma) : <span className="text-muted-foreground">Não informada</span>}</p>
        </div>
        {kind === 'p' && (
          <div className={box}>
            <h3 className={boxTitle}>Fornecedor e categoria</h3>
            <p className="text-sm">{bill.who || <span className="text-muted-foreground">Sem fornecedor</span>}</p>
            {bill.categoria && <p className="text-[13px] text-muted-foreground">{bill.categoria}</p>}
          </div>
        )}
        {kind === 'p' && bill.recurring && (
          <div className={box}>
            <h3 className={boxTitle}>Recorrente</h3>
            <p className="flex items-center gap-2 text-sm"><Repeat className="h-4 w-4 text-[#C8714A]" aria-hidden="true" />Repete todo mês</p>
            <p className="mt-1 text-[12.5px] text-muted-foreground">Para parar de repetir, abra Editar.</p>
          </div>
        )}
        {kind === 'r' && bill.osId && (
          <div className={box}>
            <h3 className={boxTitle}>Origem</h3>
            <p className="text-sm">Gerada por uma ordem de serviço</p>
            <Link href="/ordens-servico" className="mt-1 inline-block text-[13px] font-semibold text-[#8A4B2C] hover:underline dark:text-[#E39B78]">Ver ordens de serviço</Link>
          </div>
        )}
        <div className={`${box} sm:col-span-2`}>
          <h3 className={boxTitle}>Observações</h3>
          <p className="whitespace-pre-line text-sm">{bill.observacoes || <span className="text-muted-foreground">Nenhuma</span>}</p>
        </div>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir esta {t.one}?</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir esta {t.one}? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); remove() }} disabled={deleting} className="bg-red-600 text-white hover:bg-red-700">
              {deleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

