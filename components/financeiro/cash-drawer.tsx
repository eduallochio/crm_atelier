'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowDownLeft, ArrowRight, ArrowUpRight, HandCoins, Lock, LockOpen, PiggyBank, Plus } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useCashiers, useCashierMovements, useCashierSessions, useCloseCashier } from '@/hooks/use-cashier'
import type { CashierMovement, CashierSessionWithRelations } from '@/lib/validations/cashier'
import { AddMovementDialog } from './add-movement-dialog'
import { CloseCashierDialog } from './close-cashier-dialog'
import { brl, timeOf } from './finance-ui'

export type MoveKind = 'entrada' | 'saida' | 'sangria' | 'reforco'

export const MOVE_LABEL: Record<MoveKind, string> = { entrada: 'Entrada', saida: 'Saída', sangria: 'Sangria', reforco: 'Reforço' }
export const MOVE_ICON = { entrada: ArrowUpRight, saida: ArrowDownLeft, sangria: HandCoins, reforco: PiggyBank }
export const isInflow = (k: string) => k === 'entrada' || k === 'reforco'

export interface Unlaunched { id: string; numero: number | null; valorTotal: string | null; formaPagamento: string | null; dataConclusao: string | null; clienteNome: string | null }

/** totais de uma sessão a partir dos movimentos */
export function sessionTotals(saldoInicial: number | string | null | undefined, movimentos: CashierMovement[] = []) {
  const sum = (k: MoveKind) => movimentos.filter((m) => m.tipo === k).reduce((s, m) => s + (Number(m.valor) || 0), 0)
  const t = { inicial: Number(saldoInicial) || 0, entradas: sum('entrada'), saidas: sum('saida'), sangrias: sum('sangria'), reforcos: sum('reforco') }
  return { ...t, gaveta: t.inicial + t.entradas - t.saidas - t.sangrias + t.reforcos }
}

/** OS pagas (PIX/dinheiro) que ainda não entraram em nenhum caixa, e como lançá-las */
export function useUnlaunchedOrders(enabled = true) {
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState<string | null>(null)
  const query = useQuery<Unlaunched[]>({
    queryKey: ['orders-unlaunched'],
    queryFn: () => fetch('/api/orders/unlaunched').then((r) => (r.ok ? r.json() : [])),
    enabled,
  })
  const launchOne = async (id: string, quiet = false) => {
    const res = await fetch(`/api/orders/${id}/register-cashier`, { method: 'POST' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) { toast.error(data.error || 'Erro ao lançar no caixa'); return false }
    if (!quiet) toast.success('OS lançada no caixa com sucesso!')
    return true
  }
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['orders-unlaunched'] })
    queryClient.invalidateQueries({ queryKey: ['cashier-movements'] })
    queryClient.invalidateQueries({ queryKey: ['cashier-sessions'] })
  }
  const launch = async (id: string) => {
    setBusy(id)
    try { await launchOne(id) } catch { toast.error('Erro ao lançar no caixa') } finally { setBusy(null); refresh() }
  }
  const launchAll = async () => {
    const list = query.data ?? []
    setBusy('all')
    let ok = 0
    try { for (const o of list) if (await launchOne(o.id, true)) ok++ } catch { toast.error('Erro ao lançar no caixa') } finally {
      setBusy(null)
      refresh()
      if (ok) toast.success(ok === 1 ? '1 OS lançada no caixa!' : `${ok} OS lançadas no caixa!`)
    }
  }
  return { list: query.data ?? [], isLoading: query.isLoading, busy, launch, launchAll }
}

/** O caixa aberto agora, em linho escuro: quanto há na gaveta, lançamentos rápidos, OS pagas fora do caixa e fechamento */
export function CashDrawer() {
  const { data: open = [], isLoading } = useCashierSessions({ status: 'aberto' })
  const [pickedId, setPickedId] = useState<string | null>(null)
  const session = open.find((s) => s.id === pickedId) ?? open[0]

  if (isLoading) return <section aria-label="Caixa de hoje" className="drawer min-h-[420px] animate-pulse" />
  if (!session) return <ClosedDrawer />
  return (
    <>
      {open.length > 1 && (
        <div className="mb-2 flex flex-wrap gap-1.5" role="group" aria-label="Caixas abertos">
          {open.map((s) => (
            <button key={s.id} type="button" className="cli-chip" aria-pressed={s.id === session.id} onClick={() => setPickedId(s.id ?? null)}>
              {s.org_cashiers?.nome || 'Caixa'}
            </button>
          ))}
        </div>
      )}
      <OpenDrawer key={session.id} session={session} />
    </>
  )
}

function OpenDrawer({ session }: { session: CashierSessionWithRelations }) {
  const sessionId = session.id!
  const { data: moves = [], isLoading } = useCashierMovements(sessionId)
  const closeCashier = useCloseCashier()
  const unl = useUnlaunchedOrders()
  const [adding, setAdding] = useState<MoveKind | null>(null)
  const [closing, setClosing] = useState(false)
  const t = sessionTotals(session.saldo_inicial, moves)
  const unlTotal = unl.list.reduce((s, o) => s + (Number(o.valorTotal) || 0), 0)

  return (
    <section aria-label="Caixa de hoje" className="drawer">
      <div className="flex items-center justify-between gap-3 px-5 pt-4">
        <b className="truncate text-sm font-semibold">{session.org_cashiers?.nome || 'Caixa'}</b>
        <span className="dr-pill shrink-0">Aberto {timeOf(session.data_abertura)}</span>
      </div>

      <div className="dr-line border-b border-dashed px-5 pt-3 pb-4">
        <p className="fin-cap">Na gaveta agora</p>
        <p className="fin-num mt-1.5 text-[50px] text-[#FFF8F0]">{isLoading ? '—' : brl(t.gaveta)}</p>
        <dl className="mt-3.5 grid grid-cols-4 gap-1.5 text-[11.5px]">
          {[['Inicial', t.inicial], ['Entradas', t.entradas + t.reforcos], ['Saídas', t.saidas], ['Sangrias', t.sangrias]].map(([l, v]) => (
            <div key={l as string}><dt className="dr-soft">{l}</dt><dd className="mt-0.5 text-[13px] font-semibold tabular-nums">{brl(v as number)}</dd></div>
          ))}
        </dl>
      </div>

      <div className="grid grid-cols-4 gap-1.5 px-5 py-4">
        {(Object.keys(MOVE_LABEL) as MoveKind[]).map((k) => {
          const Icon = MOVE_ICON[k]
          return (
            <button key={k} type="button" className="dr-btn" onClick={() => setAdding(k)}>
              <Icon className="h-[18px] w-[18px]" aria-hidden="true" />{MOVE_LABEL[k]}
            </button>
          )
        })}
      </div>

      <ul className="max-h-[230px] overflow-y-auto px-5" aria-label="Movimentos de hoje">
        {moves.length === 0 && !isLoading && <li className="dr-soft py-3 text-[13px]">Nenhum movimento ainda. Os pagamentos das ordens entram aqui.</li>}
        {moves.slice(0, 8).map((m) => (
          <li key={m.id} className="dr-line grid grid-cols-[44px_1fr_auto] items-center gap-2.5 border-t border-dashed py-2 text-[13px] first:border-t-0">
            <span className="dr-soft tabular-nums">{timeOf(m.created_at)}</span>
            <span className="min-w-0 truncate">{m.descricao || MOVE_LABEL[m.tipo]}<small className="dr-soft block text-[11.5px]">{MOVE_LABEL[m.tipo]}</small></span>
            <span className={`font-semibold tabular-nums ${isInflow(m.tipo) ? 'dr-in' : 'dr-out'}`}>{isInflow(m.tipo) ? '+ ' : '− '}{brl(Number(m.valor))}</span>
          </li>
        ))}
      </ul>
      {moves.length > 8 && (
        <p className="px-5 pt-1 text-[12.5px]"><Link href={`/financeiro/caixa/sessao/${sessionId}`} className="dr-link">Ver os {moves.length} movimentos</Link></p>
      )}

      {unl.list.length > 0 && (
        <div className="dr-warn mx-5 mt-3 px-3 py-2.5 text-[12.5px]">
          <b className="text-[#FFF8F0]">{unl.list.length} {unl.list.length === 1 ? 'ordem paga ainda não entrou' : 'ordens pagas ainda não entraram'}</b> no caixa
          ({unl.list.slice(0, 3).map((o) => `#${String(o.numero ?? 0).padStart(6, '0')}`).join(', ')}{unl.list.length > 3 ? '…' : ''} · {brl(unlTotal)}).
          <br />
          <button type="button" className="dr-link mt-1" onClick={unl.launchAll} disabled={!!unl.busy}>
            {unl.busy ? 'Lançando...' : unl.list.length === 1 ? 'Lançar agora' : `Lançar ${unl.list.length === 2 ? 'as duas' : 'todas'} agora`}
          </button>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-5">
        <Link href={`/financeiro/caixa/sessao/${sessionId}`} className="dr-link text-[13px]">Abrir o caixa completo</Link>
        <button type="button" className="dr-ghost" onClick={() => setClosing(true)}>
          <Lock className="h-3.5 w-3.5" aria-hidden="true" /> Fechar caixa
        </button>
      </div>

      {adding && <AddMovementDialog sessaoId={sessionId} type={adding} onClose={() => setAdding(null)} />}
      {closing && (
        <CloseCashierDialog
          sessao={{ id: sessionId, caixa_id: session.caixa_id, saldo_inicial: Number(session.saldo_inicial) || 0, status: session.status }}
          saldoEsperado={t.gaveta}
          onClose={() => setClosing(false)}
          isLoading={closeCashier.isPending}
          onConfirm={async (data) => {
            try {
              await closeCashier.mutateAsync({ sessaoId: sessionId, ...data })
              setClosing(false)
            } catch { /* o hook já mostra o erro */ }
          }}
        />
      )}
    </section>
  )
}

/** sem caixa aberto: os caixas cadastrados prontos para abrir */
function ClosedDrawer() {
  const { data: cashiers = [], isLoading } = useCashiers()
  const active = cashiers.filter((c) => c.ativo !== false)
  return (
    <section aria-label="Caixa de hoje" className="drawer px-5 py-6">
      <LockOpen className="h-7 w-7 text-[#E9C887]" aria-hidden="true" strokeWidth={1.6} />
      <h2 className="fin-num mt-3 text-[30px] text-[#FFF8F0]">Nenhum caixa aberto</h2>
      <p className="dr-soft mt-1.5 text-[13.5px] leading-relaxed">
        Abra um caixa no começo do dia para registrar o dinheiro que entra e sai da gaveta. Os pagamentos das ordens concluídas entram nele.
      </p>
      <ul className="mt-4 space-y-2">
        {isLoading && <li className="h-14 animate-pulse rounded-lg bg-white/5" />}
        {active.map((c) => (
          <li key={c.id} className="dr-line flex items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5">
            <span className="min-w-0"><b className="block truncate text-sm font-semibold">{c.nome}</b>{c.descricao && <small className="dr-soft block truncate text-[12px]">{c.descricao}</small>}</span>
            <Link href={`/financeiro/caixa/abrir/${c.id}`} className="dr-ghost shrink-0" style={{ minHeight: 34 }}>Abrir <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
          </li>
        ))}
      </ul>
      {!isLoading && active.length === 0 && (
        <Link href="/financeiro/caixa/cadastro" className="dr-ghost mt-2"><Plus className="h-3.5 w-3.5" aria-hidden="true" /> Cadastrar um caixa</Link>
      )}
    </section>
  )
}
