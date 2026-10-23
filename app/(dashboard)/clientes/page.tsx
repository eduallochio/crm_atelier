'use client'

import { useMemo, useState } from 'react'
import { Cake, Plus, Search, SearchX, Users } from 'lucide-react'
import { Header } from '@/components/layouts/header'
import { useClients } from '@/hooks/use-clients'
import { usePlanLimit } from '@/hooks/use-plan-usage'
import { ClientDialog } from '@/components/forms/client-dialog'
import { ServiceOrderDialog } from '@/components/forms/service-order-dialog'
import { ClientDetail } from '@/components/dashboard/client-detail'
import { initialsOf, isBirthdayThisMonth, isNewThisMonth, placeOf } from '@/components/dashboard/client-utils'
import type { Client } from '@/lib/validations/client'
import { MASTER_DETAIL_CSS as CSS } from '@/components/dashboard/master-detail-css'

type Chip = '' | 'bday' | 'new' | 'nophone' | 'noemail'
type Sort = 'recent' | 'oldest' | 'name'

const CHIPS: { key: Exclude<Chip, ''>; label: string }[] = [
  { key: 'bday', label: 'Aniversariantes do mês' },
  { key: 'new', label: 'Novos no mês' },
  { key: 'nophone', label: 'Sem telefone' },
  { key: 'noemail', label: 'Sem e-mail' },
]

/** Lista de clientes à esquerda e a ficha da cliente escolhida à direita (no celular, uma de cada vez) */
export default function ClientesPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [orderOpen, setOrderOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [orderClientId, setOrderClientId] = useState<string | undefined>()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mobileDetail, setMobileDetail] = useState(false)
  const [query, setQuery] = useState('')
  const [chip, setChip] = useState<Chip>('')
  const [sortBy, setSortBy] = useState<Sort>('recent')

  const { data: clients = [], isLoading } = useClients()
  const clientLimit = usePlanLimit('clients')

  const counts = useMemo(() => ({
    bday: clients.filter((c) => isBirthdayThisMonth(c)).length,
    new: clients.filter((c) => isNewThisMonth(c)).length,
  }), [clients])

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return clients
      .filter((c) => {
        if (q && !`${c.nome} ${c.email ?? ''} ${c.telefone ?? ''}`.toLowerCase().includes(q)) return false
        if (chip === 'bday' && !isBirthdayThisMonth(c)) return false
        if (chip === 'new' && !isNewThisMonth(c)) return false
        if (chip === 'nophone' && c.telefone) return false
        if (chip === 'noemail' && c.email) return false
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.nome.localeCompare(b.nome, 'pt-BR')
        const d = new Date(b.data_cadastro).getTime() - new Date(a.data_cadastro).getTime()
        return sortBy === 'recent' ? d : -d
      })
  }, [clients, query, chip, sortBy])

  // no computador, sempre há uma cliente aberta na ficha (a primeira da lista, se a escolhida
  // não estiver mais nela — filtrada ou excluída)
  const selected = list.find((c) => c.id === selectedId) ?? list[0] ?? null

  const openClient = (c: Client) => { setSelectedId(c.id); setMobileDetail(true) }
  const handleNew = () => { setEditing(null); setDialogOpen(true) }
  const handleEdit = (c: Client) => { setEditing(c); setDialogOpen(true) }
  const handleNewOrder = (c: Client) => { setOrderClientId(c.id); setOrderOpen(true) }
  const clearFilters = () => { setQuery(''); setChip('') }

  const limitBar = clientLimit.isFree && clientLimit.limit ? (
    <div className="hidden min-w-[170px] sm:block" title="Clientes usados no plano Free">
      <p className="mb-1.5 flex justify-between text-xs text-muted-foreground">
        Plano Free
        <b className={clientLimit.atLimit ? 'text-red-600' : 'text-[#8A4B2C] dark:text-[#E39B78]'}>{clientLimit.usage} de {clientLimit.limit}</b>
      </p>
      <div className="cli-thread" aria-hidden="true">
        <span style={{ transform: `scaleX(${Math.min(1, clientLimit.usage / clientLimit.limit)})` }} />
      </div>
    </div>
  ) : null

  return (
    <div className="flex h-full flex-col">
      <style>{CSS}</style>
      <Header
        title="Clientes"
        description="Gerencie seus clientes"
        action={
          <>
            {limitBar}
            <button type="button" onClick={handleNew} disabled={clientLimit.atLimit}
              title={clientLimit.atLimit ? `Limite do plano Free atingido (${clientLimit.limit} clientes). Faça upgrade para continuar.` : undefined}
              className="cli-primary">
              <Plus className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">Novo cliente</span><span className="sm:hidden">Novo</span>
            </button>
          </>
        }
      />

      {clientLimit.atLimit && (
        <div className="mx-3 mt-3 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 sm:mx-6 dark:border-red-800 dark:bg-red-950/30">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">Limite de clientes atingido ({clientLimit.usage}/{clientLimit.limit})</p>
            <p className="mt-0.5 text-xs text-red-600 dark:text-red-500">Você atingiu o limite do plano Free. Faça upgrade para o plano Pro para cadastrar mais clientes.</p>
          </div>
          <a href="/configuracoes?tab=assinatura" className="shrink-0 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700">Fazer upgrade</a>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        {/* ── lista ── */}
        <section aria-label="Lista de clientes"
          className={`flex min-h-0 w-full flex-col border-border/70 bg-card lg:w-[400px] lg:shrink-0 lg:border-r xl:w-[430px] ${mobileDetail ? 'hidden lg:flex' : 'flex'}`}>
          <div className="border-b border-dashed border-border px-4 pt-4 pb-3 sm:px-5">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nome, e-mail ou telefone" aria-label="Buscar clientes"
                className="h-11 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-[15px] outline-none focus:border-[#C8714A] focus:ring-3 focus:ring-[#C8714A]/15" />
            </label>
            <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Filtros">
              {CHIPS.map(({ key, label }) => {
                const n = key === 'bday' ? counts.bday : key === 'new' ? counts.new : null
                return (
                  <button key={key} type="button" aria-pressed={chip === key} onClick={() => setChip(chip === key ? '' : key)} className="cli-chip">
                    {key === 'bday' && <Cake className="h-3.5 w-3.5" aria-hidden="true" />}
                    {label}{n ? <span className="tabular-nums opacity-70">{n}</span> : null}
                  </button>
                )
              })}
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="text-[13px] text-muted-foreground" aria-live="polite">
                {isLoading ? 'Carregando...' : `${list.length} ${list.length === 1 ? 'cliente' : 'clientes'}`}
              </p>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as Sort)} aria-label="Ordenar"
                className="h-9 rounded-lg border border-border bg-background px-2.5 text-[13px] font-medium">
                <option value="recent">Mais recentes</option>
                <option value="oldest">Mais antigos</option>
                <option value="name">A–Z</option>
              </select>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
            {isLoading ? (
              <ul className="space-y-1 px-1">{Array.from({ length: 6 }, (_, i) => <li key={i} className="h-14 animate-pulse rounded-lg bg-muted/60" />)}</ul>
            ) : clients.length === 0 ? (
              <div className="px-6 py-14 text-center text-sm text-muted-foreground">
                <Users className="mx-auto h-7 w-7 text-[#C8A27A]" aria-hidden="true" />
                <p className="mt-3 mb-1 font-serif-display text-2xl text-foreground">Nenhuma cliente cadastrada ainda</p>
                Cadastre a primeira e ela aparece aqui, com contato, aniversário e histórico de ordens.
                <div className="mt-4"><button type="button" onClick={handleNew} className="cli-primary">
                  <Plus className="h-4 w-4" aria-hidden="true" />Novo cliente</button></div>
              </div>
            ) : list.length === 0 ? (
              <div className="px-6 py-14 text-center text-sm text-muted-foreground">
                <SearchX className="mx-auto h-7 w-7 text-[#C8A27A]" aria-hidden="true" />
                <p className="mt-3 mb-1 font-serif-display text-2xl text-foreground">Nada encontrado</p>
                Nenhuma cliente {query ? <>com &ldquo;{query}&rdquo;</> : 'com esse filtro'}.
                <div className="mt-4"><button type="button" onClick={clearFilters} className="cli-ghost">Limpar busca e filtros</button></div>
              </div>
            ) : (
              <ul>
                {list.map((c) => {
                  const on = selected?.id === c.id
                  return (
                    <li key={c.id}>
                      <button type="button" onClick={() => openClient(c)} aria-current={on ? 'true' : undefined}
                        className={`cli-row ${on ? 'is-on' : ''}`}>
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#C8714A]/15 text-[13px] font-semibold text-[#8A4B2C] dark:text-[#E39B78]" aria-hidden="true">
                          {initialsOf(c.nome)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <b className="block truncate text-[14.5px] font-semibold text-foreground">{c.nome}</b>
                          <span className="block truncate text-[12.5px] text-muted-foreground">{c.telefone || c.email || placeOf(c) || 'Sem contato'}</span>
                        </span>
                        {isBirthdayThisMonth(c) && <Cake className="h-4 w-4 shrink-0 text-[#C8714A]" aria-label="Aniversário este mês" />}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </section>

        {/* ── ficha ── */}
        <section aria-label="Ficha da cliente" className={`min-h-0 flex-1 overflow-y-auto ${mobileDetail ? 'block' : 'hidden lg:block'}`}>
          {selected ? (
            <ClientDetail
              client={selected}
              onEdit={handleEdit}
              onNewOrder={handleNewOrder}
              onDeleted={() => { setSelectedId(null); setMobileDetail(false) }}
              onBack={() => setMobileDetail(false)}
            />
          ) : !isLoading && clients.length > 0 ? (
            <p className="p-10 text-sm text-muted-foreground">Escolha uma cliente na lista.</p>
          ) : null}
        </section>
      </div>

      <ClientDialog open={dialogOpen} onOpenChange={setDialogOpen} client={editing} />
      <ServiceOrderDialog open={orderOpen} onOpenChange={setOrderOpen} defaultClientId={orderClientId} />
    </div>
  )
}
