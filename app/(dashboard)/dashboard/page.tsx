'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Cake, Lock, LockOpen, Package, Plus, UserPlus, UserX, Wallet } from 'lucide-react'
import { ClientDialog } from '@/components/forms/client-dialog'
import { ServiceOrderDialog } from '@/components/forms/service-order-dialog'
import { GlobalSearch } from '@/components/dashboard/global-search'
import { DeliveryBoard, DELIVERY_CSS } from '@/components/dashboard/delivery-board'
import { RevenueGoal, REVENUE_CSS } from '@/components/dashboard/revenue-goal'
import { ReadyOrders, READY_CSS } from '@/components/dashboard/ready-orders'
import { SubscriptionCard, SUBSCRIPTION_CSS } from '@/components/dashboard/subscription-card'
import { MASTER_DETAIL_CSS } from '@/components/dashboard/master-detail-css'
import { formatBRL } from '@/components/dashboard/client-utils'
import { isOpen, daysToDeadline, isToReceive } from '@/components/dashboard/order-utils'
import { FIN_CSS, timeOf, todayISO } from '@/components/financeiro/finance-ui'
import { sessionTotals } from '@/components/financeiro/cash-drawer'
import { useServiceOrders } from '@/hooks/use-service-orders'
import { useClients } from '@/hooks/use-clients'
import { useCashierMovements, useCashierSessions, useCloseCashier } from '@/hooks/use-cashier'
import { OpenCashierDialog } from '@/components/financeiro/open-cashier-dialog'
import { CloseCashierDialog } from '@/components/financeiro/close-cashier-dialog'
import { useProducts } from '@/hooks/use-inventory'
import { isLow } from '@/components/inventory/stock-ui'
import type { Activity } from '@/components/dashboard/recent-activity'
import type { Client } from '@/lib/validations/client'

const DIAS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

/** dias até o próximo aniversário (0 = hoje), ou null */
function daysToBirthday(c: Client, now = new Date()) {
  const m = c.data_nascimento ? /^\d{4}-(\d{2})-(\d{2})/.exec(c.data_nascimento) : null
  if (!m) return null
  const t = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let b = new Date(now.getFullYear(), Number(m[1]) - 1, Number(m[2]))
  if (b < t) b = new Date(now.getFullYear() + 1, Number(m[1]) - 1, Number(m[2]))
  return Math.round((b.getTime() - t.getTime()) / 86_400_000)
}

/** Bancada do dia: entregas por prazo em cima, as prontas para entregar, faturamento e meta, caixa, lembretes e o que já aconteceu hoje */
export default function DashboardPage() {
  const [clientOpen, setClientOpen] = useState(false)
  const [orderOpen, setOrderOpen] = useState(false)

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: async () => { const r = await fetch('/api/me'); return r.ok ? r.json() : null } })
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => { const r = await fetch('/api/dashboard/stats'); return r.ok ? r.json() : null },
    staleTime: 2 * 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  })
  const { data: orders = [], isLoading: ordersLoading } = useServiceOrders()
  const { data: clients = [] } = useClients()
  const { data: services = [] } = useQuery({ queryKey: ['services'], queryFn: async () => { const r = await fetch('/api/services'); return r.ok ? r.json() : [] } })

  // Calculado só após montar no cliente — ler a hora durante o render (SSR)
  // diverge do cliente se cruzar meia-noite ou hora, causando hydration mismatch (#418)
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => { setNow(new Date()) }, [])

  const first = (me?.name as string | undefined)?.split(' ')[0]
  const greeting = now
    ? `${now.getHours() < 12 ? 'Bom dia' : now.getHours() < 18 ? 'Boa tarde' : 'Boa noite'}${first ? `, ${first}` : ''}.`
    : `Olá${first ? `, ${first}` : ''}.`
  const dateStr = now ? `${DIAS[now.getDay()]}, ${now.getDate()} de ${MESES[now.getMonth()]}` : ''

  const open = orders.filter(isOpen)
  const todayCount = open.filter((o) => daysToDeadline(o) === 0).length
  const lateCount = open.filter((o) => (daysToDeadline(o) ?? 0) < 0).length
  const recOverdue = Number(stats?.financial_health?.receivables_overdue) || 0
  const isPro = me?.plan === 'pro' || me?.plan === 'enterprise'
  const subscriptionNextDueDate: string | null = me?.subscriptionNextDueDate ?? null

  return (
    <div>
      <style>{MASTER_DETAIL_CSS + FIN_CSS + DELIVERY_CSS + READY_CSS + REVENUE_CSS + SUBSCRIPTION_CSS + HOME_CSS}</style>

      {/* ── abertura ── */}
      <header className="border-b border-border/60 bg-card">
        <div className="flex flex-col gap-4 py-4 pl-16 pr-4 sm:px-6 sm:py-5 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div className="min-w-0 pr-28 sm:pr-0 lg:mr-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{dateStr}</p>
            <h1 className="font-serif-display mt-1 text-[34px] leading-none text-foreground sm:text-[44px]">{greeting}</h1>
            <p className="mt-2 text-[14.5px] leading-relaxed text-foreground/80">
              {ordersLoading ? 'Carregando o seu dia...' : todayCount + lateCount === 0 && recOverdue === 0 ? (
                <>Dia tranquilo: <b className="font-semibold text-foreground">nenhuma entrega hoje</b> e nada em atraso.</>
              ) : (
                <>Hoje tem <b className="font-semibold text-foreground">{todayCount} {todayCount === 1 ? 'entrega' : 'entregas'}</b>
                  {lateCount > 0 && <>, <b className="fin-late font-semibold">{lateCount} {lateCount === 1 ? 'ordem atrasada' : 'ordens atrasadas'}</b></>}
                  {recOverdue > 0 && <> e <b className="fin-late font-semibold">{formatBRL(recOverdue)}</b> a receber em atraso</>}.</>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:mr-52 lg:mr-56 lg:flex-nowrap">
            <div className="w-full sm:w-60"><GlobalSearch clients={clients} orders={orders} services={services} /></div>
            <button type="button" className="cli-ghost flex-1 justify-center sm:flex-none" onClick={() => setClientOpen(true)}><UserPlus className="h-4 w-4" aria-hidden="true" />Novo cliente</button>
            <button type="button" className="cli-primary flex-1 justify-center sm:flex-none" style={{ minHeight: 44 }} onClick={() => setOrderOpen(true)}><Plus className="h-4 w-4" aria-hidden="true" />Nova ordem</button>
          </div>
        </div>
      </header>

      <div className="space-y-4 p-3 sm:p-6 lg:p-8">
        <DeliveryBoard orders={orders} isLoading={ordersLoading} />

        <ReadyOrders orders={orders} isLoading={ordersLoading} />

        <RevenueGoal revenue={Number(stats?.monthly_revenue) || 0} prev={Number(stats?.financial_health?.prev_month_revenue) || 0} isLoading={statsLoading} />

        {isPro && subscriptionNextDueDate && (
          <SubscriptionCard nextDueDate={subscriptionNextDueDate} />
        )}

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(300px,1fr)_1.4fr]">
          <CashCard />
          <Reminders clients={clients} orders={orders} inactive={Number(stats?.inactive_clients_count) || 0}
            plan={stats?.plan} clientsCount={Number(stats?.metrics?.clients_count) || 0} />
        </div>

        <DayLine activities={(stats?.recent_activities ?? []) as Activity[]} isLoading={statsLoading} />
      </div>

      <ClientDialog open={clientOpen} onOpenChange={setClientOpen} />
      <ServiceOrderDialog open={orderOpen} onOpenChange={setOrderOpen} />
    </div>
  )
}

/** o caixa aberto, em linho escuro; sem caixa aberto, um convite para abrir. Abre e fecha aqui mesmo, sem sair do Dashboard */
function CashCard() {
  const { data: sessions = [], isLoading } = useCashierSessions({ status: 'aberto' })
  const s = sessions[0]
  const { data: moves = [] } = useCashierMovements(s?.id)
  const t = sessionTotals(s?.saldo_inicial, moves)
  const closeCashier = useCloseCashier()
  const [opening, setOpening] = useState(false)
  const [closing, setClosing] = useState(false)
  if (isLoading) return <div className="drawer min-h-[180px] animate-pulse" />
  if (!s) {
    return (
      <section aria-label="Caixa" className="drawer flex flex-col justify-between px-5 py-5">
        <div>
          <p className="fin-cap">Caixa</p>
          <p className="fin-num mt-2 text-[30px] text-[#FFF8F0]">Nenhum caixa aberto</p>
          <p className="dr-soft mt-1 text-[13px]">Abra o caixa para registrar o dinheiro que entra e sai hoje.</p>
        </div>
        <button type="button" className="dr-ghost mt-4 self-start" onClick={() => setOpening(true)}>
          <LockOpen className="h-3.5 w-3.5" aria-hidden="true" /> Abrir o caixa
        </button>
        <OpenCashierDialog open={opening} onClose={() => setOpening(false)} />
      </section>
    )
  }
  return (
    <section aria-label="Caixa" className="drawer flex flex-col justify-between px-5 py-5">
      <div>
        <p className="fin-cap">{s.org_cashiers?.nome || 'Caixa'} · aberto {timeOf(s.data_abertura)}</p>
        <p className="fin-num mt-2 text-[40px] text-[#FFF8F0]">{formatBRL(t.gaveta)}</p>
        <p className="dr-soft text-[12.5px]">na gaveta agora</p>
        <dl className="mt-3 grid grid-cols-3 gap-2 text-[11.5px]">
          <div><dt className="dr-soft">Entradas</dt><dd className="dr-in text-[13px] font-semibold tabular-nums">{formatBRL(t.entradas + t.reforcos)}</dd></div>
          <div><dt className="dr-soft">Saídas</dt><dd className="dr-out text-[13px] font-semibold tabular-nums">{formatBRL(t.saidas)}</dd></div>
          <div><dt className="dr-soft">Sangrias</dt><dd className="dr-out text-[13px] font-semibold tabular-nums">{formatBRL(t.sangrias)}</dd></div>
        </dl>
      </div>
      <div className="dr-line mt-4 flex items-center justify-between gap-3 border-t border-dashed pt-3 text-[12.5px]">
        <Link href={`/financeiro/caixa/sessao/${s.id}`} className="dr-link">
          Ver {moves.length} {moves.length === 1 ? 'movimento' : 'movimentos'}
        </Link>
        <button type="button" className="dr-ghost" style={{ minHeight: 36 }} onClick={() => setClosing(true)}>
          <Lock className="h-3.5 w-3.5" aria-hidden="true" /> Fechar caixa
        </button>
      </div>
      {closing && s.id && (
        <CloseCashierDialog
          sessao={{ id: s.id, caixa_id: s.caixa_id, saldo_inicial: Number(s.saldo_inicial) || 0, status: s.status }}
          saldoEsperado={t.gaveta}
          onClose={() => setClosing(false)}
          isLoading={closeCashier.isPending}
          onConfirm={async (data) => {
            try {
              await closeCashier.mutateAsync({ sessaoId: s.id!, ...data })
              setClosing(false)
            } catch { /* o hook já mostra o erro */ }
          }}
        />
      )}
    </section>
  )
}

/** lembretes que pedem uma ação: aniversários, ordens a receber, clientes sumidas, material acabando */
function Reminders({ clients, orders, inactive, plan, clientsCount }: {
  clients: Client[]; orders: ReturnType<typeof useServiceOrders>['data'] & object; inactive: number; plan?: string; clientsCount: number
}) {
  const { data: products = [] } = useProducts()
  const bdays = useMemo(() => clients
    .map((c) => ({ c, d: daysToBirthday(c) }))
    .filter((x): x is { c: Client; d: number } => x.d !== null && x.d <= 7)
    .sort((a, b) => a.d - b.d), [clients])
  const toReceive = orders.filter(isToReceive)
  const toReceiveSum = toReceive.reduce((s, o) => s + Math.max(0, (Number(o.valor_total) || 0) - (Number(o.valor_pago) || 0)), 0)
  const low = products.filter(isLow)

  const items: { key: string; icon: typeof Cake; title: string; sub: string; href: string; cta: string }[] = []
  if (bdays.length) {
    const b = bdays[0]
    items.push({
      key: 'bday', icon: Cake,
      title: bdays.length === 1 ? b.c.nome : `${b.c.nome} e mais ${bdays.length - 1}`,
      sub: b.d === 0 ? 'faz aniversário hoje' : b.d === 1 ? 'faz aniversário amanhã' : `aniversário em ${b.d} dias`,
      href: '/clientes', cta: 'Parabenizar',
    })
  }
  if (toReceive.length) items.push({ key: 'rec', icon: Wallet, title: `${toReceive.length} ${toReceive.length === 1 ? 'ordem concluída' : 'ordens concluídas'} a receber`, sub: `${formatBRL(toReceiveSum)} em aberto`, href: '/ordens-servico', cta: 'Cobrar' })
  if (inactive > 0) items.push({ key: 'gone', icon: UserX, title: `${inactive} ${inactive === 1 ? 'cliente sumida' : 'clientes sumidas'}`, sub: 'sem ordem há mais de 90 dias', href: '/clientes', cta: 'Ver' })
  if (low.length) items.push({ key: 'low', icon: Package, title: `${low.length} ${low.length === 1 ? 'material acabando' : 'materiais acabando'}`, sub: low.slice(0, 3).map((p) => p.nome).join(', '), href: '/estoque', cta: 'Repor' })

  return (
    <section aria-labelledby="rem-h" className="fin-card px-5 py-4">
      <h2 id="rem-h" className="fin-cap">Lembretes</h2>
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Nenhum lembrete por agora.</p>
      ) : (
        <ul className="mt-1">
          {items.map((it) => (
            <li key={it.key} className="grid grid-cols-[32px_1fr_auto] items-center gap-3 border-t border-dashed border-border py-2.5 first:border-t-0">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#C8714A]/12 text-[#8A4B2C] dark:text-[#E39B78]"><it.icon className="h-4 w-4" aria-hidden="true" /></span>
              <span className="min-w-0"><b className="block truncate text-sm font-semibold">{it.title}</b><small className="block truncate text-[12.5px] text-muted-foreground">{it.sub}</small></span>
              <Link href={it.href} className="whitespace-nowrap text-[13px] font-semibold text-[#8A4B2C] hover:underline dark:text-[#E39B78]">{it.cta}</Link>
            </li>
          ))}
        </ul>
      )}
      {plan === 'free' && (
        <div className="mt-3 border-t border-dashed border-border pt-3">
          <p className="mb-1.5 flex justify-between text-xs text-muted-foreground">Plano Free <b className="text-[#8A4B2C] dark:text-[#E39B78]">{clientsCount} de 50 clientes</b></p>
          <div className="cli-thread" aria-hidden="true"><span style={{ transform: `scaleX(${Math.min(1, clientsCount / 50)})` }} /></div>
        </div>
      )}
    </section>
  )
}

/** linha do tempo pespontada do dia (ou das últimas atividades, se hoje ainda está quieto) */
function DayLine({ activities, isLoading }: { activities: Activity[]; isLoading: boolean }) {
  // Calculado só após montar no cliente — ler a data durante o render (SSR)
  // diverge do cliente se cruzar meia-noite, causando hydration mismatch (#418)
  const [today, setToday] = useState<string | null>(null)
  useEffect(() => { setToday(todayISO()) }, [])

  const todays = today ? activities.filter((a) => todayISO(new Date(a.timestamp)) === today) : []
  const list = (today && todays.length ? todays : activities).slice(0, 5).reverse()
  const outKinds = new Set(['payable', 'cashier_close', 'order_cancelled'])
  return (
    <section aria-labelledby="day-h" className="fin-card px-5 py-4">
      <h2 id="day-h" className="fin-cap mb-3">{todays.length ? 'O dia até agora' : 'Últimas atividades'}</h2>
      {isLoading ? <div className="h-16 animate-pulse rounded bg-muted" /> : list.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nada registrado ainda.</p>
      ) : (
        <ol className="day-line">
          {list.map((a) => (
            <li key={a.id} className={outKinds.has(a.type) ? 'out' : a.type === 'order_completed' ? 'done' : ''}>
              <span className="text-[12px] tabular-nums text-muted-foreground">{todays.length ? timeOf(a.timestamp) : new Date(a.timestamp).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}</span>
              <b className="mt-0.5 block text-[13px] font-semibold">{a.title}</b>
              {a.description && <small className="block truncate text-[12px] text-muted-foreground">{a.description}</small>}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

const HOME_CSS = `
.day-line { list-style: none; margin: 0; padding: 0; display: grid; grid-auto-flow: column; grid-auto-columns: minmax(170px, 1fr); overflow-x: auto; scrollbar-width: thin; }
.day-line li { position: relative; min-width: 0; padding: 16px 14px 4px 0; }
.day-line li::before { content: ''; position: absolute; left: 0; right: 0; top: 4px; height: 2px; background: repeating-linear-gradient(90deg, var(--border) 0 5px, transparent 5px 8px); }
.day-line li::after { content: ''; position: absolute; left: 0; top: 0; width: 10px; height: 10px; border-radius: 50%; background: var(--card); border: 2px solid #C8714A; }
.day-line li.out::after { background: var(--foreground); border-color: var(--foreground); }
.day-line li.done::after { background: #C8714A; }
`
