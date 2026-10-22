'use client'

import { useState } from 'react'
import {
  ArrowLeft, Cake, Ellipsis, Mail, MapPin, MessageCircle, Pencil, Phone, Plus, Trash2,
} from 'lucide-react'
import { useClientOrders } from '@/hooks/use-client-stats'
import { useDeleteClient } from '@/hooks/use-clients'
import type { Client } from '@/lib/validations/client'
import { toast } from 'sonner'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  addressOf, birthdayLabel, formatBRL, formatDayMonthYear, initialsOf, isBirthdayThisMonth, openWhatsApp,
} from './client-utils'

const STATUS: Record<string, { label: string; cls: string }> = {
  pendente:     { label: 'Pendente',     cls: 'bg-[#D4A85A]/20 text-[#7A5A1E] dark:text-[#E8C98A]' },
  em_andamento: { label: 'Em andamento', cls: 'bg-[#C8714A]/15 text-[#8A4B2C] dark:text-[#E39B78]' },
  concluido:    { label: 'Concluída',    cls: 'bg-emerald-600/12 text-emerald-800 dark:text-emerald-300' },
  cancelado:    { label: 'Cancelada',    cls: 'bg-muted text-muted-foreground' },
}

interface Props {
  client: Client
  onEdit: (client: Client) => void
  onNewOrder: (client: Client) => void
  onDeleted: () => void
  /** só no celular: volta para a lista */
  onBack?: () => void
}

/** Ficha da cliente: ações, números, dados e histórico de ordens */
export function ClientDetail({ client, onEdit, onNewOrder, onDeleted, onBack }: Props) {
  const { data, isLoading } = useClientOrders(client.id)
  const deleteClient = useDeleteClient()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const address = addressOf(client)
  const bdayNow = isBirthdayThisMonth(client)

  const mapUrl = address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([address, client.cep].filter(Boolean).join(', '))}`
    : null

  const handleDelete = async () => {
    await deleteClient.mutateAsync(client.id)
    setConfirmDelete(false)
    onDeleted()
  }

  const box = 'rounded-xl border border-border/70 bg-card px-4 py-3.5'
  const boxTitle = 'mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground'

  return (
    <div key={client.id} className="cli-det px-4 py-5 sm:px-7 sm:py-7">
      {onBack && (
        <button type="button" onClick={onBack}
          className="mb-4 -ml-1 inline-flex min-h-11 items-center lg:hidden gap-2 rounded-md px-1 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-[#C8714A]">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Clientes
        </button>
      )}

      {/* cabeçalho */}
      <div className="flex items-center gap-4">
        <span className="flex h-15 w-15 shrink-0 items-center justify-center rounded-full bg-[#C8714A]/15 text-lg font-semibold text-[#8A4B2C] dark:text-[#E39B78]" aria-hidden="true">
          {initialsOf(client.nome)}
        </span>
        <div className="min-w-0">
          <h2 className="truncate font-serif-display text-[30px] leading-[1.05] text-foreground sm:text-[34px]">{client.nome}</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">Cliente desde {formatDayMonthYear(client.data_cadastro)}</p>
        </div>
      </div>

      {/* ações */}
      <div className="mt-5 mb-6 flex flex-wrap gap-2">
        <button type="button" onClick={() => onNewOrder(client)}
          className="inline-flex min-h-11 items-center gap-2 rounded-[2px] bg-[#C8714A] px-5 text-[12.5px] font-medium uppercase tracking-[0.1em] text-[#FFF8F0] transition-colors hover:bg-[#B45E37] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8714A]">
          <Plus className="h-4 w-4" aria-hidden="true" /> Nova ordem
        </button>
        {client.telefone && (
          <button type="button" onClick={() => openWhatsApp(client)} className="cli-ghost">
            <MessageCircle className="h-4 w-4" aria-hidden="true" /> WhatsApp
          </button>
        )}
        <button type="button" onClick={() => onEdit(client)} className="cli-ghost">
          <Pencil className="h-4 w-4" aria-hidden="true" /> Editar
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="cli-ghost" style={{ paddingLeft: 12, paddingRight: 12 }} aria-label="Mais ações">
              <Ellipsis className="h-4 w-4" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {mapUrl && (
              <DropdownMenuItem asChild>
                <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                  <MapPin className="mr-2 h-4 w-4" aria-hidden="true" /> Abrir no mapa
                </a>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={() => setConfirmDelete(true)} className="cursor-pointer text-red-600 focus:text-red-600">
              <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" /> Excluir cliente
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* números */}
      <div className="mb-5 grid grid-cols-3 gap-2.5 sm:gap-3">
        {[
          { l: 'Ordens', v: data ? String(data.stats.totalOrders) : '—' },
          { l: 'Em aberto', v: data ? String(data.stats.openOrders) : '—', accent: !!data?.stats.openOrders },
          { l: 'Total gasto', v: data ? formatBRL(Number(data.stats.totalSpent) || 0) : '—', small: true },
        ].map((s) => (
          <div key={s.l} className={box}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{s.l}</p>
            <p className={`mt-1.5 font-serif-display tabular-nums leading-none ${s.small ? 'text-[19px] sm:text-[26px] pt-1' : 'text-[30px]'} ${s.accent ? 'text-[#C8714A]' : 'text-foreground'}`}>
              {isLoading ? <span className="inline-block h-6 w-10 animate-pulse rounded bg-muted" /> : s.v}
            </p>
          </div>
        ))}
      </div>

      {/* dados */}
      <div className="mb-5 grid gap-2.5 sm:grid-cols-2 sm:gap-3">
        <div className={box}>
          <h3 className={boxTitle}>Contato</h3>
          <div className="space-y-1.5 text-sm">
            {client.telefone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" aria-hidden="true" />{client.telefone}</p>}
            {client.email && <p className="flex items-center gap-2 break-all"><Mail className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />{client.email}</p>}
            {!client.telefone && !client.email && <p className="text-muted-foreground">Sem contato cadastrado</p>}
          </div>
        </div>
        <div className={box}>
          <h3 className={boxTitle}>
            Endereço
            {mapUrl && (
              <a href={mapUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 normal-case tracking-normal text-[13px] font-semibold text-[#8A4B2C] hover:underline dark:text-[#E39B78]">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> Mapa
              </a>
            )}
          </h3>
          <p className="text-sm">{address || <span className="text-muted-foreground">Não informado</span>}</p>
        </div>
        <div className={box}>
          <h3 className={boxTitle}>Aniversário</h3>
          <p className="flex items-center gap-2 text-sm">
            {client.data_nascimento ? (
              <>
                {bdayNow && <Cake className="h-4 w-4 text-[#C8714A]" aria-hidden="true" />}
                <span className={bdayNow ? 'font-semibold text-[#8A4B2C] dark:text-[#E39B78]' : ''}>{birthdayLabel(client)}</span>
                {bdayNow && <span className="text-muted-foreground">· este mês</span>}
              </>
            ) : <span className="text-muted-foreground">Não informado</span>}
          </p>
        </div>
        <div className={box}>
          <h3 className={boxTitle}>Observações</h3>
          <p className="whitespace-pre-line text-sm">{client.observacoes || <span className="text-muted-foreground">Nenhuma</span>}</p>
        </div>
      </div>

      {/* histórico */}
      <div className={box}>
        <h3 className={boxTitle}>Histórico de ordens</h3>
        {isLoading ? (
          <div className="space-y-2 py-1">{[0, 1, 2].map((i) => <div key={i} className="h-9 animate-pulse rounded bg-muted" />)}</div>
        ) : data && data.orders.length > 0 ? (
          <ul className="divide-y divide-dashed divide-border">
            {data.orders.map((o) => {
              const st = STATUS[o.status] ?? { label: o.status, cls: 'bg-muted text-muted-foreground' }
              const servicos = o.items?.map((i) => i.service_nome).join(' · ')
              return (
                <li key={o.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1 py-2.5 text-sm sm:grid-cols-[80px_1fr_auto_auto]">
                  <b className="tabular-nums">#{String(o.numero).padStart(6, '0')}</b>
                  <span className="min-w-0 truncate text-[13px] text-muted-foreground">
                    {o.data_abertura ? formatDayMonthYear(o.data_abertura, true) : '—'}{servicos ? ` · ${servicos}` : ''}
                  </span>
                  <span className={`inline-flex h-[22px] items-center rounded-full px-2.5 text-[11.5px] font-semibold ${st.cls}`}>{st.label}</span>
                  <span className="col-start-3 text-right font-semibold tabular-nums sm:col-start-auto">{formatBRL(Number(o.valor_total) || 0)}</span>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhuma ordem ainda.{' '}
            <button type="button" onClick={() => onNewOrder(client)} className="font-semibold text-[#8A4B2C] hover:underline dark:text-[#E39B78]">
              Criar a primeira
            </button>
          </p>
        )}
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {client.nome}?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete().catch(() => toast.error('Não foi possível excluir.')) }}
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={deleteClient.isPending}
            >
              {deleteClient.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

