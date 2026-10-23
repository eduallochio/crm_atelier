'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useProducts, type Product } from '@/hooks/use-inventory'
import { usePlanUsage } from '@/hooks/use-plan-usage'
import { UpgradePrompt } from '@/components/upgrade-prompt'

export const qty = (n: number | string | null | undefined) => (Number(n) || 0).toLocaleString('pt-BR', { maximumFractionDigits: 3 })

/** tem mínimo definido e está no mínimo ou abaixo */
export const isLow = (p: Product) => p.ativo && Number(p.quantidade_minima) > 0 && Number(p.quantidade_atual) <= Number(p.quantidade_minima)
export const isOut = (p: Product) => p.ativo && Number(p.quantidade_atual) <= 0

const TABS = [
  { href: '/estoque', label: 'Produtos', key: 'produtos' },
  { href: '/estoque/entradas', label: 'Entradas', key: 'entradas' },
  { href: '/estoque/saidas', label: 'Saídas', key: 'saidas' },
  { href: '/estoque/relatorios', label: 'Relatórios', key: 'relatorios' },
  { href: '/fornecedores', label: 'Fornecedores', key: 'fornecedores' },
] as const

/** Navegação entre as partes do Estoque (mesmo desenho das abas do Financeiro) */
export function StockTabs() {
  const pathname = usePathname() ?? ''
  const { data: products = [] } = useProducts()
  const low = products.filter(isLow).length
  const current = TABS.slice().reverse().find((t) => (t.href === '/estoque' ? pathname === '/estoque' : pathname.startsWith(t.href)))
  return (
    <nav aria-label="Estoque" className="fin-tabs">
      {TABS.map((t) => (
        <Link key={t.href} href={t.href} className="fin-tab" aria-current={current?.href === t.href ? 'page' : undefined}>
          {t.label}
          {t.key === 'produtos' && low > 0 && <span className="fin-tab-n" title={`${low} com estoque baixo`}>{low}<span className="sr-only"> com estoque baixo</span></span>}
        </Link>
      ))}
    </nav>
  )
}

/** Estoque é do plano Pro: no Free mostra o convite de upgrade, como antes */
export function StockGate({ message, children }: { message: string; children: React.ReactNode }) {
  const { data: plan, isLoading } = usePlanUsage()
  if (isLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#C8714A] border-t-transparent" /></div>
  }
  if (plan?.plan === 'free') return <UpgradePrompt message={message} />
  return <>{children}</>
}

/** barra do estoque contra o mínimo: pesponto terracota, vermelho quando baixo */
export function StockMeter({ p, className = '' }: { p: Product; className?: string }) {
  const min = Number(p.quantidade_minima) || 0
  const cur = Math.max(0, Number(p.quantidade_atual) || 0)
  if (min <= 0) return null
  const pct = Math.min(100, (cur / (min * 2)) * 100)
  return (
    <span className={`stk-meter ${isLow(p) ? 'low' : ''} ${className}`} aria-hidden="true">
      <i style={{ width: `${pct}%` }} />
      <b style={{ left: '50%' }} />
    </span>
  )
}

export const STOCK_CSS = `
.stk-meter { position: relative; display: block; height: 4px; border-radius: 2px; background: repeating-linear-gradient(90deg, color-mix(in oklab, #C8714A 22%, transparent) 0 6px, transparent 6px 9px); }
.stk-meter i { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 2px; background: repeating-linear-gradient(90deg, #C8714A 0 6px, transparent 6px 9px); }
.stk-meter.low i { background: repeating-linear-gradient(90deg, #B91C1C 0 6px, transparent 6px 9px); }
.dark .stk-meter.low i { background: repeating-linear-gradient(90deg, #F87171 0 6px, transparent 6px 9px); }
.rel-card.is-on { border-color: #C8714A; box-shadow: inset 0 0 0 1px #C8714A; }
.rel-card:focus-visible { outline: 2px solid #C8714A; outline-offset: 2px; }
.stk-meter b { position: absolute; top: -3px; bottom: -3px; width: 1.5px; background: var(--muted-foreground); opacity: .55; }
`
