'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Banknote, Check, MessageCircle } from 'lucide-react'
import type { ServiceOrder } from '@/lib/validations/service-order'
import { formatBRL } from './client-utils'
import { isToReceive, notifyOrderReady, numeroOS, saldoOf } from './order-utils'
import { OrderPaymentDialog } from './order-payment-dialog'

const DAYS = 14
const MAX = 6
const KEY = 'ma-ordens-avisadas'

/** dias inteiros entre a data (local) e hoje; 0 = hoje */
function daysAgo(value: string | null | undefined) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  const a = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const t = new Date(); const b = new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime()
  return Math.round((b - a) / 86_400_000)
}
const agoLabel = (n: number) => (n <= 0 ? 'hoje' : n === 1 ? 'ontem' : `há ${n} dias`)

/** quem já foi avisada fica guardado neste navegador (id da ordem → data do aviso) */
function readNotified(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}

/** Ordens concluídas nos últimos dias, prontas para a cliente buscar: avisar pelo WhatsApp e receber o saldo */
export function ReadyOrders({ orders, isLoading }: { orders: ServiceOrder[]; isLoading: boolean }) {
  const [notified, setNotified] = useState<Record<string, string>>(readNotified)
  const [paying, setPaying] = useState<ServiceOrder | null>(null)

  const { list, total } = useMemo(() => {
    const done = orders
      .filter((o) => o.status === 'concluido')
      .map((o) => ({ o, ago: daysAgo(o.data_conclusao) }))
      .filter((x): x is { o: ServiceOrder; ago: number } => x.ago !== null && x.ago <= DAYS)
      .sort((a, b) => a.ago - b.ago || (b.o.numero ?? 0) - (a.o.numero ?? 0))
    return { list: done.slice(0, MAX), total: done.length }
  }, [orders])

  const avisar = (o: ServiceOrder) => {
    if (!o.client?.telefone) { notifyOrderReady(o); return } // mostra o aviso de "sem telefone"
    notifyOrderReady(o)
    const next = { ...notified, [o.id]: new Date().toISOString() }
    // guarda só os últimos 200 avisos para não crescer sem fim
    const trimmed = Object.fromEntries(Object.entries(next).sort((a, b) => b[1].localeCompare(a[1])).slice(0, 200))
    setNotified(trimmed)
    try { localStorage.setItem(KEY, JSON.stringify(trimmed)) } catch { /* storage bloqueado: só não lembra */ }
  }

  return (
    <section aria-labelledby="ready-h" className="fin-card px-4 py-4 sm:px-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <div>
          <h2 id="ready-h" className="fin-cap">Prontas para entregar</h2>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">Concluídas nos últimos {DAYS} dias: avise a cliente que pode buscar.</p>
        </div>
        <Link href="/ordens-servico" className="text-[13px] font-semibold text-[#8A4B2C] hover:underline dark:text-[#E39B78]">
          {total > MAX ? `Ver as ${total} concluídas` : 'Todas as ordens'}
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-[118px] animate-pulse rounded-[10px] bg-muted" />)}
        </div>
      ) : list.length === 0 ? (
        <p className="rounded-[10px] border border-dashed border-border px-4 py-6 text-center text-[13.5px] text-muted-foreground">
          Nenhuma ordem concluída nos últimos {DAYS} dias.
        </p>
      ) : (
        <ul className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {list.map(({ o, ago }) => {
            const servicos = o.items?.map((i) => i.service_nome).join(' · ')
            const receber = isToReceive(o)
            const avisadaEm = notified[o.id] ? daysAgo(notified[o.id]) : null
            const tel = !!o.client?.telefone
            return (
              <li key={o.id} className="dlv-card flex flex-col" style={{ marginBottom: 0 }}>
                <div className="px-[11px] pt-2.5 pb-2">
                  <span className="flex justify-between gap-2 text-[12px] tabular-nums text-muted-foreground">
                    <span>{numeroOS(o.numero)}</span><span>concluída {agoLabel(ago)}</span>
                  </span>
                  <b className="mt-0.5 block truncate text-[14px] font-semibold">{o.client?.nome || 'Cliente não informado'}</b>
                  <span className="block truncate text-[12.5px] text-muted-foreground">{servicos || 'Sem serviços'}</span>
                  <span className="mt-2 flex items-center justify-between gap-2">
                    {receber ? (
                      <span className="dlv-pill pendente">a receber {formatBRL(saldoOf(o))}</span>
                    ) : (
                      <span className="dlv-pill ready-paid">paga</span>
                    )}
                    <span className="text-[13px] font-semibold tabular-nums">{formatBRL(Number(o.valor_total) || 0)}</span>
                  </span>
                </div>
                <div className="dlv-more mt-auto">
                  {tel ? (
                    <button type="button" className={`dlv-mini ${avisadaEm === null ? 'is-p' : ''}`} onClick={() => avisar(o)}
                      title={avisadaEm !== null ? `Avisada ${agoLabel(avisadaEm)} — enviar de novo` : 'Avisar pelo WhatsApp que está pronta'}>
                      {avisadaEm !== null
                        ? <><Check className="h-3.5 w-3.5" aria-hidden="true" />Avisada {agoLabel(avisadaEm)}</>
                        : <><MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />{receber ? 'Avisar' : 'Avisar que está pronta'}</>}
                    </button>
                  ) : (
                    <span className="flex flex-1 items-center justify-center text-[12px] text-muted-foreground">sem telefone cadastrado</span>
                  )}
                  {receber && (
                    <button type="button" className="dlv-mini" onClick={() => setPaying(o)}>
                      <Banknote className="h-3.5 w-3.5" aria-hidden="true" />Receber
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <OrderPaymentDialog order={paying} onClose={() => setPaying(null)} />
    </section>
  )
}

export const READY_CSS = `
.dlv-pill.ready-paid { background: rgba(5,150,105,.12); color: #047857; } .dark .dlv-pill.ready-paid { color: #6EE7B7; }
`
