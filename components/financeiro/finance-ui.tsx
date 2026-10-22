'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useReceivables, usePayables } from '@/hooks/use-financial'
import { useCashierSessions } from '@/hooks/use-cashier'
import { Header } from '@/components/layouts/header'

// ───────────── datas e valores ─────────────

export const brl = (n: number) => (Number(n) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

/** hoje em AAAA-MM-DD no fuso local */
export function todayISO(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

function parse(value: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null
}

/** dias entre hoje e a data (negativo = passou) */
export function daysFromToday(value: string | null | undefined) {
  const d = value ? parse(value) : null
  if (!d) return null
  const t = parse(todayISO())!
  return Math.round((d.getTime() - t.getTime()) / 86_400_000)
}

/** "12 out 2026" (ou "12 out") */
export function shortDate(value: string | null | undefined, withYear = true) {
  const d = value ? parse(value) : null
  if (!d) return '—'
  return `${d.getDate()} ${MESES[d.getMonth()]}${withYear ? ` ${d.getFullYear()}` : ''}`
}

/** "Hoje", "Amanhã", "sex 24 out" */
export function dayLabel(value: string) {
  const n = daysFromToday(value)
  const d = parse(value)
  if (n === null || !d) return '—'
  if (n === 0) return 'Hoje'
  if (n === 1) return 'Amanhã'
  if (n === -1) return 'Ontem'
  return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`
}

/** "14:30" a partir de um ISO */
export function timeOf(value: string | null | undefined) {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function dateTimeOf(value: string | null | undefined) {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '—' : `${d.getDate()} ${MESES[d.getMonth()]} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}

/** conta em aberto (pendente ou marcada atrasada) cujo vencimento já passou */
export function isLate(bill: { status: string; data_vencimento: string }) {
  if (bill.status === 'atrasado') return true
  if (bill.status !== 'pendente') return false
  const n = daysFromToday(bill.data_vencimento)
  return n !== null && n < 0
}
export const isOpenBill = (bill: { status: string }) => bill.status === 'pendente' || bill.status === 'atrasado'

// ───────────── abas do financeiro ─────────────

const TABS = [
  { href: '/financeiro', label: 'Visão geral', key: 'geral' },
  { href: '/financeiro/receber', label: 'A receber', key: 'receber' },
  { href: '/financeiro/pagar', label: 'A pagar', key: 'pagar' },
  { href: '/financeiro/fluxo-caixa', label: 'Fluxo de caixa', key: 'fluxo' },
  { href: '/financeiro/caixa', label: 'Caixa', key: 'caixa' },
] as const

/** Navegação entre as partes do Financeiro: contas atrasadas em cada aba e luz quando há caixa aberto */
export function FinanceTabs() {
  const pathname = usePathname() ?? ''
  const { data: receivables = [] } = useReceivables()
  const { data: payables = [] } = usePayables()
  const { data: openSessions = [] } = useCashierSessions({ status: 'aberto' })
  const late = {
    receber: receivables.filter(isLate).length,
    pagar: payables.filter(isLate).length,
  }
  const cashOpen = openSessions.length > 0

  const current = TABS.slice().reverse().find((t) => t.href === '/financeiro' ? pathname === '/financeiro' : pathname.startsWith(t.href))

  return (
    <nav aria-label="Financeiro" className="fin-tabs">
      {TABS.map((t) => {
        const n = t.key === 'receber' ? late.receber : t.key === 'pagar' ? late.pagar : 0
        return (
          <Link key={t.href} href={t.href} className="fin-tab" aria-current={current?.href === t.href ? 'page' : undefined}>
            {t.label}
            {n > 0 && <span className="fin-tab-n" title={`${n} em atraso`}>{n}<span className="sr-only"> em atraso</span></span>}
            {t.key === 'caixa' && cashOpen && <span className="fin-tab-on" title="Caixa aberto"><span className="sr-only">(aberto)</span></span>}
          </Link>
        )
      })}
    </nav>
  )
}

// ───────────── estilos do financeiro (somam ao MASTER_DETAIL_CSS) ─────────────

export const FIN_CSS = `
.fin-tabs { display: flex; gap: 2px; overflow-x: auto; scrollbar-width: none; border-bottom: 1px solid var(--border); padding: 0 12px; }
@media (min-width: 640px) { .fin-tabs { padding: 0 24px; } }
.fin-tabs::-webkit-scrollbar { display: none; }
.fin-tab { position: relative; display: inline-flex; flex: none; align-items: center; gap: 7px; height: 46px; padding: 0 12px; font-size: 14px; font-weight: 500; color: var(--muted-foreground); white-space: nowrap; transition: color .15s; }
.fin-tab:hover { color: var(--foreground); }
.fin-tab[aria-current="page"] { color: var(--foreground); font-weight: 600; }
.fin-tab[aria-current="page"]::after { content: ''; position: absolute; left: 8px; right: 8px; bottom: -1px; height: 2px; background: repeating-linear-gradient(90deg, #C8714A 0 6px, transparent 6px 9px); }
.fin-tab:focus-visible { outline: 2px solid #C8714A; outline-offset: -2px; border-radius: 6px; }
.fin-tab-n { min-width: 18px; height: 18px; padding: 0 5px; border-radius: 9px; background: rgba(220,38,38,.12); color: #B91C1C; font-size: 10.5px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; }
.dark .fin-tab-n { color: #F87171; background: rgba(248,113,113,.15); }
.fin-tab-on { width: 7px; height: 7px; border-radius: 50%; background: #2F8A57; box-shadow: 0 0 0 3px rgba(47,138,87,.18); }
.fin-card { border-radius: 12px; border: 1px solid color-mix(in oklab, var(--border) 70%, transparent); background: var(--card); }
.fin-cap { font-size: 11px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: var(--muted-foreground); }
.fin-num { font-family: var(--font-cormorant), 'Cormorant Garamond', Georgia, serif; font-weight: 400; font-variant-numeric: tabular-nums; letter-spacing: -.01em; line-height: 1; }
.fin-seg { display: inline-flex; border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
.fin-seg button { height: 32px; padding: 0 11px; font-size: 12.5px; font-weight: 500; color: var(--muted-foreground); background: var(--card); }
.fin-seg button + button { border-left: 1px solid var(--border); }
.fin-seg button[aria-pressed="true"] { background: #2C1810; color: #F7F0E6; }
.dark .fin-seg button[aria-pressed="true"] { background: #F7F0E6; color: #2C1810; }
.fin-seg button:focus-visible { outline: 2px solid #C8714A; outline-offset: -2px; }
.ord-chip-late[aria-pressed="false"] { border-color: rgba(220,38,38,.45); color: #B91C1C; }
.dark .ord-chip-late[aria-pressed="false"] { color: #F87171; }
.fin-late { color: #B91C1C; } .dark .fin-late { color: #F87171; }
.fin-pos { color: #256B40; } .dark .fin-pos { color: #6EE7A0; }
/* gaveta: o caixa aberto em linho escuro */
.drawer { position: relative; overflow: hidden; border-radius: 14px; background: #2C1810; color: #F7F0E6; }
.dark .drawer { background: #24140D; box-shadow: inset 0 0 0 1px rgba(247,240,230,.08); }
.drawer::before { content: ''; position: absolute; inset: 0; pointer-events: none; opacity: .5; background: repeating-linear-gradient(0deg, rgba(255,255,255,.025) 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, rgba(255,255,255,.02) 0 1px, transparent 1px 3px); }
.drawer > * { position: relative; }
.drawer .fin-cap { color: rgba(247,240,230,.62); }
.dr-line { border-color: rgba(247,240,230,.16) !important; }
.dr-soft { color: rgba(247,240,230,.62); }
.dr-btn { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; min-height: 60px; padding: 8px 4px; border-radius: 8px; border: 1px solid rgba(247,240,230,.18); background: rgba(247,240,230,.04); color: #F7F0E6; font-size: 12.5px; font-weight: 500; transition: border-color .15s, background-color .15s; }
.dr-btn:hover:not(:disabled) { border-color: #D4A85A; background: rgba(212,168,90,.1); }
.dr-btn:focus-visible, .dr-ghost:focus-visible, .dr-link:focus-visible { outline: 2px solid #D4A85A; outline-offset: 2px; }
.dr-btn:disabled { opacity: .5; }
.dr-ghost { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 40px; padding: 0 14px; border-radius: 2px; border: 1px solid rgba(247,240,230,.3); color: #F7F0E6; font-size: 12px; font-weight: 500; letter-spacing: .1em; text-transform: uppercase; transition: border-color .15s, background-color .15s; }
.dr-ghost:hover { border-color: #D4A85A; background: rgba(212,168,90,.12); }
.dr-link { color: #E9C887; font-weight: 600; text-decoration: underline; text-underline-offset: 2px; }
.dr-in { color: #9FE0B8; } .dr-out { color: #F2B8A4; }
.dr-warn { border: 1px dashed #D4A85A; background: rgba(212,168,90,.1); color: #F3DDB0; border-radius: 8px; }
.dr-pill { display: inline-flex; align-items: center; gap: 6px; height: 24px; padding: 0 10px; border-radius: 12px; font-size: 12px; font-weight: 600; background: rgba(47,138,87,.22); color: #9FE0B8; }
.dr-pill::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: #5BC98A; }
.fin-new { animation: fin-in .4s cubic-bezier(.2,0,0,1); }
@keyframes fin-in { from { opacity: 0; transform: translateY(-6px); } }
.spark { display: flex; align-items: flex-end; gap: 4px; height: 34px; }
.spark i { flex: 1; border-radius: 2px; background: color-mix(in oklab, #C8714A 28%, transparent); min-height: 2px; }
.spark i.cur { background: #C8714A; }
.spark i.neg { background: color-mix(in oklab, #B91C1C 35%, transparent); }
/* linha do tempo do caixa */
.cx-tl { list-style: none; margin: 0; padding: 0; }
.cx-tl li { position: relative; display: grid; grid-template-columns: 48px 1fr auto; gap: 12px; align-items: center; padding: 11px 0 11px 22px; }
.cx-tl li::before { content: ''; position: absolute; left: 5px; top: 17px; width: 10px; height: 10px; border-radius: 50%; background: var(--card); border: 2px solid #C8714A; }
.cx-tl li.out::before { background: var(--foreground); border-color: var(--foreground); width: 8px; height: 8px; left: 6px; top: 18px; }
.cx-tl li.ab::before { background: #C8714A; }
.cx-tl li:not(:last-child)::after { content: ''; position: absolute; left: 10px; top: 31px; bottom: -11px; width: 2px; background: repeating-linear-gradient(180deg, var(--border) 0 4px, transparent 4px 7px); }
.mv-tag { display: inline-flex; height: 20px; align-items: center; padding: 0 8px; border-radius: 10px; font-size: 11px; font-weight: 600; margin-left: 6px; vertical-align: 1px; }
.mv-tag.entrada { background: rgba(37,107,64,.12); color: #256B40; } .dark .mv-tag.entrada { color: #6EE7A0; }
.mv-tag.saida { background: rgba(138,75,44,.12); color: #8A4B2C; } .dark .mv-tag.saida { color: #E39B78; }
.mv-tag.sangria { background: rgba(185,28,28,.1); color: #B91C1C; } .dark .mv-tag.sangria { color: #F87171; }
.mv-tag.reforco { background: rgba(212,168,90,.2); color: #7A5A1E; } .dark .mv-tag.reforco { color: #E8C98A; }
.mv-tag.abertura { background: var(--muted); color: var(--muted-foreground); }
@media (prefers-reduced-motion: reduce) { .fin-new { animation: none; } }
`

/** moldura das páginas de um caixa (cadastrar, abrir, editar): abas do financeiro, volta para os caixas e título */
export function CashierFrame({ eyebrow, title, desc, children }: { eyebrow: string; title: string; desc: string; children: React.ReactNode }) {
  return (
    <div>
      <style>{FIN_CSS}</style>
      <Header title="Financeiro" description="Caixas e sessões" />
      <FinanceTabs />
      <div className="mx-auto max-w-2xl p-3 sm:p-6">
        <Link href="/financeiro/caixa" className="mb-3 -ml-1 inline-flex min-h-10 items-center gap-2 rounded-md px-1 text-sm text-muted-foreground hover:text-foreground">
          <span aria-hidden="true">←</span> Todos os caixas
        </Link>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{eyebrow}</p>
        <h2 className="mt-1 text-[34px] leading-[1.05] text-foreground" style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}>{title}</h2>
        <p className="mt-1.5 mb-5 text-sm text-muted-foreground">{desc}</p>
        <div className="cx-form">{children}</div>
      </div>
      <style>{`.cx-form .rounded-xl.border.bg-card { box-shadow: none; border-color: color-mix(in oklab, var(--border) 70%, transparent); }`}</style>
    </div>
  )
}
