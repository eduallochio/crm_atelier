import { toast } from 'sonner'
import type { ServiceOrder } from '@/lib/validations/service-order'
import { generateWhatsAppText } from '@/lib/utils/thermal-printer'

export type OrderStatus = ServiceOrder['status']

export const ORDER_STATUS: Record<OrderStatus, { label: string; cls: string; dot: string }> = {
  pendente:     { label: 'Pendente',     cls: 'bg-[#D4A85A]/20 text-[#7A5A1E] dark:text-[#E8C98A]',    dot: 'bg-[#D4A85A]' },
  em_andamento: { label: 'Em andamento', cls: 'bg-[#C8714A]/15 text-[#8A4B2C] dark:text-[#E39B78]',    dot: 'bg-[#C8714A]' },
  concluido:    { label: 'Concluída',    cls: 'bg-emerald-600/12 text-emerald-800 dark:text-emerald-300', dot: 'bg-emerald-600' },
  cancelado:    { label: 'Cancelada',    cls: 'bg-muted text-muted-foreground',                        dot: 'bg-muted-foreground/60' },
}

export const numeroOS = (n: number) => `#${String(n).padStart(6, '0')}`

/** "2026-10-15" ou ISO → Date local à meia-noite (sem pular dia por fuso) */
export function parseLocalDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null
}

function today() {
  const t = new Date()
  t.setHours(0, 0, 0, 0)
  return t
}

export const isOpen = (o: ServiceOrder) => o.status === 'pendente' || o.status === 'em_andamento'

/** dias até a previsão (negativo = atrasada); null se não há previsão */
export function daysToDeadline(o: ServiceOrder): number | null {
  const d = parseLocalDate(o.data_prevista)
  return d ? Math.round((d.getTime() - today().getTime()) / 86_400_000) : null
}

export function isOverdue(o: ServiceOrder) {
  const d = daysToDeadline(o)
  return isOpen(o) && d !== null && d < 0
}

export const saldoOf = (o: ServiceOrder) =>
  Math.max(0, (Number(o.valor_total) || 0) - (Number(o.valor_pago) || 0))

/** concluída e ainda com saldo em aberto */
export const isToReceive = (o: ServiceOrder) =>
  o.status === 'concluido' && o.status_pagamento !== 'pago' && saldoOf(o) > 0

/** "Atrasada 3 dias", "Entrega hoje", "Entrega em 2 dias" — só para ordens em aberto */
export function deadlineLabel(o: ServiceOrder): { text: string; tone: 'late' | 'soon' | 'ok' } | null {
  if (!isOpen(o)) return null
  const d = daysToDeadline(o)
  if (d === null) return null
  if (d < 0) return { text: `Atrasada ${-d} ${d === -1 ? 'dia' : 'dias'}`, tone: 'late' }
  if (d === 0) return { text: 'Entrega hoje', tone: 'soon' }
  if (d === 1) return { text: 'Entrega amanhã', tone: 'soon' }
  return { text: `Entrega em ${d} dias`, tone: d <= 3 ? 'soon' : 'ok' }
}

function phoneOf(o: ServiceOrder) {
  if (!o.client?.telefone) {
    toast.error('Cliente não possui telefone cadastrado')
    return null
  }
  const tel = o.client.telefone.replace(/\D/g, '')
  return tel.startsWith('55') ? tel : `55${tel}`
}

/** manda a OS completa por WhatsApp */
export function sendOrderWhatsApp(o: ServiceOrder, orgName = 'Meu Atelier') {
  const tel = phoneOf(o)
  if (!tel) return
  const msg = generateWhatsAppText(o, orgName)
  window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`, '_blank')
}

/** avisa a cliente que a ordem está pronta para retirada (mesmo texto de antes) */
export function notifyOrderReady(o: ServiceOrder) {
  const tel = phoneOf(o)
  if (!tel) return
  const msg =
    `Olá ${o.client?.nome}!\n\n` +
    `Temos uma ótima notícia!\n\n` +
    `Sua ordem de serviço *${numeroOS(o.numero)}* foi concluída e está pronta para retirada!\n\n` +
    `Aguardamos seu contato para combinar a entrega.\n\n` +
    `Qualquer dúvida, estamos à disposição!`
  window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`, '_blank')
}
