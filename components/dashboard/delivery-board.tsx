'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Check, MessageCircle } from 'lucide-react'
import { useUpdateServiceOrder } from '@/hooks/use-service-orders'
import { useOrganizationSettings } from '@/hooks/use-settings'
import type { ServiceOrder } from '@/lib/validations/service-order'
import { OrderPaymentDialog } from './order-payment-dialog'
import { formatBRL } from './client-utils'
import { daysToDeadline, isOpen, numeroOS, saldoOf, sendOrderWhatsApp } from './order-utils'

const COLS = [
  { key: 'late', title: 'Atrasadas', test: (d: number) => d < 0 },
  { key: 'today', title: 'Hoje', test: (d: number) => d === 0 },
  { key: 'tomorrow', title: 'Amanhã', test: (d: number) => d === 1 },
  { key: 'next', title: 'Próximos dias', test: (d: number) => d >= 2 && d <= 7 },
] as const
const MAX = 4

/** Quadro das entregas em aberto por prazo; tocar numa ordem mostra Avisar e Concluir */
export function DeliveryBoard({ orders, isLoading }: { orders: ServiceOrder[]; isLoading: boolean }) {
  const update = useUpdateServiceOrder()
  const { data: org } = useOrganizationSettings()
  const [openId, setOpenId] = useState<string | null>(null)
  const [paying, setPaying] = useState<ServiceOrder | null>(null)

  const { cols, noDeadline } = useMemo(() => {
    const open = orders.filter(isOpen)
    const withD = open.map((o) => ({ o, d: daysToDeadline(o) })).filter((x): x is { o: ServiceOrder; d: number } => x.d !== null)
    return {
      cols: COLS.map((c) => ({ ...c, items: withD.filter((x) => c.test(x.d)).sort((a, b) => a.d - b.d) })),
      noDeadline: open.length - withD.length,
    }
  }, [orders])

  const conclude = (o: ServiceOrder) => {
    if (saldoOf(o) > 0) { setPaying(o); return }
    update.mutate({ id: o.id, input: { status: 'concluido' } })
  }

  return (
    <section aria-labelledby="dlv-h" className="fin-card px-4 py-4 sm:px-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="dlv-h" className="fin-cap">Entregas da semana</h2>
        <span className="flex items-center gap-3 text-[13px]">
          {noDeadline > 0 && <span className="hidden text-muted-foreground sm:inline">{noDeadline} em aberto sem prazo</span>}
          <Link href="/ordens-servico" className="font-semibold text-[#8A4B2C] hover:underline dark:text-[#E39B78]">Todas as ordens</Link>
        </span>
      </div>
      <div className="dlv-board">
        {cols.map((c) => (
          <section key={c.key} aria-label={c.title} className={`dlv-col ${c.key === 'late' ? 'is-late' : ''}`}>
            <h3 className="dlv-col-h"><span>{c.title}</span><span className="dlv-n">{isLoading ? '–' : c.items.length}</span></h3>
            {isLoading ? (
              <div className="h-24 animate-pulse rounded-lg bg-card/70" />
            ) : c.items.length === 0 ? (
              <p className="px-1.5 py-5 text-center text-[12.5px] text-muted-foreground">{c.key === 'late' ? 'Nada atrasado.' : 'Nada aqui.'}</p>
            ) : (
              <>
                {c.items.slice(0, MAX).map(({ o, d }) => {
                  const expanded = openId === o.id
                  const servicos = o.items?.map((i) => i.service_nome).join(' · ')
                  return (
                    <div key={o.id} className={`dlv-card ${expanded ? 'is-open' : ''}`}>
                      <button type="button" className="dlv-main" aria-expanded={expanded} onClick={() => setOpenId(expanded ? null : o.id)}>
                        <span className="flex justify-between gap-2 text-[12px] tabular-nums text-muted-foreground">
                          <span>{numeroOS(o.numero)}</span>{d < 0 && <span className="fin-late font-semibold">{-d} {d === -1 ? 'dia' : 'dias'}</span>}
                        </span>
                        <b className="mt-0.5 block truncate text-[14px] font-semibold">{o.client?.nome || 'Cliente não informado'}</b>
                        <span className="block truncate text-[12.5px] text-muted-foreground">{servicos || 'Sem serviços'}</span>
                        <span className="mt-2 flex items-center justify-between gap-2">
                          <span className={`dlv-pill ${o.status}`}>{o.status === 'pendente' ? 'Pendente' : 'Em andamento'}</span>
                          <span className="text-[13px] font-semibold tabular-nums">{formatBRL(Number(o.valor_total) || 0)}</span>
                        </span>
                      </button>
                      {expanded && (
                        <div className="dlv-more">
                          {o.client?.telefone && (
                            <button type="button" className="dlv-mini" onClick={() => sendOrderWhatsApp(o, org?.name || 'Meu Atelier')}>
                              <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />Avisar
                            </button>
                          )}
                          <button type="button" className="dlv-mini is-p" onClick={() => conclude(o)} disabled={update.isPending}>
                            <Check className="h-3.5 w-3.5" aria-hidden="true" />Concluir
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
                {c.items.length > MAX && (
                  <Link href="/ordens-servico" className="block px-1.5 pt-1 text-center text-[12.5px] font-semibold text-[#8A4B2C] hover:underline dark:text-[#E39B78]">
                    + {c.items.length - MAX} {c.items.length - MAX === 1 ? 'ordem' : 'ordens'}
                  </Link>
                )}
              </>
            )}
          </section>
        ))}
      </div>
      <OrderPaymentDialog order={paying} onClose={() => setPaying(null)} />
    </section>
  )
}

export const DELIVERY_CSS = `
.dlv-board { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(240px, 1fr); gap: 10px; overflow-x: auto; scrollbar-width: thin; padding-bottom: 2px; }
@media (min-width: 1024px) { .dlv-board { grid-auto-flow: row; grid-template-columns: repeat(4, 1fr); overflow: visible; } }
.dlv-col { min-height: 220px; border-radius: 12px; padding: 10px; background: color-mix(in oklab, #C8714A 7%, var(--muted)); }
.dlv-col.is-late { background: color-mix(in oklab, #DC2626 9%, var(--muted)); }
.dlv-col-h { display: flex; align-items: center; justify-content: space-between; padding: 2px 4px 8px; font-size: 11px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: var(--muted-foreground); }
.dlv-col.is-late .dlv-col-h { color: #B91C1C; } .dark .dlv-col.is-late .dlv-col-h { color: #F87171; }
.dlv-n { min-width: 20px; height: 20px; padding: 0 6px; border-radius: 10px; background: var(--card); color: var(--foreground); font-size: 11px; letter-spacing: 0; display: inline-flex; align-items: center; justify-content: center; }
.dlv-card { margin-bottom: 8px; border-radius: 10px; border: 1px solid color-mix(in oklab, var(--border) 80%, transparent); background: var(--card); transition: border-color .15s, box-shadow .15s; }
.dlv-card:hover { border-color: #D4A85A; }
.dlv-card.is-open { border-color: #C8714A; box-shadow: inset 0 0 0 1px #C8714A; }
.dlv-main { display: block; width: 100%; padding: 10px 11px; text-align: left; border-radius: 10px; }
.dlv-main:focus-visible, .dlv-mini:focus-visible { outline: 2px solid #C8714A; outline-offset: 2px; }
.dlv-pill { display: inline-flex; align-items: center; gap: 5px; height: 20px; padding: 0 8px; border-radius: 10px; font-size: 11px; font-weight: 600; white-space: nowrap; }
.dlv-pill::before { content: ''; width: 5px; height: 5px; border-radius: 50%; background: currentColor; }
.dlv-pill.pendente { background: rgba(212,168,90,.2); color: #7A5A1E; } .dark .dlv-pill.pendente { color: #E8C98A; }
.dlv-pill.em_andamento { background: rgba(200,113,74,.15); color: #8A4B2C; } .dark .dlv-pill.em_andamento { color: #E39B78; }
.dlv-more { display: flex; gap: 6px; margin: 0 11px 10px; padding-top: 9px; border-top: 1px dashed var(--border); }
.dlv-mini { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 5px; min-height: 34px; border-radius: 6px; border: 1px solid var(--border); background: var(--card); font-size: 12.5px; font-weight: 500; }
.dlv-mini:hover { border-color: #D4A85A; }
.dlv-mini.is-p { background: #C8714A; border-color: #C8714A; color: #FFF8F0; }
.dlv-mini.is-p:hover { background: #B45E37; }
.dlv-mini:disabled { opacity: .6; }
`
