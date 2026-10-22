'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Ellipsis, PackageMinus, Plus, Search, SearchX, Trash2 } from 'lucide-react'
import { Header } from '@/components/layouts/header'
import { useDeleteStockExit, useStockExits, type StockExit } from '@/hooks/use-inventory'
import { StockExitDialog } from '@/components/inventory/stock-exit-dialog'
import { STOCK_CSS, StockGate, StockTabs, qty } from '@/components/inventory/stock-ui'
import { MASTER_DETAIL_CSS } from '@/components/dashboard/master-detail-css'
import { FIN_CSS, dateTimeOf, shortDate, todayISO } from '@/components/financeiro/finance-ui'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type Chip = '' | 'os' | 'manual' | 'month'
const titleOf = (x: StockExit) => (x.tipo === 'ordem_servico' ? 'Usado em ordem de serviço' : 'Saída manual')

export default function SaidasPage() {
  return (
    <StockGate message="O controle de estoque está disponível a partir do plano Pro. Faça upgrade para registrar saídas e acompanhar o consumo de materiais.">
      <Saidas />
    </StockGate>
  )
}

/** Saídas à esquerda (ordens e manuais), o que saiu à direita */
function Saidas() {
  const { data: exits = [], isLoading } = useStockExits()
  const deleteExit = useDeleteStockExit()
  const [newOpen, setNewOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mobileDetail, setMobileDetail] = useState(false)
  const [query, setQuery] = useState('')
  const [chip, setChip] = useState<Chip>('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const thisMonth = todayISO().slice(0, 7)
  const counts = useMemo(() => ({
    month: exits.filter((x) => x.created_at.slice(0, 7) === thisMonth).length,
    os: exits.filter((x) => x.tipo === 'ordem_servico').length,
    manual: exits.filter((x) => x.tipo !== 'ordem_servico').length,
  }), [exits, thisMonth])

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return exits
      .filter((x) => {
        if (q && !`${(x.itens ?? []).map((i) => i.produto_nome).join(' ')} ${x.observacoes ?? ''}`.toLowerCase().includes(q)) return false
        if (chip === 'os' && x.tipo !== 'ordem_servico') return false
        if (chip === 'manual' && x.tipo === 'ordem_servico') return false
        if (chip === 'month' && x.created_at.slice(0, 7) !== thisMonth) return false
        return true
      })
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  }, [exits, query, chip, thisMonth])

  const selected = list.find((x) => x.id === selectedId) ?? list[0] ?? null

  const remove = async () => {
    if (!selected) return
    try {
      await deleteExit.mutateAsync(selected.id)
      setConfirmDelete(false)
      setSelectedId(null)
      setMobileDetail(false)
    } catch { /* o hook já mostra o erro */ }
  }

  return (
    <div className="flex h-full flex-col">
      <style>{MASTER_DETAIL_CSS + FIN_CSS + STOCK_CSS}</style>
      <Header
        title="Estoque"
        description="Saídas de material"
        action={<button type="button" className="cli-primary" onClick={() => setNewOpen(true)}><Plus className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">Nova saída</span><span className="sm:hidden">Nova</span></button>}
      />
      <StockTabs />

      <div className="flex min-h-0 flex-1">
        <section aria-label="Lista de saídas" className={`flex min-h-0 w-full flex-col border-border/70 bg-card lg:w-[420px] lg:shrink-0 lg:border-r xl:w-[450px] ${mobileDetail ? 'hidden lg:flex' : 'flex'}`}>
          <div className="border-b border-dashed border-border px-4 pt-4 pb-3 sm:px-5">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por produto ou observação" aria-label="Buscar saídas"
                className="h-11 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-[15px] outline-none focus:border-[#C8714A] focus:ring-3 focus:ring-[#C8714A]/15" />
            </label>
            <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Filtros">
              {([['month', 'Este mês'], ['os', 'De ordens de serviço'], ['manual', 'Manuais']] as const).map(([k, l]) => (
                <button key={k} type="button" className="cli-chip" aria-pressed={chip === k} onClick={() => setChip(chip === k ? '' : k)}>{l}{counts[k] ? <span className="tabular-nums opacity-70">{counts[k]}</span> : null}</button>
              ))}
            </div>
            <p className="mt-3 text-[13px] text-muted-foreground" aria-live="polite">{isLoading ? 'Carregando...' : `${list.length} ${list.length === 1 ? 'saída' : 'saídas'}`}</p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
            {isLoading ? (
              <ul className="space-y-1 px-1">{Array.from({ length: 6 }, (_, i) => <li key={i} className="h-14 animate-pulse rounded-lg bg-muted/60" />)}</ul>
            ) : exits.length === 0 ? (
              <div className="px-6 py-14 text-center text-sm text-muted-foreground">
                <PackageMinus className="mx-auto h-7 w-7 text-[#C8A27A]" aria-hidden="true" />
                <p className="mt-3 mb-1 font-serif-display text-2xl text-foreground">Nenhuma saída ainda</p>
                O material usado nas ordens de serviço sai daqui sozinho. Use &ldquo;Nova saída&rdquo; para perdas, amostras e outros usos.
                <div className="mt-4"><button type="button" onClick={() => setNewOpen(true)} className="cli-primary"><Plus className="h-4 w-4" aria-hidden="true" />Nova saída</button></div>
              </div>
            ) : list.length === 0 ? (
              <div className="px-6 py-14 text-center text-sm text-muted-foreground">
                <SearchX className="mx-auto h-7 w-7 text-[#C8A27A]" aria-hidden="true" />
                <p className="mt-3 mb-1 font-serif-display text-2xl text-foreground">Nada encontrado</p>
                <div className="mt-4"><button type="button" onClick={() => { setQuery(''); setChip('') }} className="cli-ghost">Limpar busca e filtros</button></div>
              </div>
            ) : (
              <ul>
                {list.map((x) => {
                  const on = selected?.id === x.id
                  const nomes = (x.itens ?? []).map((i) => i.produto_nome).join(' · ')
                  return (
                    <li key={x.id}>
                      <button type="button" onClick={() => { setSelectedId(x.id); setMobileDetail(true) }} aria-current={on ? 'true' : undefined} className={`cli-row ${on ? 'is-on' : ''}`}>
                        <span className="min-w-0 flex-1 pl-1">
                          <b className="block truncate text-[14.5px] font-semibold">{nomes || titleOf(x)}</b>
                          <span className="block truncate text-[12.5px] text-muted-foreground">{shortDate(x.created_at)} · {titleOf(x)}</span>
                        </span>
                        <span className="shrink-0 text-[13px] font-semibold tabular-nums text-muted-foreground">{x.itens?.length ?? 0} {(x.itens?.length ?? 0) === 1 ? 'item' : 'itens'}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </section>

        <section aria-label="Detalhes da saída" className={`min-h-0 flex-1 overflow-y-auto ${mobileDetail ? 'block' : 'hidden lg:block'}`}>
          {selected && (
            <div key={selected.id} className="cli-det px-4 py-5 sm:px-7 sm:py-7">
              <button type="button" onClick={() => setMobileDetail(false)} className="mb-4 -ml-1 inline-flex min-h-11 items-center gap-2 rounded-md px-1 text-sm text-muted-foreground hover:text-foreground lg:hidden">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Saídas
              </button>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Saída de estoque</p>
              <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
                <h2 className="font-serif-display text-[30px] leading-[1.05] sm:text-[34px]">{titleOf(selected)}</h2>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button type="button" className="cli-ghost" style={{ paddingLeft: 12, paddingRight: 12 }} aria-label="Mais ações"><Ellipsis className="h-4 w-4" aria-hidden="true" /></button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem onSelect={() => setConfirmDelete(true)} className="cursor-pointer text-red-600 focus:text-red-600"><Trash2 className="mr-2 h-4 w-4" aria-hidden="true" /> Excluir saída</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <p className="mt-1 text-[13px] text-muted-foreground">{dateTimeOf(selected.created_at)}</p>
              {selected.service_order_id && (
                <Link href="/ordens-servico" className="mt-2 inline-block text-[13px] font-semibold text-[#8A4B2C] hover:underline dark:text-[#E39B78]">Ver ordens de serviço</Link>
              )}

              <div className="mt-5 rounded-xl border border-border/70 bg-card px-4 py-3.5">
                <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">O que saiu</h3>
                <ul className="divide-y divide-dashed divide-border">
                  {(selected.itens ?? []).map((i) => (
                    <li key={i.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                      <span className="min-w-0 truncate font-medium">{i.produto_nome}</span>
                      <span className="shrink-0 font-semibold tabular-nums">− {qty(i.quantidade)} {i.unidade}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {selected.observacoes && (
                <div className="mt-3 rounded-xl border border-border/70 bg-card px-4 py-3.5">
                  <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Observações</h3>
                  <p className="whitespace-pre-line text-sm">{selected.observacoes}</p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      <StockExitDialog open={newOpen} onOpenChange={setNewOpen} />
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir saída?</AlertDialogTitle>
            <AlertDialogDescription>A saída será removida e as quantidades dos produtos serão revertidas automaticamente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); remove() }} disabled={deleteExit.isPending} className="bg-red-600 text-white hover:bg-red-700">
              {deleteExit.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
