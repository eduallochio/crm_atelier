'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ArrowLeft, Ban, Banknote, Check, Ellipsis, Eye, Landmark, Mail, MessageCircle, Phone, Play, Printer,
  RotateCcw, Send, Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useDeleteServiceOrder, useUpdateServiceOrder } from '@/hooks/use-service-orders'
import { useCreateOrderNote, useOrderHistory, useOrderNotes } from '@/hooks/use-order-notes'
import { useOrganizationSettings } from '@/hooks/use-settings'
import { useActivePaymentMethods } from '@/hooks/use-payment-methods'
import { generateThermalPDF } from '@/lib/utils/thermal-printer'
import type { ServiceOrder, ServiceOrderHistory, ServiceOrderNote } from '@/lib/validations/service-order'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { OrderPreviewDialog } from './order-preview-dialog'
import { formatBRL, formatDayMonthYear, initialsOf } from './client-utils'
import {
  ORDER_STATUS, deadlineLabel, isToReceive, numeroOS, saldoOf, notifyOrderReady, sendOrderWhatsApp,
  type OrderStatus,
} from './order-utils'

const STEPS: { key: OrderStatus; label: string }[] = [
  { key: 'pendente', label: 'Pendente' },
  { key: 'em_andamento', label: 'Em andamento' },
  { key: 'concluido', label: 'Concluída' },
]

const PAGAMENTO: Record<string, string> = { pago: 'Pago', parcial: 'Pago em parte', pendente: 'Aguardando pagamento' }

interface Props {
  order: ServiceOrder
  /** concluir (ou receber) — abre o diálogo de pagamento quando há saldo */
  onConclude: (order: ServiceOrder) => void
  onDeleted: () => void
  /** só no celular: volta para a lista */
  onBack?: () => void
}

/** Ficha da ordem: andamento, ações, valores, cliente, prazo, itens e histórico */
export function OrderDetail({ order, onConclude, onDeleted, onBack }: Props) {
  const updateOrder = useUpdateServiceOrder()
  const deleteOrder = useDeleteServiceOrder()
  const { data: org } = useOrganizationSettings()
  const { data: paymentMethods = [] } = useActivePaymentMethods()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [preview, setPreview] = useState(false)
  const [registering, setRegistering] = useState(false)

  const orgName = org?.name || 'Meu Atelier'
  const total = Number(order.valor_total) || 0
  const pago = Number(order.valor_pago) || 0
  const saldo = saldoOf(order)
  const deadline = deadlineLabel(order)
  const cancelada = order.status === 'cancelado'
  const tel = order.client?.telefone
  const stepIndex = STEPS.findIndex((s) => s.key === order.status)

  const setStatus = (status: OrderStatus) => {
    if (status === order.status) return
    if (status === 'concluido' && saldo > 0) { onConclude(order); return }
    updateOrder.mutate({ id: order.id, input: { status } })
  }

  const printPDF = () => {
    try { generateThermalPDF(order, orgName); toast.success('PDF gerado!') } catch { toast.error('Erro ao gerar PDF') }
  }

  const registerInCashier = async () => {
    setRegistering(true)
    try {
      const res = await fetch(`/api/orders/${order.id}/register-cashier`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Erro ao lançar no caixa'); return }
      toast.success('OS lançada no caixa com sucesso!')
    } catch {
      toast.error('Erro ao lançar no caixa')
    } finally {
      setRegistering(false)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteOrder.mutateAsync(order.id)
      setConfirmDelete(false)
      onDeleted()
    } catch { /* o hook já mostra o erro */ }
  }

  // ação principal muda com o momento da ordem
  const primary =
    order.status === 'pendente' ? { label: 'Iniciar', icon: Play, run: () => setStatus('em_andamento') }
    : order.status === 'em_andamento' ? { label: 'Concluir', icon: Check, run: () => setStatus('concluido') }
    : isToReceive(order) ? { label: 'Registrar pagamento', icon: Banknote, run: () => onConclude(order) }
    : order.status === 'concluido' && tel ? { label: 'Avisar que está pronta', icon: Send, run: () => notifyOrderReady(order) }
    : cancelada ? { label: 'Reabrir ordem', icon: RotateCcw, run: () => setStatus('pendente') }
    : null

  const box = 'rounded-xl border border-border/70 bg-card px-4 py-3.5'
  const boxTitle = 'mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground'
  const desconto = Number(order.desconto_valor) || 0
  const itemsTotal = (order.items ?? []).reduce((s, i) => s + (Number(i.valor_total) || 0), 0)

  return (
    <div key={order.id} className="cli-det px-4 py-5 sm:px-7 sm:py-7">
      {onBack && (
        <button type="button" onClick={onBack}
          className="mb-4 -ml-1 inline-flex min-h-11 items-center lg:hidden gap-2 rounded-md px-1 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-[#C8714A]">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Ordens
        </button>
      )}

      {/* cabeçalho */}
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Ordem de serviço</p>
          <h2 className="font-serif-display text-[34px] leading-[1.05] tabular-nums text-foreground sm:text-[40px]">{numeroOS(order.numero)}</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {order.client?.nome || 'Cliente não informado'} · aberta em {formatDayMonthYear(order.data_abertura)}
          </p>
        </div>
        {deadline && (
          <span className={`inline-flex h-7 items-center rounded-full px-3 text-[12.5px] font-semibold ${
            deadline.tone === 'late' ? 'bg-red-600/12 text-red-700 dark:text-red-400'
            : deadline.tone === 'soon' ? 'bg-[#C8714A]/15 text-[#8A4B2C] dark:text-[#E39B78]'
            : 'bg-muted text-muted-foreground'}`}>
            {deadline.text}
          </span>
        )}
      </div>

      {/* andamento: linha pespontada entre as etapas */}
      {cancelada ? (
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
          <Ban className="h-4 w-4" aria-hidden="true" /> Esta ordem foi cancelada.
        </div>
      ) : (
        <ol className="ord-steps mt-5" aria-label="Andamento da ordem">
          {STEPS.map((s, i) => {
            const state = i < stepIndex ? 'done' : i === stepIndex ? 'now' : 'next'
            return (
              <li key={s.key} data-state={state}>
                <button type="button" onClick={() => setStatus(s.key)} disabled={updateOrder.isPending || state === 'now'}
                  aria-current={state === 'now' ? 'step' : undefined}
                  title={state === 'now' ? undefined : `Mudar para ${s.label.toLowerCase()}`}>
                  <span className="ord-dot" aria-hidden="true">{state === 'done' && <Check className="h-3 w-3" strokeWidth={3} />}</span>
                  {s.label}
                </button>
              </li>
            )
          })}
        </ol>
      )}

      {/* ações */}
      <div className="mt-5 mb-6 flex flex-wrap gap-2">
        {primary && (
          <button type="button" onClick={primary.run} disabled={updateOrder.isPending}
            className="inline-flex min-h-11 items-center gap-2 rounded-[2px] bg-[#C8714A] px-5 text-[12.5px] font-medium uppercase tracking-[0.1em] text-[#FFF8F0] transition-colors hover:bg-[#B45E37] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8714A]">
            <primary.icon className="h-4 w-4" aria-hidden="true" /> {primary.label}
          </button>
        )}
        {tel && (
          <button type="button" onClick={() => sendOrderWhatsApp(order, orgName)} className="cli-ghost">
            <MessageCircle className="h-4 w-4" aria-hidden="true" /> Enviar OS
          </button>
        )}
        <button type="button" onClick={printPDF} className="cli-ghost">
          <Printer className="h-4 w-4" aria-hidden="true" /> Imprimir
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="cli-ghost" style={{ paddingLeft: 12, paddingRight: 12 }} aria-label="Mais ações">
              <Ellipsis className="h-4 w-4" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onSelect={() => setPreview(true)} className="cursor-pointer">
              <Eye className="mr-2 h-4 w-4" aria-hidden="true" /> Visualizar comprovante
            </DropdownMenuItem>
            {order.status === 'concluido' && tel && primary?.label !== 'Avisar que está pronta' && (
              <DropdownMenuItem onSelect={() => notifyOrderReady(order)} className="cursor-pointer">
                <Send className="mr-2 h-4 w-4" aria-hidden="true" /> Avisar que está pronta
              </DropdownMenuItem>
            )}
            {order.status === 'concluido' && order.status_pagamento === 'pago' && (
              <DropdownMenuItem onSelect={registerInCashier} disabled={registering} className="cursor-pointer">
                <Landmark className="mr-2 h-4 w-4" aria-hidden="true" /> Lançar no caixa
              </DropdownMenuItem>
            )}
            {(order.status === 'pendente' || order.status === 'em_andamento') && (
              <DropdownMenuItem onSelect={() => setConfirmCancel(true)} className="cursor-pointer">
                <Ban className="mr-2 h-4 w-4" aria-hidden="true" /> Cancelar ordem
              </DropdownMenuItem>
            )}
            {order.status === 'concluido' && (
              <DropdownMenuItem onSelect={() => setStatus('em_andamento')} className="cursor-pointer">
                <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" /> Voltar para em andamento
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setConfirmDelete(true)} className="cursor-pointer text-red-600 focus:text-red-600">
              <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" /> Excluir ordem
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* valores */}
      <div className="mb-2 grid grid-cols-3 gap-2.5 sm:gap-3">
        {[
          { l: 'Total', v: formatBRL(total) },
          { l: 'Pago', v: formatBRL(pago) },
          { l: 'Saldo', v: formatBRL(saldo), accent: saldo > 0 && !cancelada },
        ].map((s) => (
          <div key={s.l} className={box}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{s.l}</p>
            <p className={`mt-1.5 pt-1 font-serif-display text-[19px] leading-none tabular-nums sm:text-[26px] ${s.accent ? 'text-[#C8714A]' : 'text-foreground'}`}>{s.v}</p>
          </div>
        ))}
      </div>
      <p className="mb-5 flex flex-wrap items-center gap-x-2 text-[13px] text-muted-foreground">
        <span className={`h-1.5 w-1.5 rounded-full ${order.status_pagamento === 'pago' ? 'bg-emerald-600' : 'bg-[#D4A85A]'}`} aria-hidden="true" />
        {PAGAMENTO[order.status_pagamento] ?? order.status_pagamento}
        {order.forma_pagamento && <span>· {paymentMethods.find((m) => m.code === order.forma_pagamento)?.name ?? order.forma_pagamento}</span>}
        {isToReceive(order) && (
          <button type="button" onClick={() => onConclude(order)} className="font-semibold text-[#8A4B2C] hover:underline dark:text-[#E39B78]">
            · registrar pagamento
          </button>
        )}
      </p>

      {/* cliente e prazo */}
      <div className="mb-5 grid gap-2.5 sm:grid-cols-2 sm:gap-3">
        <div className={box}>
          <h3 className={boxTitle}>Cliente</h3>
          {order.client ? (
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#C8714A]/15 text-[12px] font-semibold text-[#8A4B2C] dark:text-[#E39B78]" aria-hidden="true">
                {initialsOf(order.client.nome)}
              </span>
              <div className="min-w-0 space-y-1 text-sm">
                <p className="font-semibold">{order.client.nome}</p>
                {tel && <p className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3.5 w-3.5" aria-hidden="true" />{tel}</p>}
                {order.client.email && <p className="flex items-center gap-2 break-all text-muted-foreground"><Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />{order.client.email}</p>}
              </div>
            </div>
          ) : <p className="text-sm text-muted-foreground">Cliente não informado</p>}
        </div>
        <div className={box}>
          <h3 className={boxTitle}>Prazo</h3>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Abertura</dt><dd>{formatDayMonthYear(order.data_abertura)}</dd>
            <dt className="text-muted-foreground">Previsão</dt><dd>{formatDayMonthYear(order.data_prevista)}</dd>
            {order.data_conclusao && <><dt className="text-muted-foreground">Conclusão</dt><dd className="text-emerald-700 dark:text-emerald-300">{formatDayMonthYear(order.data_conclusao)}</dd></>}
          </dl>
        </div>
      </div>

      {/* itens */}
      <div className={`${box} mb-5`}>
        <h3 className={boxTitle}>Serviços</h3>
        {order.items && order.items.length > 0 ? (
          <>
            <ul className="divide-y divide-dashed divide-border">
              {order.items.map((it) => (
                <li key={it.id} className="flex items-start justify-between gap-3 py-2.5 text-sm">
                  <span className="min-w-0">
                    <span className="block">{it.service_nome}</span>
                    {it.observacoes && <span className="block text-[12.5px] text-muted-foreground">{it.observacoes}</span>}
                  </span>
                  <span className="shrink-0 text-right tabular-nums">
                    <span className="block font-semibold">{formatBRL(Number(it.valor_total) || 0)}</span>
                    {Number(it.quantidade) > 1 && <span className="block text-[12px] text-muted-foreground">{it.quantidade} × {formatBRL(Number(it.valor_unitario) || 0)}</span>}
                  </span>
                </li>
              ))}
            </ul>
            {desconto > 0 && (
              <div className="mt-1 space-y-1 border-t border-border pt-2.5 text-sm tabular-nums">
                <p className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatBRL(itemsTotal)}</span></p>
                <p className="flex justify-between text-muted-foreground"><span>Desconto</span><span>− {formatBRL(desconto)}</span></p>
                <p className="flex justify-between font-semibold"><span>Total</span><span>{formatBRL(total)}</span></p>
              </div>
            )}
          </>
        ) : <p className="text-sm text-muted-foreground">Nenhum serviço nesta ordem.</p>}
      </div>

      {(order.observacoes || order.notas_internas) && (
        <div className="mb-5 grid gap-2.5 sm:grid-cols-2 sm:gap-3">
          {order.observacoes && (
            <div className={`${box} ${order.notas_internas ? '' : 'sm:col-span-2'}`}>
              <h3 className={boxTitle}>Observações</h3>
              <p className="whitespace-pre-line text-sm">{order.observacoes}</p>
            </div>
          )}
          {order.notas_internas && (
            <div className={`${box} ${order.observacoes ? '' : 'sm:col-span-2'}`}>
              <h3 className={boxTitle}>Notas internas</h3>
              <p className="whitespace-pre-line text-sm">{order.notas_internas}</p>
            </div>
          )}
        </div>
      )}

      <OrderActivity orderId={order.id} />

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar a ordem {numeroOS(order.numero)}?</AlertDialogTitle>
            <AlertDialogDescription>A ordem fica marcada como cancelada. Você pode reabri-la depois.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={() => updateOrder.mutate({ id: order.id, input: { status: 'cancelado' } })}>
              Cancelar ordem
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir a ordem {numeroOS(order.numero)}?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta ordem de serviço? Esta ação não pode ser desfeita e todos os itens serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete() }}
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={deleteOrder.isPending}
            >
              {deleteOrder.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <OrderPreviewDialog open={preview} onOpenChange={setPreview} order={order} organizationName={orgName} showConfirmButton={false} />
    </div>
  )
}

/** status gravado como "em_andamento" vira "Em andamento" no histórico */
function readable(field: string, value: string | null) {
  if (!value) return value
  if (field === 'status' && value in ORDER_STATUS) return ORDER_STATUS[value as OrderStatus].label
  return value
}

type Activity =
  | { id: string; kind: 'note'; user: string; date: string; text: string }
  | { id: string; kind: 'change'; user: string; date: string; field: string; from: string | null; to: string | null }

/** notas e alterações da ordem, mais recentes primeiro */
function OrderActivity({ orderId }: { orderId: string }) {
  const [nota, setNota] = useState('')
  const { data: notes = [] } = useOrderNotes(orderId)
  const { data: history = [] } = useOrderHistory(orderId)
  const createNote = useCreateOrderNote()

  const items: Activity[] = [
    ...(notes as ServiceOrderNote[]).map((n) => ({ id: n.id, kind: 'note' as const, user: n.user_email, date: n.created_at, text: n.nota })),
    ...(history as ServiceOrderHistory[]).map((h) => ({
      id: h.id, kind: 'change' as const, user: h.user_email, date: h.created_at, field: h.campo_alterado, from: h.valor_anterior, to: h.valor_novo,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const submit = async () => {
    const text = nota.trim()
    if (!text) return
    try {
      await createNote.mutateAsync({ orderId, nota: text })
      setNota('')
    } catch { /* o hook já mostra o erro */ }
  }

  return (
    <div className="rounded-xl border border-border/70 bg-card px-4 py-3.5">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Notas e histórico</h3>
      <div className="flex gap-2">
        <label htmlFor={`nota-${orderId}`} className="sr-only">Nova nota</label>
        <textarea id={`nota-${orderId}`} value={nota} onChange={(e) => setNota(e.target.value)} rows={2}
          placeholder="Escreva uma nota sobre esta ordem..."
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit() }}
          className="min-h-11 flex-1 resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-[#C8714A] focus:ring-3 focus:ring-[#C8714A]/15" />
        <button type="button" onClick={submit} disabled={!nota.trim() || createNote.isPending}
          className="cli-ghost self-start" aria-label="Adicionar nota">
          <Send className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">{createNote.isPending ? 'Enviando...' : 'Anotar'}</span>
        </button>
      </div>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Nenhum registro ainda.</p>
      ) : (
        <ol className="ord-feed mt-4">
          {items.map((it) => (
            <li key={it.id} data-kind={it.kind}>
              <p className="flex flex-wrap items-baseline justify-between gap-x-3 text-[12.5px] text-muted-foreground">
                <span className="truncate">{it.user}</span>
                <time dateTime={it.date}>{it.date ? format(new Date(it.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '—'}</time>
              </p>
              {it.kind === 'note' ? (
                <p className="mt-0.5 whitespace-pre-wrap text-sm">{it.text}</p>
              ) : (
                <p className="mt-0.5 text-sm">
                  Alterou <b className="font-semibold">{it.field}</b>
                  {it.from && <> de <span className="text-muted-foreground line-through decoration-[#C8714A]/60">{readable(it.field, it.from)}</span></>}
                  {' '}para <span className="font-medium text-[#8A4B2C] dark:text-[#E39B78]">{readable(it.field, it.to)}</span>
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

/** estilos das etapas e do histórico (somam ao MASTER_DETAIL_CSS) */
export const ORDER_CSS = `
.ord-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; list-style: none; padding: 0; }
.ord-steps li { position: relative; }
.ord-steps li + li::before { content: ''; position: absolute; top: 14px; right: calc(50% + 18px); left: calc(-50% + 18px); height: 2px;
  background: repeating-linear-gradient(90deg, var(--border) 0 6px, transparent 6px 10px); }
.ord-steps li[data-state="done"] + li::before, .ord-steps li[data-state="done"] + li[data-state="now"]::before { background: repeating-linear-gradient(90deg, #C8714A 0 6px, transparent 6px 10px); }
.ord-steps button { display: flex; width: 100%; flex-direction: column; align-items: center; gap: 6px; padding: 0 4px 2px; font-size: 12.5px; font-weight: 500; color: var(--muted-foreground); border-radius: 8px; }
.ord-steps button:not(:disabled):hover { color: var(--foreground); }
.ord-steps button:not(:disabled):hover .ord-dot { border-color: #C8714A; }
.ord-steps button:focus-visible { outline: 2px solid #C8714A; outline-offset: 2px; }
.ord-steps button:disabled { cursor: default; }
.ord-dot { display: flex; height: 28px; width: 28px; align-items: center; justify-content: center; border-radius: 50%; border: 2px dashed var(--border); background: var(--card); color: #FFF8F0; transition: border-color .15s; }
.ord-steps [data-state="done"] .ord-dot { border: 2px solid #C8714A; background: #C8714A; }
.ord-steps [data-state="now"] .ord-dot { border: 2px solid #C8714A; box-shadow: inset 0 0 0 5px var(--card); background: #C8714A; }
.ord-steps [data-state="now"] button { color: var(--foreground); font-weight: 600; }
.cli-row.items-start { align-items: flex-start; }
.ord-chip-late[aria-pressed="false"] { border-color: rgba(220,38,38,.45); color: #B91C1C; }
.dark .ord-chip-late[aria-pressed="false"] { color: #F87171; }
.ord-feed { list-style: none; padding: 0; margin: 0; }
.ord-feed li { position: relative; padding: 0 0 14px 20px; }
.ord-feed li::before { content: ''; position: absolute; left: 3px; top: 6px; height: 8px; width: 8px; border-radius: 50%; background: var(--border); }
.ord-feed li[data-kind="note"]::before { background: #C8714A; }
.ord-feed li:not(:last-child)::after { content: ''; position: absolute; left: 6px; top: 18px; bottom: 0; width: 2px;
  background: repeating-linear-gradient(180deg, var(--border) 0 4px, transparent 4px 7px); }
`
