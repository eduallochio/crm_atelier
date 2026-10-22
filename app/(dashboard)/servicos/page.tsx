'use client'

import { useMemo, useState } from 'react'
import { Info, Plus, Scissors, Search, SearchX, X } from 'lucide-react'
import { Header } from '@/components/layouts/header'
import { useServices } from '@/hooks/use-services'
import { useServiceStats } from '@/hooks/use-service-stats'
import { usePlanLimit } from '@/hooks/use-plan-usage'
import { ServiceDialog } from '@/components/forms/service-dialog'
import { ServiceDetail } from '@/components/dashboard/service-detail'
import { formatBRL } from '@/components/dashboard/client-utils'
import { MASTER_DETAIL_CSS as CSS } from '@/components/dashboard/master-detail-css'
import type { Service } from '@/lib/validations/service'

type Chip = '' | 'active' | 'inactive' | 'noprice'
type Sort = 'name' | 'price-asc' | 'price-desc' | 'most-used'

const CHIPS: { key: Exclude<Chip, ''>; label: string }[] = [
  { key: 'active', label: 'Ativos' },
  { key: 'inactive', label: 'Inativos' },
  { key: 'noprice', label: 'Sem preço' },
]

const semPreco = (s: Service) => !s.preco || Number(s.preco) === 0

/** Catálogo à esquerda e a ficha do serviço escolhido à direita (no celular, uma de cada vez) */
export default function ServicosPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mobileDetail, setMobileDetail] = useState(false)
  const [query, setQuery] = useState('')
  const [chip, setChip] = useState<Chip>('')
  const [category, setCategory] = useState('all')
  const [sortBy, setSortBy] = useState<Sort>('name')
  const [bannerDismissed, setBannerDismissed] = useState(false)

  const { data: services = [], isLoading } = useServices()
  const { data: stats } = useServiceStats()
  const serviceLimit = usePlanLimit('services')

  const usage = useMemo(
    () => new Map((stats?.serviceUsage ?? []).map((u) => [u.id, u.count])),
    [stats],
  )

  const counts = useMemo(() => ({
    active: services.filter((s) => s.ativo).length,
    inactive: services.filter((s) => !s.ativo).length,
    noprice: services.filter((s) => s.ativo && semPreco(s)).length,
  }), [services])

  const categories = useMemo(
    () => [...new Set(services.map((s) => s.categoria).filter((c): c is string => Boolean(c)))]
      .sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [services],
  )

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return services
      .filter((s) => {
        if (q && !`${s.nome} ${s.categoria ?? ''} ${s.descricao ?? ''}`.toLowerCase().includes(q)) return false
        if (chip === 'active' && !s.ativo) return false
        if (chip === 'inactive' && s.ativo) return false
        if (chip === 'noprice' && !(s.ativo && semPreco(s))) return false
        if (category !== 'all' && s.categoria !== category) return false
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return Number(a.preco) - Number(b.preco)
        if (sortBy === 'price-desc') return Number(b.preco) - Number(a.preco)
        if (sortBy === 'most-used') return (usage.get(b.id) ?? 0) - (usage.get(a.id) ?? 0)
        return a.nome.localeCompare(b.nome, 'pt-BR')
      })
  }, [services, query, chip, category, sortBy, usage])

  // no computador, sempre há um serviço aberto na ficha (o primeiro da lista, se o escolhido
  // não estiver mais nela — filtrado ou excluído)
  const selected = list.find((s) => s.id === selectedId) ?? list[0] ?? null

  const openService = (s: Service) => { setSelectedId(s.id); setMobileDetail(true) }
  const handleNew = () => { setEditing(null); setDialogOpen(true) }
  const handleEdit = (s: Service) => { setEditing(s); setDialogOpen(true) }
  const handleDuplicate = (s: Service) => {
    // id vazio → o dialog abre em modo criação, já preenchido
    setEditing({ ...s, id: '', nome: `${s.nome} (Cópia)`, created_at: '', organization_id: '' })
    setDialogOpen(true)
  }
  const clearFilters = () => { setQuery(''); setChip(''); setCategory('all') }

  const showPriceBanner = !bannerDismissed && counts.noprice > 0

  const limitBar = serviceLimit.isFree && serviceLimit.limit ? (
    <div className="hidden min-w-[170px] sm:block" title="Serviços usados no plano Free">
      <p className="mb-1.5 flex justify-between text-xs text-muted-foreground">
        Plano Free
        <b className={serviceLimit.atLimit ? 'text-red-600' : 'text-[#8A4B2C] dark:text-[#E39B78]'}>{serviceLimit.usage} de {serviceLimit.limit}</b>
      </p>
      <div className="cli-thread" aria-hidden="true">
        <span style={{ transform: `scaleX(${Math.min(1, serviceLimit.usage / serviceLimit.limit)})` }} />
      </div>
    </div>
  ) : null

  return (
    <div className="flex h-full flex-col">
      <style>{CSS}</style>
      <Header
        title="Serviços"
        description="Gerencie o catálogo de serviços"
        action={
          <>
            {limitBar}
            <button type="button" onClick={handleNew} disabled={serviceLimit.atLimit}
              title={serviceLimit.atLimit ? `Limite do plano Free atingido (${serviceLimit.limit} serviços). Faça upgrade para continuar.` : undefined}
              className="cli-primary">
              <Plus className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">Novo serviço</span><span className="sm:hidden">Novo</span>
            </button>
          </>
        }
      />

      {serviceLimit.atLimit && (
        <div className="mx-3 mt-3 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 sm:mx-6 dark:border-red-800 dark:bg-red-950/30">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">Limite de serviços atingido ({serviceLimit.usage}/{serviceLimit.limit})</p>
            <p className="mt-0.5 text-xs text-red-600 dark:text-red-500">Você atingiu o limite do plano Free. Faça upgrade para o plano Pro para cadastrar mais serviços.</p>
          </div>
          <a href="/configuracoes?tab=assinatura" className="shrink-0 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700">Fazer upgrade</a>
        </div>
      )}

      {showPriceBanner && (
        <div className={`mx-3 mt-3 items-start gap-3 rounded-xl border border-[#D4A85A]/50 ${mobileDetail ? 'hidden lg:flex' : 'flex'} bg-[#D4A85A]/10 px-4 py-3 sm:mx-6`}>
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#A57A2C] dark:text-[#E8C98A]" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Serviços pré-cadastrados aguardando preço</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              Preparamos <b className="text-foreground">{counts.noprice} serviço{counts.noprice > 1 ? 's' : ''}</b> comuns de ateliê para você.
              Informe o valor de cada um para começar a usá-los nas ordens de serviço.{' '}
              {chip !== 'noprice' && (
                <button type="button" onClick={() => { setChip('noprice'); setCategory('all'); setQuery('') }}
                  className="font-semibold text-[#8A4B2C] hover:underline dark:text-[#E39B78]">
                  Ver serviços sem preço
                </button>
              )}
            </p>
          </div>
          <button type="button" onClick={() => setBannerDismissed(true)} aria-label="Fechar aviso"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-[#D4A85A]/20 hover:text-foreground">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        {/* ── lista ── */}
        <section aria-label="Lista de serviços"
          className={`flex min-h-0 w-full flex-col border-border/70 bg-card lg:w-[400px] lg:shrink-0 lg:border-r xl:w-[430px] ${mobileDetail ? 'hidden lg:flex' : 'flex'}`}>
          <div className="border-b border-dashed border-border px-4 pt-4 pb-3 sm:px-5">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nome, categoria ou descrição" aria-label="Buscar serviços"
                className="h-11 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-[15px] outline-none focus:border-[#C8714A] focus:ring-3 focus:ring-[#C8714A]/15" />
            </label>
            <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Filtros">
              {CHIPS.map(({ key, label }) => (
                <button key={key} type="button" aria-pressed={chip === key} onClick={() => setChip(chip === key ? '' : key)} className="cli-chip">
                  {label}{counts[key] ? <span className="tabular-nums opacity-70">{counts[key]}</span> : null}
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="shrink-0 text-[13px] text-muted-foreground" aria-live="polite">
                {isLoading ? 'Carregando...' : `${list.length} ${list.length === 1 ? 'serviço' : 'serviços'}`}
              </p>
              <div className="flex min-w-0 gap-1.5">
                {categories.length > 0 && (
                  <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Categoria"
                    className="h-9 min-w-0 max-w-[150px] rounded-lg border border-border bg-background px-2.5 text-[13px] font-medium">
                    <option value="all">Categorias</option>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                )}
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as Sort)} aria-label="Ordenar"
                  className="h-9 rounded-lg border border-border bg-background px-2.5 text-[13px] font-medium">
                  <option value="name">A–Z</option>
                  <option value="most-used">Mais vendidos</option>
                  <option value="price-asc">Menor preço</option>
                  <option value="price-desc">Maior preço</option>
                </select>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
            {isLoading ? (
              <ul className="space-y-1 px-1">{Array.from({ length: 6 }, (_, i) => <li key={i} className="h-14 animate-pulse rounded-lg bg-muted/60" />)}</ul>
            ) : services.length === 0 ? (
              <div className="px-6 py-14 text-center text-sm text-muted-foreground">
                <Scissors className="mx-auto h-7 w-7 text-[#C8A27A]" aria-hidden="true" />
                <p className="mt-3 mb-1 font-serif-display text-2xl text-foreground">Nenhum serviço cadastrado ainda</p>
                Cadastre o primeiro e ele aparece aqui, com preço, tempo, materiais e as ordens em que entrou.
                <div className="mt-4"><button type="button" onClick={handleNew} className="cli-primary">
                  <Plus className="h-4 w-4" aria-hidden="true" />Novo serviço</button></div>
              </div>
            ) : list.length === 0 ? (
              <div className="px-6 py-14 text-center text-sm text-muted-foreground">
                <SearchX className="mx-auto h-7 w-7 text-[#C8A27A]" aria-hidden="true" />
                <p className="mt-3 mb-1 font-serif-display text-2xl text-foreground">Nada encontrado</p>
                Nenhum serviço {query ? <>com &ldquo;{query}&rdquo;</> : 'com esse filtro'}.
                <div className="mt-4"><button type="button" onClick={clearFilters} className="cli-ghost">Limpar busca e filtros</button></div>
              </div>
            ) : (
              <ul>
                {list.map((s) => {
                  const on = selected?.id === s.id
                  const n = usage.get(s.id) ?? 0
                  const sub = [s.categoria, s.tempo_estimado, n ? `${n} ${n === 1 ? 'venda' : 'vendas'}` : null].filter(Boolean).join(' · ')
                  return (
                    <li key={s.id}>
                      <button type="button" onClick={() => openService(s)} aria-current={on ? 'true' : undefined}
                        className={`cli-row ${on ? 'is-on' : ''}`}>
                        <span className="min-w-0 flex-1 pl-1">
                          <b className={`block truncate text-[14.5px] font-semibold ${s.ativo ? 'text-foreground' : 'text-muted-foreground'}`}>{s.nome}</b>
                          <span className="block truncate text-[12.5px] text-muted-foreground">{sub || 'Sem categoria'}</span>
                        </span>
                        <span className="shrink-0 text-right">
                          {semPreco(s) ? (
                            <span className="text-[12.5px] font-semibold text-[#8A4B2C] dark:text-[#E39B78]">Sem preço</span>
                          ) : (
                            <span className={`block text-[14px] font-semibold tabular-nums ${s.ativo ? 'text-foreground' : 'text-muted-foreground'}`}>{formatBRL(Number(s.preco))}</span>
                          )}
                          {!s.ativo && <span className="block text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Inativo</span>}
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
        <section aria-label="Ficha do serviço" className={`min-h-0 flex-1 overflow-y-auto ${mobileDetail ? 'block' : 'hidden lg:block'}`}>
          {selected ? (
            <ServiceDetail
              service={selected}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onDeleted={() => { setSelectedId(null); setMobileDetail(false) }}
              onBack={() => setMobileDetail(false)}
            />
          ) : !isLoading && services.length > 0 ? (
            <p className="p-10 text-sm text-muted-foreground">Escolha um serviço na lista.</p>
          ) : null}
        </section>
      </div>

      <ServiceDialog open={dialogOpen} onOpenChange={setDialogOpen} service={editing} />
    </div>
  )
}
