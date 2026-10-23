'use client'

import { useState } from 'react'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { formatBRL } from './client-utils'

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

/** "6.000,00", "6000,5", "6000.50" e "6.000" viram 6000 / 6000,5 / 6000,5 / 6000 */
export function parseMoney(raw: string) {
  const s = raw.replace(/[^\d,.]/g, '')
  const n = s.includes(',')
    ? parseFloat(s.replace(/\./g, '').replace(',', '.'))   // formato brasileiro
    : /\.\d{1,2}$/.test(s)
      ? parseFloat(s)                                       // ponto como decimal (6000.50)
      : parseFloat(s.replace(/\./g, ''))                    // ponto de milhar (6.000)
  return Number.isFinite(n) && n > 0 ? n : 0
}

/** Faixa do faturamento do mês com a meta como uma linha costurada (agulha no ponto atual, marca do mês passado) */
export function RevenueGoal({ revenue, prev, isLoading }: { revenue: number; prev: number; isLoading: boolean }) {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  const { data } = useQuery({
    queryKey: ['monthly-goal'],
    queryFn: async () => {
      const res = await fetch('/api/settings/goals')
      if (!res.ok) return { monthly_revenue_goal: 0 }
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
  })
  const goal = Number(data?.monthly_revenue_goal) || 0

  const save = useMutation({
    mutationFn: async (newGoal: number) => {
      const res = await fetch('/api/settings/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthly_revenue_goal: newGoal }),
      })
      if (!res.ok) throw new Error('Falha ao salvar meta')
      return res.json()
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['monthly-goal'] }); toast.success('Meta atualizada!'); setEditing(false) },
    onError: () => toast.error('Erro ao salvar meta'),
  })

  const now = new Date()
  const month = MESES[now.getMonth()]
  const prevMonth = MESES[(now.getMonth() + 11) % 12]
  const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate() + 1
  const delta = prev > 0 ? ((revenue - prev) / prev) * 100 : null
  const scale = Math.max(goal, revenue, prev, 1)
  const pct = (revenue / scale) * 100
  const prevPct = (prev / scale) * 100
  const missing = Math.max(0, goal - revenue)
  const startEdit = () => { setDraft(goal > 0 ? goal.toFixed(2).replace('.', ',') : ''); setEditing(true) }

  return (
    <section aria-labelledby="rev-h" className="fin-card grid gap-5 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(280px,380px)_1fr] lg:items-center lg:gap-8">
      <div>
        <h2 id="rev-h" className="fin-cap">Faturamento de {month}</h2>
        <p className="fin-num mt-2 whitespace-nowrap text-[44px] sm:text-[56px]">{isLoading ? '—' : formatBRL(revenue)}</p>
        {delta !== null && !isLoading && (
          <span className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12.5px] font-semibold ${delta >= 0 ? 'bg-emerald-600/12 fin-pos' : 'bg-red-600/10 fin-late'}`}>
            {delta >= 0 ? <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" /> : <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />}
            {delta >= 0 ? '+' : ''}{delta.toFixed(1).replace('.', ',')}% sobre {prevMonth}
          </span>
        )}
        <p className="mt-1.5 text-[12px] text-muted-foreground">ordens concluídas no mês</p>
      </div>

      <div className="lg:border-l lg:border-dashed lg:border-border lg:pl-8">
        {editing ? (
          <form className="mb-4 flex flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); save.mutate(parseMoney(draft)) }}>
            <label htmlFor="goal-in" className="text-sm text-muted-foreground">Meta de {month}</label>
            <input id="goal-in" autoFocus inputMode="decimal" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="6.000,00"
              onKeyDown={(e) => { if (e.key === 'Escape') setEditing(false) }}
              className="h-10 w-36 rounded-lg border border-border bg-background px-3 text-sm tabular-nums outline-none focus:border-[#C8714A] focus:ring-3 focus:ring-[#C8714A]/15" />
            <button type="submit" className="cli-primary" style={{ minHeight: 40 }} disabled={save.isPending}>{save.isPending ? 'Salvando...' : 'Salvar'}</button>
            <button type="button" className="cli-ghost" style={{ minHeight: 40 }} onClick={() => setEditing(false)}>Cancelar</button>
          </form>
        ) : (
          <p className="mb-4 text-[15px] leading-relaxed text-foreground/85">
            {goal <= 0 ? (
              <>Defina uma meta para o mês e acompanhe aqui quanto falta.{' '}</>
            ) : missing > 0 ? (
              <>Faltam <b className="font-semibold text-foreground">{formatBRL(missing)}</b> para a meta de <b className="font-semibold text-foreground">{formatBRL(goal)}</b>, em {daysLeft} {daysLeft === 1 ? 'dia' : 'dias'}: cerca de <b className="font-semibold text-foreground">{formatBRL(missing / daysLeft)}</b> por dia.{' '}</>
            ) : (
              <>Meta de <b className="font-semibold text-foreground">{formatBRL(goal)}</b> batida! {' '}</>
            )}
            <button type="button" onClick={startEdit} className="font-semibold text-[#8A4B2C] underline underline-offset-2 dark:text-[#E39B78]">
              {goal > 0 ? 'Mudar a meta' : 'Definir meta'}
            </button>
          </p>
        )}
        <div className="rev-thread" role="img" aria-label={goal > 0 ? `${Math.round((revenue / goal) * 100)}% da meta` : 'Faturamento do mês'}>
          {prev > 0 && <span className="rev-mk" style={{ left: `${prevPct}%` }} />}
          <i style={{ width: `${pct}%` }} />
          <span className="rev-ndl" style={{ left: `${pct}%` }} />
        </div>
        <div className="mt-3.5 flex justify-between gap-3 text-[12.5px] text-muted-foreground">
          <span>R$ 0</span>
          {prev > 0 && <span className="hidden sm:inline">{prevMonth} {formatBRL(prev)}</span>}
          {goal > 0 ? <span><b className="font-semibold text-foreground">{Math.round((revenue / goal) * 100)}%</b> da meta</span> : revenue > 0 ? <span>{formatBRL(revenue)}</span> : <span>sem meta</span>}
        </div>
      </div>
    </section>
  )
}

export const REVENUE_CSS = `
.rev-thread { position: relative; height: 8px; background: repeating-linear-gradient(90deg, color-mix(in oklab, #C8714A 24%, transparent) 0 9px, transparent 9px 14px); }
.rev-thread i { position: absolute; left: 0; top: 0; bottom: 0; background: repeating-linear-gradient(90deg, #C8714A 0 9px, transparent 9px 14px); transform-origin: left; animation: rev-sew 1.4s cubic-bezier(.2,0,0,1) .2s backwards; transition: width .5s cubic-bezier(.2,0,0,1); }
.rev-ndl { position: absolute; top: 50%; width: 2.5px; height: 36px; border-radius: 1px; background: var(--foreground); transform: translate(-50%, -55%) rotate(18deg); animation: rev-ndl 1.4s cubic-bezier(.2,0,0,1) .2s backwards; transition: left .5s cubic-bezier(.2,0,0,1); }
.rev-ndl::after { content: ''; position: absolute; top: 3px; left: -2px; width: 6.5px; height: 6.5px; border-radius: 50%; border: 2px solid var(--foreground); background: var(--card); }
.rev-mk { position: absolute; top: -6px; bottom: -6px; width: 1.5px; background: var(--muted-foreground); opacity: .5; }
@keyframes rev-sew { from { transform: scaleX(0); } }
@keyframes rev-ndl { from { left: 0; } }
@media (prefers-reduced-motion: reduce) { .rev-thread i, .rev-ndl { animation: none; transition: none; } }
`
