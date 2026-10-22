'use client'

import { useMemo, useState } from 'react'
import { CheckSquare, ClipboardList, Plus, Search, SearchX, Square, Trash2, X } from 'lucide-react'
import { Header } from '@/components/layouts/header'
import { useDeleteServiceOrder, useServiceOrders, useUpdateServiceOrder } from '@/hooks/use-service-orders'
import { usePlanLimit } from '@/hooks/use-plan-usage'
import { ServiceOrderDialog } from '@/components/forms/service-order-dialog'
import { OrderDetail, ORDER_CSS } from '@/components/dashboard/order-detail'
import { OrderPaymentDialog } from '@/components/dashboard/order-payment-dialog'
import { formatBRL } from '@/components/dashboard/client-utils'
import {
  ORDER_STATUS, deadlineLabel, isOverdue, isToReceive, numeroOS, parseLocalDate, type OrderStatus,
} from '@/components/dashboard/order-utils'
import { MASTER_DETAIL_CSS } from '@/components/dashboard/master-detail-css'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { ServiceOrder } from '@/lib/validations/service-order'

type Chip = '' | 'pendente' | 'em_andamento' | 'overdue' | 'receive' | 'concluido' | 'cancelado'
type Period = 'all' | 'today' | 'week' | 'month'
type Sort = 'recent' | 'deadline' | 'value'

const CHIPS: { key: Exclude<Chip, ''>; label: string }[] = [
  { key: 'pendente', label: 'Pendentes' },
  { key: 'em_andamento', label: 'Em andamento' },
  { key: 'overdue', label: 'Atrasadas' },
  { key: 'receive', label: 'A receber' },
  { key: 'concluido', label: 'Concluídas' },
  { key: 'cancelado', label: 'Canceladas' },
]

function matchesChip(o: ServiceOrder, chip: Chip) {
  if (!chip) return true
  if (chip === 'overdue') return isOverdue(o)
  if (chip === 'receive') return isToReceive(o)
  return o.status === chip
}

function inPeriod(o: ServiceOrder, period: Period) {
  if (period === 'all') return true
  const d = parseLocalDate(o.data_abertura)
  if (!d) return false
  const t = new Date(); t.setHours(0, 0, 0, 0)
  if (period === 'today') return d.getTime() === t.getTime()
  const from = new Date(t)
  if (period === 'week') from.setDate(from.getDate() - 7)
  else from.setMonth(from.getMonth() - 1)
  return d >= from
}

/** Ordens à esquerda e a ficha da ordem escolhida à direita (no celular, uma de cada vez) */
export default function OrdensServicoPage() {
  const [newOpen, setNewOpen] = useState(false)
  const [paying, setPaying] = useState<ServiceOrder | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mobileDetail, setMobileDetail] = useState(false)
  const [query, setQuery] = useState('')
  const [chip, setChip] = useState<Chip>('')
  const [period, setPeriod] = useState<Period>('all')
  const [sortBy, setSortBy] = useState<Sort>('recent')
  // seleção em lote
  const [picking, setPicking] = useState(false)
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  const [bulkBusy, setBulkBusy] = useState(false)

  const { data: orders = [], isLoading } = useServiceOrders()
  const updateOrder = useUpdateServiceOrder()
  const deleteOrder = useDeleteServiceOrder()
  const orderLimit = usePlanLimit('orders')

  const counts = useMemo(() => {
    const c = {} as Record<Exclude<Chip, ''>, number>
    for (const { key } of CHIPS) c[key] = orders.filter((o) => matchesChip(o, key)).length
    return c
  }, [orders])

  const list = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^#/, '')
    return orders
      .filter((o) => {
        if (q && !`${o.numero} ${String(o.numero).padStart(6, '0')} ${o.client?.nome ?? ''}`.toLowerCase().includes(q)) return false
        return matchesChip(o, chip) && inPeriod(o, period)
      })
      .sort((a, b) => {
        if (sortBy === 'value') return (Number(b.valor_total) || 0) - (Number(a.valor_total) || 0)
        if (sortBy === 'deadline') {
          // em aberto com prazo primeiro, do mais próximo (ou mais atrasado) ao mais distante
          const da = a.status === 'pendente' || a.status === 'em_andamento' ? parseLocalDate(a.data_prevista)?.getTime() ?? Infinity : Infinity
          const db = b.status === 'pendente' || b.status === 'em_andamento' ? parseLocalDate(b.data_prevista)?.getTime() ?? Infinity : Infinity
          if (da !== db) return da - db
        }
        return b.numero - a.numero
      })
  }, [orders, query, chip, period, sortBy])

  // no computador, sempre há uma ordem aberta na ficha (a primeira da lista, se a escolhida
  // não estiver mais nela — filtrada ou excluída)
  const selected = list.find((o) => o.id === selectedId) ?? list[0] ?? null

  const openOrder = (o: ServiceOrder) => { setSelectedId(o.id); setMobileDetail(true) }
  const clearFilters = () => { setQuery(''); setChip(''); setPeriod('all') }
  const togglePick = (id: string) => setPicked((prev) => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  })
  const stopPicking = () => { setPicking(false); setPicked(new Set()) }

  const bulkStatus = async (status: OrderStatus) => {
    setBulkBusy(true)
    try {
      for (const id of picked) await updateOrder.mutateAsync({ id, input: { status } })
    } catch { /* o hook já mostra o erro */ } finally {
      setBulkBusy(false)
      stopPicking()
    }
  }

  const bulkDelete = async () => {
    setBulkBusy(true)
    try {
      for (const id of picked) await deleteOrder.mutateAsync(id)
    } catch { /* o hook já mostra o erro */ } finally {
      setBulkBusy(false)
      setConfirmBulkDelete(false)
      stopPicking()
    }
  }

  const limitBar = orderLimit.isFree && orderLimit.limit ? (
    <div className="hidden min-w-[170px] sm:block" title="Ordens usadas no plano Free">
      <p className="mb-1.5 flex justify-between text-xs text-muted-foreground">
        Plano Free
        <b className={orderLimit.atLimit ? 'text-red-600' : 'text-[#8A4B2C] dark:text-[#E39B78]'}>{orderLimit.usage} de {orderLimit.limit}</b>
      </p>
      <div className="cli-thread" aria-hidden="true">
        <span style={{ transform: `scaleX(${Math.min(1, orderLimit.usage / orderLimit.limit)})` }} />
      </div>
    </div>
  ) : null

  return (
    <div className="flex h-full flex-col">
      <style>{MASTER_DETAIL_CSS + ORDER_CSS}</style>
      <Header
        title="Ordens de Serviço"
        description="Gerencie as ordens de serviço"
        action={
          <>
            {limitBar}
            <button type="button" onClick={() => setNewOpen(true)} disabled={orderLimit.atLimit}
              title={orderLimit.atLimit ? `Limite do plano Free atingido (${orderLimit.limit} ordens). Faça upgrade para continuar.` : undefined}
              className="cli-primary">
              <Plus className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">Nova ordem</span><span className="sm:hidden">Nova</span>
            </button>
          </>
        }
      />

      {orderLimit.atLimit && (
        <div className="mx-3 mt-3 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 sm:mx-6 dark:border-red-800 dark:bg-red-950/30">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">Limite de ordens de serviço atingido ({orderLimit.usage}/{orderLimit.limit})</p>
            <p className="mt-0.5 text-xs text-red-600 dark:text-red-500">Você atingiu o limite do plano Free. Faça upgrade para o plano Pro para criar mais ordens.</p>
          </div>
          <a href="/configuracoes?tab=assinatura" className="shrink-0 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700">Fazer upgrade</a>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        {/* ── lista ── */}
        <section aria-label="Lista de ordens"
          className={`flex min-h-0 w-full flex-col border-border/70 bg-card lg:w-[420px] lg:shrink-0 lg:border-r xl:w-[450px] ${mobileDetail ? 'hidden lg:flex' : 'flex'}`}>
          <div className="border-b border-dashed border-border px-4 pt-4 pb-3 sm:px-5">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por número ou cliente" aria-label="Buscar ordens"
                className="h-11 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-[15px] outline-none focus:border-[#C8714A] focus:ring-3 focus:ring-[#C8714A]/15" />
            </label>
            <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Filtros">
              {CHIPS.map(({ key, label }) => (
                <button key={key} type="button" aria-pressed={chip === key} onClick={() => setChip(chip === key ? '' : key)}
                  className={`cli-chip ${key === 'overdue' && counts.overdue ? 'ord-chip-late' : ''}`}>
                  {label}{counts[key] ? <span className="tabular-nums opacity-70">{counts[key]}</span> : null}
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="shrink-0 text-[13px] text-muted-foreground" aria-live="polite">
                {isLoading ? 'Carregando...' : `${list.length} ${list.length === 1 ? 'ordem' : 'ordens'}`}
              </p>
              <div className="flex min-w-0 gap-1.5">
                <select value={period} onChange={(e) => setPeriod(e.target.value as Period)} aria-label="Período"
                  className="h-9 min-w-0 rounded-lg border border-border bg-background px-2.5 text-[13px] font-medium">
                  <option value="all">Período</option>
                  <option value="today">Hoje</option>
                  <option value="week">Últimos 7 dias</option>
                  <option value="month">Último mês</option>
                </select>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as Sort)} aria-label="Ordenar"
                  className="h-9 min-w-0 rounded-lg border border-border bg-background px-2.5 text-[13px] font-medium">
                  <option value="recent">Recentes</option>
                  <option value="deadline">Prazo</option>
                  <option value="value">Valor</option>
                </select>
                {list.length > 0 && (
                  <button type="button" onClick={() => (picking ? stopPicking() : setPicking(true))} aria-pressed={picking}
                    aria-label={picking ? 'Concluir seleção' : 'Selecionar ordens'}
                    className="cli-chip shrink-0" style={{ borderRadius: 8, minHeight: 36 }}>
                    <CheckSquare className="h-4 w-4 sm:hidden" aria-hidden="true" />
                    <span className="hidden sm:inline">{picking ? 'Pronto' : 'Selecionar'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
            {isLoading ? (
              <ul className="space-y-1 px-1">{Array.from({ length: 6 }, (_, i) => <li key={i} className="h-16 animate-pulse rounded-lg bg-muted/60" />)}</ul>
            ) : orders.length === 0 ? (
              <div className="px-6 py-14 text-center text-sm text-muted-foreground">
                <ClipboardList className="mx-auto h-7 w-7 text-[#C8A27A]" aria-hidden="true" />
                <p className="mt-3 mb-1 font-serif-display text-2xl text-foreground">Nenhuma ordem ainda</p>
                Crie a primeira e ela aparece aqui, com prazo, pagamento e o andamento do trabalho.
                <div className="mt-4"><button type="button" onClick={() => setNewOpen(true)} className="cli-primary">
                  <Plus className="h-4 w-4" aria-hidden="true" />Nova ordem</button></div>
              </div>
            ) : list.length === 0 ? (
              <div className="px-6 py-14 text-center text-sm text-muted-foreground">
                <SearchX className="mx-auto h-7 w-7 text-[#C8A27A]" aria-hidden="true" />
                <p className="mt-3 mb-1 font-serif-display text-2xl text-foreground">Nada encontrado</p>
                Nenhuma ordem {query ? <>com &ldquo;{query}&rdquo;</> : 'com esse filtro'}.
                <div className="mt-4"><button type="button" onClick={clearFilters} className="cli-ghost">Limpar busca e filtros</button></div>
              </div>
            ) : (
              <ul>
                {list.map((o) => {
                  const on = !picking && selected?.id === o.id
                  const isPicked = picked.has(o.id)
                  const st = ORDER_STATUS[o.status]
                  const dl = deadlineLabel(o)
                  const servicos = o.items?.map((i) => i.service_nome).join(' · ')
                  return (
                    <li key={o.id}>
                      <button type="button"
                        onClick={() => (picking ? togglePick(o.id) : openOrder(o))}
                        aria-current={on ? 'true' : undefined}
                        aria-pressed={picking ? isPicked : undefined}
                        className={`cli-row items-start ${on ? 'is-on' : ''} ${picking && isPicked ? 'is-on' : ''}`}>
                        {picking && (isPicked
                          ? <CheckSquare className="mt-0.5 h-5 w-5 shrink-0 text-[#C8714A]" aria-hidden="true" />
                          : <Square className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />)}
                        <span className="min-w-0 flex-1 pl-1">
                          <span className="flex items-baseline gap-2">
                            <b className="shrink-0 text-[13px] font-semibold tabular-nums text-muted-foreground">{numeroOS(o.numero)}</b>
                            <b className={`truncate text-[14.5px] font-semibold ${o.status === 'cancelado' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                              {o.client?.nome || 'Cliente não informado'}
                            </b>
                          </span>
                          <span className="mt-0.5 block truncate text-[12.5px] text-muted-foreground">{servicos || 'Sem serviços'}</span>
                          <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <span className={`inline-flex h-5 items-center gap-1.5 rounded-full px-2 text-[11px] font-semibold ${st.cls}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} aria-hidden="true" />{st.label}
                            </span>
                            {dl && dl.tone !== 'ok' && (
                              <span className={`inline-flex h-5 items-center rounded-full px-2 text-[11px] font-semibold ${dl.tone === 'late' ? 'bg-red-600/12 text-red-700 dark:text-red-400' : 'bg-[#C8714A]/15 text-[#8A4B2C] dark:text-[#E39B78]'}`}>
                                {dl.text}
                              </span>
                            )}
                            {isToReceive(o) && (
                              <span className="inline-flex h-5 items-center rounded-full border border-dashed border-[#D4A85A] px-2 text-[11px] font-semibold text-[#7A5A1E] dark:text-[#E8C98A]">
                                A receber
                              </span>
                            )}
                          </span>
                        </span>
                        <span className={`shrink-0 pt-0.5 text-[14px] font-semibold tabular-nums ${o.status === 'cancelado' ? 'text-muted-foreground' : 'text-foreground'}`}>
                          {formatBRL(Number(o.valor_total) || 0)}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {picking && (
            <div className="flex flex-wrap items-center gap-2 border-t border-dashed border-border px-4 py-3 sm:px-5" role="toolbar" aria-label="Ações em lote">
              <p className="mr-auto text-[13px] font-medium">
                {picked.size === 0 ? 'Toque nas ordens para selecionar' : `${picked.size} ${picked.size === 1 ? 'selecionada' : 'selecionadas'}`}
              </p>
              <select value="" disabled={!picked.size || bulkBusy} aria-label="Mudar status das selecionadas"
                onChange={(e) => { if (e.target.value) bulkStatus(e.target.value as OrderStatus) }}
                className="h-9 rounded-lg border border-border bg-background px-2.5 text-[13px] font-medium disabled:opacity-50">
                <option value="">Mudar status…</option>
                <option value="pendente">Pendente</option>
                <option value="em_andamento">Em andamento</option>
                <option value="concluido">Concluída</option>
                <option value="cancelado">Cancelada</option>
              </select>
              <button type="button" onClick={() => setConfirmBulkDelete(true)} disabled={!picked.size || bulkBusy}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-300 px-3 text-[13px] font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40">
                <Trash2 className="h-4 w-4" aria-hidden="true" /> Excluir
              </button>
              <button type="button" onClick={stopPicking} aria-label="Sair da seleção"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </section>

        {/* ── ficha ── */}
        <section aria-label="Ficha da ordem" className={`min-h-0 flex-1 overflow-y-auto ${mobileDetail ? 'block' : 'hidden lg:block'}`}>
          {selected ? (
            <OrderDetail
              order={selected}
              onConclude={setPaying}
              onDeleted={() => { setSelectedId(null); setMobileDetail(false) }}
              onBack={() => setMobileDetail(false)}
            />
          ) : !isLoading && orders.length > 0 ? (
            <p className="p-10 text-sm text-muted-foreground">Escolha uma ordem na lista.</p>
          ) : null}
        </section>
      </div>

      <ServiceOrderDialog open={newOpen} onOpenChange={setNewOpen} />
      <OrderPaymentDialog order={paying} onClose={() => setPaying(null)} />

      <AlertDialog open={confirmBulkDelete} onOpenChange={setConfirmBulkDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão em lote</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {picked.size} {picked.size === 1 ? 'ordem de serviço' : 'ordens de serviço'}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); bulkDelete() }} disabled={bulkBusy}
              className="bg-red-600 text-white hover:bg-red-700">
              {bulkBusy ? 'Excluindo...' : `Excluir ${picked.size} ${picked.size === 1 ? 'ordem' : 'ordens'}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
