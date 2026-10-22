'use client'

import { useState } from 'react'
import {
  ArrowLeft, Clock, Copy, Ellipsis, Gauge, History, Pencil, Power, Scissors, Trash2,
} from 'lucide-react'
import { useDeleteService, useToggleServiceStatus } from '@/hooks/use-services'
import { useServiceUsageStats } from '@/hooks/use-service-stats'
import type { Service } from '@/lib/validations/service'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ServicePriceHistory } from './service-price-history'
import { formatBRL, formatDayMonthYear } from './client-utils'

const STATUS: Record<string, { label: string; cls: string }> = {
  pendente:     { label: 'Pendente',     cls: 'bg-[#D4A85A]/20 text-[#7A5A1E] dark:text-[#E8C98A]' },
  em_andamento: { label: 'Em andamento', cls: 'bg-[#C8714A]/15 text-[#8A4B2C] dark:text-[#E39B78]' },
  concluido:    { label: 'Concluída',    cls: 'bg-emerald-600/12 text-emerald-800 dark:text-emerald-300' },
  cancelado:    { label: 'Cancelada',    cls: 'bg-muted text-muted-foreground' },
}

const DIFICULDADE: Record<string, { label: string; dots: number }> = {
  facil:   { label: 'Fácil', dots: 1 },
  medio:   { label: 'Médio', dots: 2 },
  dificil: { label: 'Difícil', dots: 3 },
}

interface UsageItem {
  id: string
  quantidade: number | string
  valor_total: number | string
  created_at: string | null
  order: { id: string; numero: number; data_abertura: string | null; status: string; client: { nome: string | null } }
}
interface Usage { items: UsageItem[]; totalUses: number; totalRevenue: number; lastUsed: string | null }

interface Props {
  service: Service
  onEdit: (service: Service) => void
  onDuplicate: (service: Service) => void
  onDeleted: () => void
  /** só no celular: volta para a lista */
  onBack?: () => void
}

/** Ficha do serviço: ações, números, detalhes técnicos, materiais e últimas ordens */
export function ServiceDetail({ service, onEdit, onDuplicate, onDeleted, onBack }: Props) {
  const { data, isLoading } = useServiceUsageStats(service.id) as { data: Usage | undefined; isLoading: boolean }
  const deleteService = useDeleteService()
  const toggleStatus = useToggleServiceStatus()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)

  const preco = Number(service.preco) || 0
  const custo = Number(service.custo_materiais) || 0
  const materiais = service.materiais_produtos ?? []
  const margem = preco > 0 && custo > 0 ? Math.round(((preco - custo) / preco) * 100) : null
  const dif = service.nivel_dificuldade ? DIFICULDADE[service.nivel_dificuldade] : undefined
  const faixa = service.tempo_minimo || service.tempo_maximo
    ? [service.tempo_minimo, service.tempo_maximo].filter(Boolean).join(' a ')
    : null

  const handleDelete = async () => {
    await deleteService.mutateAsync(service.id)
    setConfirmDelete(false)
    onDeleted()
  }

  const box = 'rounded-xl border border-border/70 bg-card px-4 py-3.5'
  const boxTitle = 'mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground'
  const muted = 'text-muted-foreground'

  return (
    <div key={service.id} className="cli-det px-4 py-5 sm:px-7 sm:py-7">
      {onBack && (
        <button type="button" onClick={onBack}
          className="mb-4 -ml-1 inline-flex min-h-11 items-center lg:hidden gap-2 rounded-md px-1 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-[#C8714A]">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Serviços
        </button>
      )}

      {/* cabeçalho */}
      <div className="flex items-center gap-4">
        <span className="flex h-15 w-15 shrink-0 items-center justify-center rounded-2xl bg-[#C8714A]/15 text-[#8A4B2C] dark:text-[#E39B78]" aria-hidden="true">
          <Scissors className="h-6 w-6" strokeWidth={1.6} />
        </span>
        <div className="min-w-0">
          <h2 className="truncate font-serif-display text-[30px] leading-[1.05] text-foreground sm:text-[34px]">{service.nome}</h2>
          <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
            {service.categoria && <span>{service.categoria}</span>}
            {service.categoria && <span aria-hidden="true">·</span>}
            <span className={`inline-flex h-[22px] items-center gap-1.5 rounded-full px-2.5 text-[11.5px] font-semibold ${service.ativo ? 'bg-emerald-600/12 text-emerald-800 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${service.ativo ? 'bg-emerald-600' : 'bg-muted-foreground/60'}`} aria-hidden="true" />
              {service.ativo ? 'Ativo' : 'Inativo'}
            </span>
          </p>
        </div>
      </div>

      {/* ações */}
      <div className="mt-5 mb-6 flex flex-wrap gap-2">
        <button type="button" onClick={() => onEdit(service)}
          className="inline-flex min-h-11 items-center gap-2 rounded-[2px] bg-[#C8714A] px-5 text-[12.5px] font-medium uppercase tracking-[0.1em] text-[#FFF8F0] transition-colors hover:bg-[#B45E37] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8714A]">
          <Pencil className="h-4 w-4" aria-hidden="true" /> {preco === 0 ? 'Definir preço' : 'Editar'}
        </button>
        <button type="button" onClick={() => onDuplicate(service)} className="cli-ghost">
          <Copy className="h-4 w-4" aria-hidden="true" /> Duplicar
        </button>
        <button type="button" onClick={() => setHistoryOpen(true)} className="cli-ghost">
          <History className="h-4 w-4" aria-hidden="true" /> Histórico de preços
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="cli-ghost" style={{ paddingLeft: 12, paddingRight: 12 }} aria-label="Mais ações">
              <Ellipsis className="h-4 w-4" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem
              disabled={toggleStatus.isPending}
              onSelect={() => toggleStatus.mutate({ id: service.id, ativo: !service.ativo })}
              className="cursor-pointer">
              <Power className="mr-2 h-4 w-4" aria-hidden="true" /> {service.ativo ? 'Desativar serviço' : 'Ativar serviço'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setConfirmDelete(true)} className="cursor-pointer text-red-600 focus:text-red-600">
              <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" /> Excluir serviço
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* números */}
      <div className="mb-5 grid grid-cols-3 gap-2.5 sm:gap-3">
        <div className={box}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Preço</p>
          {preco > 0 ? (
            <p className="mt-1.5 pt-1 font-serif-display text-[19px] leading-none tabular-nums text-foreground sm:text-[26px]">{formatBRL(preco)}</p>
          ) : (
            <button type="button" onClick={() => onEdit(service)}
              className="mt-2 text-left text-[13.5px] font-semibold text-[#8A4B2C] hover:underline dark:text-[#E39B78]">
              Sem preço — definir
            </button>
          )}
        </div>
        <div className={box}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Vendas</p>
          <p className="mt-1.5 font-serif-display text-[30px] leading-none tabular-nums text-foreground">
            {isLoading ? <span className="inline-block h-6 w-10 animate-pulse rounded bg-muted" /> : data ? data.totalUses : '—'}
          </p>
        </div>
        <div className={box}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Receita</p>
          <p className="mt-1.5 pt-1 font-serif-display text-[19px] leading-none tabular-nums text-foreground sm:text-[26px]">
            {isLoading ? <span className="inline-block h-6 w-14 animate-pulse rounded bg-muted" /> : data ? formatBRL(Number(data.totalRevenue) || 0) : '—'}
          </p>
        </div>
      </div>

      {/* detalhes */}
      <div className="mb-5 grid gap-2.5 sm:grid-cols-2 sm:gap-3">
        <div className={`${box} sm:col-span-2`}>
          <h3 className={boxTitle}>Descrição</h3>
          <p className="whitespace-pre-line text-sm">{service.descricao || <span className={muted}>Sem descrição</span>}</p>
        </div>
        <div className={box}>
          <h3 className={boxTitle}>Tempo</h3>
          {service.tempo_estimado || faixa ? (
            <div className="space-y-1 text-sm">
              {service.tempo_estimado && (
                <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />{service.tempo_estimado}</p>
              )}
              {faixa && <p className={`${muted} text-[13px]`}>Varia de {faixa}</p>}
            </div>
          ) : <p className={`text-sm ${muted}`}>Não informado</p>}
        </div>
        <div className={box}>
          <h3 className={boxTitle}>Dificuldade</h3>
          {dif ? (
            <p className="flex items-center gap-2.5 text-sm">
              <Gauge className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span className="flex gap-1" aria-hidden="true">
                {[1, 2, 3].map((n) => (
                  <span key={n} className={`h-2 w-4 rounded-full ${n <= dif.dots ? 'bg-[#C8714A]' : 'bg-muted'}`} />
                ))}
              </span>
              {dif.label}
            </p>
          ) : <p className={`text-sm ${muted}`}>Não informada</p>}
        </div>
        <div className={`${box} sm:col-span-2`}>
          <h3 className={boxTitle}>
            Materiais
            {custo > 0 && (
              <span className="normal-case tracking-normal text-[13px] font-medium text-foreground">
                custo {formatBRL(custo)}{margem !== null && <> · <b className={margem < 30 ? 'text-[#8A4B2C] dark:text-[#E39B78]' : 'text-emerald-700 dark:text-emerald-300'}>margem {margem}%</b></>}
              </span>
            )}
          </h3>
          {materiais.length > 0 ? (
            <ul className="divide-y divide-dashed divide-border text-sm">
              {materiais.map((m, i) => (
                <li key={`${m.produto_nome}-${i}`} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0 truncate">{m.produto_nome}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {m.quantidade} {m.unidade}{m.preco_custo ? ` · ${formatBRL(m.preco_custo * m.quantidade)}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          ) : service.materiais ? (
            <p className="whitespace-pre-line text-sm">{service.materiais}</p>
          ) : <p className={`text-sm ${muted}`}>Nenhum material vinculado</p>}
        </div>
        {service.observacoes_tecnicas && (
          <div className={`${box} sm:col-span-2`}>
            <h3 className={boxTitle}>Observações técnicas</h3>
            <p className="whitespace-pre-line text-sm">{service.observacoes_tecnicas}</p>
          </div>
        )}
      </div>

      {/* últimas ordens */}
      <div className={box}>
        <h3 className={boxTitle}>Últimas ordens com este serviço</h3>
        {isLoading ? (
          <div className="space-y-2 py-1">{[0, 1, 2].map((i) => <div key={i} className="h-9 animate-pulse rounded bg-muted" />)}</div>
        ) : data && data.items.length > 0 ? (
          <ul className="divide-y divide-dashed divide-border">
            {data.items.slice(0, 8).map((it) => {
              const st = STATUS[it.order.status] ?? { label: it.order.status, cls: 'bg-muted text-muted-foreground' }
              return (
                <li key={it.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1 py-2.5 text-sm sm:grid-cols-[80px_1fr_auto_auto]">
                  <b className="tabular-nums">#{String(it.order.numero).padStart(6, '0')}</b>
                  <span className="min-w-0 truncate text-[13px] text-muted-foreground">
                    {formatDayMonthYear(it.order.data_abertura ?? it.created_at, true)}{it.order.client?.nome ? ` · ${it.order.client.nome}` : ''}
                  </span>
                  <span className={`inline-flex h-[22px] items-center rounded-full px-2.5 text-[11.5px] font-semibold ${st.cls}`}>{st.label}</span>
                  <span className="col-start-3 text-right font-semibold tabular-nums sm:col-start-auto">{formatBRL(Number(it.valor_total) || 0)}</span>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Este serviço ainda não entrou em nenhuma ordem.</p>
        )}
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {service.nome}?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete().catch(() => { /* o hook já mostra o erro */ }) }}
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={deleteService.isPending}
            >
              {deleteService.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {historyOpen && (
        <ServicePriceHistory
          serviceId={service.id}
          serviceName={service.nome}
          open={historyOpen}
          onOpenChange={setHistoryOpen}
        />
      )}
    </div>
  )
}
