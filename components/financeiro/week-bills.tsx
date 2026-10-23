'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { useReceivables, usePayables, useUpdateReceivable, useUpdatePayable } from '@/hooks/use-financial'
import type { Payable, Receivable } from '@/lib/validations/financial'
import { brl, dayLabel, daysFromToday, isOpenBill, todayISO } from './finance-ui'

type Kind = '' | 'r' | 'p'
type Row = { kind: 'r'; bill: Receivable } | { kind: 'p'; bill: Payable }

/** mesma baixa que existia na tabela de contas a receber */
export function receiveInput(r: Receivable) {
  return {
    descricao: r.descricao,
    valor: String(r.valor),
    data_vencimento: r.data_vencimento,
    status: 'recebido' as const,
    data_recebimento: todayISO(),
    category_id: r.category_id ?? undefined,
    payment_method_id: r.payment_method_id ?? undefined,
    observacoes: r.observacoes ?? undefined,
  }
}
/** mesma baixa que existia na tabela de contas a pagar */
export const payInput = () => ({ status: 'pago' as const, data_pagamento: todayISO() })

/** Contas em aberto que venceram ou vencem nos próximos 7 dias, com baixa na própria linha */
export function WeekBills() {
  const { data: receivables = [], isLoading: lr } = useReceivables()
  const { data: payables = [], isLoading: lp } = usePayables()
  const updateR = useUpdateReceivable()
  const updateP = useUpdatePayable()
  const [kind, setKind] = useState<Kind>('')
  const [busy, setBusy] = useState<string | null>(null)

  const rows = useMemo(() => {
    const due = (d: string) => { const n = daysFromToday(d); return n !== null && n <= 7 }
    const all: Row[] = [
      ...receivables.filter((r) => isOpenBill(r) && due(r.data_vencimento)).map((bill) => ({ kind: 'r' as const, bill })),
      ...payables.filter((p) => isOpenBill(p) && due(p.data_vencimento)).map((bill) => ({ kind: 'p' as const, bill })),
    ]
    return all
      .filter((x) => !kind || x.kind === kind)
      .sort((a, b) => a.bill.data_vencimento.localeCompare(b.bill.data_vencimento))
  }, [receivables, payables, kind])

  const settle = async (x: Row) => {
    setBusy(x.bill.id)
    try {
      if (x.kind === 'r') await updateR.mutateAsync({ id: x.bill.id, input: receiveInput(x.bill) })
      else await updateP.mutateAsync({ id: x.bill.id, input: payInput() })
    } catch { /* o hook já mostra o erro */ } finally { setBusy(null) }
  }

  return (
    <section aria-label="Contas desta semana" className="fin-card px-4 py-4 sm:px-5">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="fin-cap">Contas desta semana</h2>
        <div className="fin-seg" role="group" aria-label="Mostrar">
          {([['', 'Tudo'], ['r', 'Receber'], ['p', 'Pagar']] as const).map(([k, l]) => (
            <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)}>{l}</button>
          ))}
        </div>
      </div>
      {lr || lp ? (
        <div className="space-y-2 py-2">{[0, 1, 2].map((i) => <div key={i} className="h-12 animate-pulse rounded bg-muted" />)}</div>
      ) : rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          <Check className="mx-auto mb-2 h-6 w-6 text-[#C8A27A]" aria-hidden="true" />
          Nada vencido nem vencendo nos próximos 7 dias.
        </p>
      ) : (
        <ul>
          {rows.map((x) => {
            const n = daysFromToday(x.bill.data_vencimento) ?? 0
            const who = x.kind === 'p' ? (x.bill.fornecedor || x.bill.categoria) : null
            return (
              <li key={`${x.kind}-${x.bill.id}`} className="grid grid-cols-[64px_1fr_auto] items-center gap-x-3 gap-y-2 border-t border-dashed border-border py-2.5 first:border-t-0 sm:grid-cols-[72px_1fr_auto_104px]">
                <span className={`text-[12.5px] leading-tight tabular-nums ${n < 0 ? 'fin-late font-semibold' : 'text-muted-foreground'}`}>
                  {n < 0 ? <>{-n} {n === -1 ? 'dia' : 'dias'}<br />atrasada</> : dayLabel(x.bill.data_vencimento)}
                </span>
                <span className="min-w-0">
                  <b className="block truncate text-sm font-semibold">{x.bill.descricao}</b>
                  <small className="block truncate text-[12px] text-muted-foreground">{x.kind === 'r' ? 'A receber' : 'A pagar'}{who ? ` · ${who}` : ''}</small>
                </span>
                <span className={`text-right text-sm font-semibold tabular-nums ${x.kind === 'r' ? 'fin-pos' : ''}`}>
                  {x.kind === 'r' ? '+ ' : '− '}{brl(Number(x.bill.valor))}
                </span>
                <button type="button" onClick={() => settle(x)} disabled={busy === x.bill.id}
                  className={`${x.kind === 'r' ? 'cli-primary' : 'cli-ghost'} col-span-3 justify-center sm:col-span-1`}
                  style={{ minHeight: 36, padding: '0 10px', fontSize: x.kind === 'r' ? 11.5 : 13 }}>
                  {busy === x.bill.id ? '...' : x.kind === 'r' ? 'Receber' : 'Pagar'}
                </button>
              </li>
            )
          })}
        </ul>
      )}
      <p className="mt-2 flex gap-4 border-t border-border pt-3 text-[13px]">
        <Link href="/financeiro/receber" className="font-semibold text-[#8A4B2C] hover:underline dark:text-[#E39B78]">Todas a receber</Link>
        <Link href="/financeiro/pagar" className="font-semibold text-[#8A4B2C] hover:underline dark:text-[#E39B78]">Todas a pagar</Link>
      </p>
    </section>
  )
}
