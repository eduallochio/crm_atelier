'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Header } from '@/components/layouts/header'
import { useFinancialStats } from '@/hooks/use-financial-stats'
import { TransactionDialog } from '@/components/financial/transaction-dialog'
import { MASTER_DETAIL_CSS } from '@/components/dashboard/master-detail-css'
import { FIN_CSS, FinanceTabs, brl } from '@/components/financeiro/finance-ui'
import { CashDrawer } from '@/components/financeiro/cash-drawer'
import { WeekBills } from '@/components/financeiro/week-bills'

type Period = '7days' | '30days' | 'thisMonth' | 'lastMonth' | 'all'
const PERIODS: { key: Period; label: string }[] = [
  { key: '7days', label: 'Últimos 7 dias' },
  { key: '30days', label: 'Últimos 30 dias' },
  { key: 'thisMonth', label: 'Este mês' },
  { key: 'lastMonth', label: 'Mês passado' },
  { key: 'all', label: 'Tudo' },
]

/** Bancada do dia: o caixa aberto à esquerda, o período e as contas da semana à direita */
export default function FinanceiroPage() {
  const [period, setPeriod] = useState<Period>('thisMonth')
  const [newOpen, setNewOpen] = useState(false)
  const { data: stats, isLoading } = useFinancialStats(period)

  const saldo = Number(stats?.saldoMes) || 0
  const months = stats?.fluxoCaixa ?? []
  const peak = Math.max(1, ...months.map((m) => Math.abs(Number(m.saldo) || 0)))
  const periodLabel = PERIODS.find((p) => p.key === period)?.label ?? ''
  const value = (n: unknown) => (isLoading ? <span className="inline-block h-8 w-36 animate-pulse rounded bg-muted align-middle" /> : brl(Number(n) || 0))

  return (
    <div>
      <style>{MASTER_DETAIL_CSS + FIN_CSS}</style>
      <Header
        title="Financeiro"
        description="O caixa de hoje e as contas da semana"
        action={
          <button type="button" className="cli-primary" onClick={() => setNewOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">Lançamento</span><span className="sm:hidden">Novo</span>
          </button>
        }
      />
      <FinanceTabs />

      <div className="grid items-start gap-4 p-3 sm:p-6 lg:grid-cols-[minmax(340px,400px)_1fr] lg:gap-5">
        <CashDrawer />

        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap gap-1.5 lg:justify-end" role="group" aria-label="Período">
            {PERIODS.map((p) => (
              <button key={p.key} type="button" className="cli-chip" aria-pressed={period === p.key} onClick={() => setPeriod(p.key)}>{p.label}</button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="fin-card px-4 py-3.5">
              <p className="fin-cap">Saldo · {periodLabel}</p>
              <p className={`fin-num mt-2 text-[34px] ${saldo < 0 ? 'fin-late' : ''}`}>{value(saldo)}</p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
                Entrou <b className="font-semibold text-foreground tabular-nums">{brl(Number(stats?.entradasMes) || 0)}</b><br />
                Saiu <b className="font-semibold text-foreground tabular-nums">{brl(Number(stats?.saidasMes) || 0)}</b><br />
                Saldo geral <b className={`font-semibold tabular-nums ${(Number(stats?.saldoAtual) || 0) < 0 ? 'fin-late' : 'text-foreground'}`}>{brl(Number(stats?.saldoAtual) || 0)}</b>
              </p>
              {months.length > 0 && (
                <div className="spark mt-2.5" role="img" aria-label="Saldo dos últimos meses">
                  {months.map((m, i) => (
                    <i key={m.mesCompleto ?? i} title={`${m.mes}: ${brl(Number(m.saldo) || 0)}`}
                      className={`${i === months.length - 1 ? 'cur' : ''} ${(Number(m.saldo) || 0) < 0 ? 'neg' : ''}`}
                      style={{ height: `${Math.max(6, (Math.abs(Number(m.saldo) || 0) / peak) * 100)}%` }} />
                  ))}
                </div>
              )}
            </div>
            <Link href="/financeiro/receber" className="fin-card block px-4 py-3.5 transition-colors hover:border-[#D4A85A]">
              <p className="fin-cap">A receber</p>
              <p className="fin-num mt-2 text-[34px]">{value(stats?.totalAReceber)}</p>
              {(Number(stats?.receitasAtrasadas) || 0) > 0
                ? <p className="fin-late mt-1.5 text-[12.5px] font-semibold">{brl(Number(stats?.receitasAtrasadas))} em atraso</p>
                : <p className="mt-1.5 text-[12.5px] text-muted-foreground">nada em atraso</p>}
              {(Number(stats?.recebiveisVencendo) || 0) > 0 && <p className="text-[12.5px] text-muted-foreground">{String(stats?.recebiveisVencendo)} vencendo em 7 dias</p>}
            </Link>
            <Link href="/financeiro/pagar" className="fin-card block px-4 py-3.5 transition-colors hover:border-[#D4A85A]">
              <p className="fin-cap">A pagar</p>
              <p className="fin-num mt-2 text-[34px]">{value(stats?.totalAPagar)}</p>
              {(Number(stats?.despesasAtrasadas) || 0) > 0
                ? <p className="fin-late mt-1.5 text-[12.5px] font-semibold">+ {brl(Number(stats?.despesasAtrasadas))} em atraso</p>
                : <p className="mt-1.5 text-[12.5px] text-muted-foreground">nada em atraso</p>}
              {(Number(stats?.pagaveisVencendo) || 0) > 0 && <p className="text-[12.5px] text-muted-foreground">{String(stats?.pagaveisVencendo)} vencendo em 7 dias</p>}
            </Link>
          </div>

          <WeekBills />
        </div>
      </div>

      <TransactionDialog open={newOpen} onOpenChange={setNewOpen} />
    </div>
  )
}
