'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Landmark, Lock } from 'lucide-react'
import { Header } from '@/components/layouts/header'
import { Loader } from '@/components/ui/loader'
import { useCashierSession, useCashierMovements, useCloseCashier } from '@/hooks/use-cashier'
import { AddMovementDialog } from '@/components/financeiro/add-movement-dialog'
import { CloseCashierDialog } from '@/components/financeiro/close-cashier-dialog'
import { MOVE_ICON, MOVE_LABEL, isInflow, sessionTotals, useUnlaunchedOrders, type MoveKind } from '@/components/financeiro/cash-drawer'
import { MASTER_DETAIL_CSS } from '@/components/dashboard/master-detail-css'
import { FIN_CSS, FinanceTabs, brl, dateTimeOf, shortDate, timeOf } from '@/components/financeiro/finance-ui'

/** Uma sessão de caixa: lançamentos rápidos, linha do tempo dos movimentos, OS pagas fora do caixa e fechamento */
export default function SessaoCaixaPage() {
  const router = useRouter()
  const sessaoId = useParams().id as string
  const { data: sessao, isLoading } = useCashierSession(sessaoId)
  const { data: movimentos = [], isLoading: loadingMoves } = useCashierMovements(sessaoId)
  const closeCashier = useCloseCashier()
  const aberta = sessao?.status === 'aberto'
  const unl = useUnlaunchedOrders(!!aberta)
  const [adding, setAdding] = useState<MoveKind | null>(null)
  const [closing, setClosing] = useState(false)

  if (isLoading) return <Loader className="min-h-[60vh]" text="Carregando..." />
  if (!sessao) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-sm text-muted-foreground">
        <style>{MASTER_DETAIL_CSS}</style>
        Sessão não encontrada
        <Link href="/financeiro/caixa" className="cli-ghost"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Voltar aos caixas</Link>
      </div>
    )
  }

  const t = sessionTotals(sessao.saldo_inicial, movimentos)
  const nome = sessao.org_cashiers?.nome || 'Caixa'
  const dif = Number(sessao.diferenca) || 0
  const timeline = [
    ...movimentos,
    { id: 'abertura', tipo: 'abertura', valor: t.inicial, descricao: 'Abertura do caixa', created_at: sessao.data_abertura } as const,
  ]

  return (
    <div>
      <style>{MASTER_DETAIL_CSS + FIN_CSS}</style>
      <Header title="Financeiro" description="Caixas e sessões" />
      <FinanceTabs />

      <div className="p-3 sm:p-6">
        <Link href="/financeiro/caixa" className="mb-3 -ml-1 inline-flex min-h-10 items-center gap-2 rounded-md px-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Todos os caixas
        </Link>

        <div className="grid items-start gap-4 lg:grid-cols-[1fr_360px] lg:gap-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-serif-display text-[34px] leading-none text-foreground sm:text-[38px]">{nome}</h2>
              {aberta
                ? <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-emerald-600/12 px-3 text-[12.5px] font-semibold text-emerald-800 dark:text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-600" aria-hidden="true" />Aberto {dateTimeOf(sessao.data_abertura)}</span>
                : <span className="inline-flex h-7 items-center rounded-full bg-muted px-3 text-[12.5px] font-semibold text-muted-foreground">Fechado {dateTimeOf(sessao.data_fechamento)}</span>}
            </div>
            <p className="mt-1.5 text-[13.5px] text-muted-foreground">
              {aberta ? 'Tudo que entra e sai da gaveta fica registrado aqui.' : `Sessão de ${shortDate(sessao.data_abertura)}.`}
            </p>

            {aberta && (
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(Object.keys(MOVE_LABEL) as MoveKind[]).map((k) => {
                  const Icon = MOVE_ICON[k]
                  return (
                    <button key={k} type="button" onClick={() => setAdding(k)}
                      className="flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-card text-[13.5px] font-medium transition-colors hover:border-[#D4A85A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8714A]">
                      <Icon className="h-5 w-5 text-[#C8714A]" aria-hidden="true" />{MOVE_LABEL[k]}
                    </button>
                  )
                })}
              </div>
            )}

            <section aria-labelledby="mv-h" className="fin-card mt-4 px-4 py-4 sm:px-5">
              <div className="flex items-center justify-between">
                <h3 id="mv-h" className="fin-cap">{aberta ? 'Movimentos de hoje' : 'Movimentos'}</h3>
                <span className="text-[12.5px] text-muted-foreground">{movimentos.length} {movimentos.length === 1 ? 'movimento' : 'movimentos'}</span>
              </div>
              {loadingMoves ? (
                <div className="space-y-2 pt-3">{[0, 1, 2].map((i) => <div key={i} className="h-10 animate-pulse rounded bg-muted" />)}</div>
              ) : (
                <ol className="cx-tl mt-1">
                  {timeline.map((m) => {
                    const inflow = m.tipo === 'abertura' || isInflow(m.tipo)
                    return (
                      <li key={m.id} className={`${inflow ? '' : 'out'} ${m.tipo === 'abertura' ? 'ab' : ''}`}>
                        <span className="text-[12.5px] tabular-nums text-muted-foreground">{timeOf(m.created_at)}</span>
                        <span className="min-w-0">
                          <b className="text-sm font-semibold">{m.descricao || (m.tipo === 'abertura' ? 'Abertura' : MOVE_LABEL[m.tipo])}</b>
                          <span className={`mv-tag ${m.tipo}`}>{m.tipo === 'abertura' ? 'Abertura' : MOVE_LABEL[m.tipo]}</span>
                          {'forma_pagamento' in m && m.forma_pagamento && (
                            <span className="ml-1.5 text-[11.5px] text-muted-foreground">· {m.forma_pagamento}</span>
                          )}
                        </span>
                        <span className={`text-sm font-semibold tabular-nums ${m.tipo === 'entrada' || m.tipo === 'reforco' ? 'fin-pos' : ''}`}>
                          {m.tipo === 'abertura' ? '' : inflow ? '+ ' : '− '}{brl(Number(m.valor))}
                        </span>
                      </li>
                    )
                  })}
                </ol>
              )}
            </section>
          </div>

          <aside className="space-y-3">
            <div className="fin-card px-5 py-4">
              <p className="fin-cap">{aberta ? 'Na gaveta agora' : 'O sistema esperava'}</p>
              <p className="fin-num mt-2 text-[44px]">{brl(aberta ? t.gaveta : Number(sessao.saldo_esperado ?? t.gaveta))}</p>
              <dl className="mt-3 grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5 text-[13.5px]">
                <dt className="text-muted-foreground">Saldo inicial</dt><dd className="text-right font-semibold tabular-nums">{brl(t.inicial)}</dd>
                <dt className="text-muted-foreground">Entradas</dt><dd className="fin-pos text-right font-semibold tabular-nums">{brl(t.entradas)}</dd>
                <dt className="text-muted-foreground">Saídas</dt><dd className="text-right font-semibold tabular-nums">{brl(t.saidas)}</dd>
                <dt className="text-muted-foreground">Sangrias</dt><dd className="text-right font-semibold tabular-nums">{brl(t.sangrias)}</dd>
                <dt className="text-muted-foreground">Reforços</dt><dd className="text-right font-semibold tabular-nums">{brl(t.reforcos)}</dd>
                {!aberta && sessao.saldo_real != null && (
                  <>
                    <dt className="border-t border-dashed border-border pt-2 text-muted-foreground">Contado no fechamento</dt>
                    <dd className="border-t border-dashed border-border pt-2 text-right font-semibold tabular-nums">{brl(Number(sessao.saldo_real))}</dd>
                  </>
                )}
              </dl>
              {!aberta && sessao.saldo_real != null && (
                <p className={`mt-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium ${Math.abs(dif) < 0.01 ? 'bg-emerald-600/10 fin-pos' : dif < 0 ? 'bg-red-600/10 fin-late' : 'bg-[#D4A85A]/15 text-[#7A5A1E] dark:text-[#E8C98A]'}`}>
                  {Math.abs(dif) < 0.01 ? 'Bateu certinho com o esperado.' : dif < 0 ? `Faltaram ${brl(-dif)} na gaveta.` : `Sobraram ${brl(dif)} na gaveta.`}
                </p>
              )}
              {!aberta && sessao.saldo_real == null && (
                <p className="mt-3 rounded-lg bg-[#D4A85A]/15 px-3 py-2.5 text-[13.5px] font-medium text-[#7A5A1E] dark:text-[#E8C98A]">
                  Fechamento automático — sem conferência de dinheiro físico.
                </p>
              )}
              {!aberta && sessao.observacoes_fechamento && <p className="mt-3 whitespace-pre-line text-[13px] text-muted-foreground">{sessao.observacoes_fechamento}</p>}
            </div>

            {aberta && unl.list.length > 0 && (
              <div className="rounded-xl border border-dashed border-[#D4A85A] bg-[#D4A85A]/8 px-5 py-4">
                <p className="fin-cap text-[#7A5A1E] dark:text-[#E8C98A]">Pagas e ainda fora do caixa</p>
                <p className="mt-1 text-[12.5px] text-muted-foreground">Ordens pagas em PIX ou dinheiro que ainda não entraram em nenhum caixa.</p>
                <ul className="mt-2">
                  {unl.list.map((o) => (
                    <li key={o.id} className="flex items-center justify-between gap-2 border-t border-dashed border-[#D4A85A]/40 py-2 text-[13px] first:border-t-0">
                      <span className="min-w-0">
                        <b className="block truncate font-semibold">#{String(o.numero ?? 0).padStart(6, '0')} · {o.clienteNome || 'Cliente não informado'}</b>
                        <small className="text-muted-foreground capitalize">{o.formaPagamento || 'Forma não informada'}{o.dataConclusao ? ` · ${shortDate(o.dataConclusao, false)}` : ''}</small>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <b className="tabular-nums">{brl(Number(o.valorTotal) || 0)}</b>
                        <button type="button" className="cli-ghost" style={{ minHeight: 34, padding: '0 10px', fontSize: 12.5 }}
                          onClick={() => unl.launch(o.id)} disabled={!!unl.busy} aria-label={`Lançar a OS ${o.numero} no caixa`}>
                          <Landmark className="h-3.5 w-3.5" aria-hidden="true" />{unl.busy === o.id ? '...' : 'Lançar'}
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
                {unl.list.length > 1 && (
                  <button type="button" className="cli-ghost mt-2 w-full justify-center" style={{ minHeight: 38 }} onClick={unl.launchAll} disabled={!!unl.busy}>
                    {unl.busy === 'all' ? 'Lançando...' : `Lançar ${unl.list.length === 2 ? 'as duas' : `todas as ${unl.list.length}`} no caixa`}
                  </button>
                )}
              </div>
            )}

            {aberta && (
              <button type="button" className="cli-primary w-full justify-center" style={{ minHeight: 46 }} onClick={() => setClosing(true)}>
                <Lock className="h-4 w-4" aria-hidden="true" /> Fechar caixa
              </button>
            )}
          </aside>
        </div>
      </div>

      {adding && <AddMovementDialog sessaoId={sessaoId} type={adding} onClose={() => setAdding(null)} />}
      {closing && sessao.id && (
        <CloseCashierDialog
          sessao={{ id: sessao.id, caixa_id: sessao.caixa_id, saldo_inicial: Number(sessao.saldo_inicial) || 0, status: sessao.status }}
          saldoEsperado={t.gaveta}
          onClose={() => setClosing(false)}
          isLoading={closeCashier.isPending}
          onConfirm={async (data) => {
            try {
              await closeCashier.mutateAsync({ sessaoId, saldo_esperado: t.gaveta, ...data })
              setClosing(false)
              router.push('/financeiro/caixa')
            } catch { /* o hook já mostra o erro */ }
          }}
        />
      )}
    </div>
  )
}
