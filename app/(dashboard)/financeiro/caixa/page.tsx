'use client'

import Link from 'next/link'
import { ArrowRight, Pencil, Plus, Wallet } from 'lucide-react'
import { Header } from '@/components/layouts/header'
import { useCashiers, useCashierSessions } from '@/hooks/use-cashier'
import { MASTER_DETAIL_CSS } from '@/components/dashboard/master-detail-css'
import { FIN_CSS, FinanceTabs, brl, dateTimeOf } from '@/components/financeiro/finance-ui'

/** Caixas cadastrados (abrir, ver a sessão, editar) e o histórico das últimas sessões fechadas */
export default function CaixaPage() {
  const { data: caixas = [], isLoading } = useCashiers()
  const { data: sessoes = [] } = useCashierSessions()
  const abertas = sessoes.filter((s) => s.status === 'aberto')
  const fechadas = sessoes.filter((s) => s.status === 'fechado').slice(0, 8)

  return (
    <div>
      <style>{MASTER_DETAIL_CSS + FIN_CSS}</style>
      <Header
        title="Financeiro"
        description="Caixas e sessões"
        action={
          <Link href="/financeiro/caixa/cadastro" className="cli-primary">
            <Plus className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">Novo caixa</span><span className="sm:hidden">Novo</span>
          </Link>
        }
      />
      <FinanceTabs />

      <div className="space-y-6 p-3 sm:p-6">
        <section aria-labelledby="cx-meus">
          <h2 id="cx-meus" className="fin-cap mb-3">Meus caixas</h2>
          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{[0, 1].map((i) => <div key={i} className="h-36 animate-pulse rounded-xl bg-muted" />)}</div>
          ) : caixas.length === 0 ? (
            <div className="fin-card px-6 py-12 text-center text-sm text-muted-foreground">
              <Wallet className="mx-auto h-7 w-7 text-[#C8A27A]" aria-hidden="true" />
              <p className="mt-3 mb-1 font-serif-display text-2xl text-foreground">Nenhum caixa cadastrado</p>
              Cadastre um caixa (a gaveta do ateliê, ou uma conta PIX) para registrar o que entra e sai no dia a dia.
              <div className="mt-4"><Link href="/financeiro/caixa/cadastro" className="cli-primary"><Plus className="h-4 w-4" aria-hidden="true" />Cadastrar o primeiro caixa</Link></div>
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {caixas.map((c) => {
                const aberta = abertas.find((s) => s.caixa_id === c.id)
                return (
                  <li key={c.id} className={aberta ? 'drawer px-5 py-4' : 'fin-card px-5 py-4'}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-[15px] font-semibold">{c.nome}</h3>
                        <p className={`mt-0.5 truncate text-[13px] ${aberta ? 'dr-soft' : 'text-muted-foreground'}`}>{c.descricao || (c.chave_pix ? 'Recebimentos por PIX' : 'Sem descrição')}</p>
                      </div>
                      {aberta ? <span className="dr-pill shrink-0">Aberto</span>
                        : c.ativo === false ? <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-[11.5px] font-semibold text-muted-foreground">Inativo</span>
                        : <span className="shrink-0 rounded-full border border-dashed border-border px-2.5 py-0.5 text-[11.5px] font-semibold text-muted-foreground">Fechado</span>}
                    </div>
                    <p className={`mt-3 text-[13px] ${aberta ? 'dr-soft' : 'text-muted-foreground'}`}>
                      {aberta ? <>Aberto {dateTimeOf(aberta.data_abertura)} · inicial {brl(Number(aberta.saldo_inicial))}</> : 'Pronto para abrir quando o dia começar'}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {aberta ? (
                        <Link href={`/financeiro/caixa/sessao/${aberta.id}`} className="dr-ghost">Ver o caixa <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
                      ) : c.ativo !== false && (
                        <Link href={`/financeiro/caixa/abrir/${c.id}`} className="cli-primary" style={{ minHeight: 40 }}>Abrir caixa</Link>
                      )}
                      <Link href={`/financeiro/caixa/${c.id}/editar`} className={aberta ? 'dr-ghost' : 'cli-ghost'} style={{ minHeight: 40 }}>
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Editar
                      </Link>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {fechadas.length > 0 && (
          <section aria-labelledby="cx-hist" className="fin-card px-4 py-4 sm:px-5">
            <h2 id="cx-hist" className="fin-cap mb-1">Últimas sessões fechadas</h2>
            <ul>
              {fechadas.map((s) => {
                const dif = Number(s.diferenca) || 0
                return (
                  <li key={s.id} className="border-t border-dashed border-border first:border-t-0">
                    <Link href={`/financeiro/caixa/sessao/${s.id}`}
                      className="-mx-2 grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-0.5 rounded-lg px-2 py-3 transition-colors hover:bg-muted/50 sm:grid-cols-[1fr_auto_auto]">
                      <span className="min-w-0">
                        <b className="block truncate text-sm font-semibold">{s.org_cashiers?.nome || 'Caixa'}</b>
                        <small className="block text-[12.5px] text-muted-foreground">Fechado {dateTimeOf(s.data_fechamento)}</small>
                      </span>
                      <span className="text-right text-sm font-semibold tabular-nums">{brl(Number(s.saldo_real) || 0)}</span>
                      <span className={`col-span-2 text-[12.5px] font-semibold sm:col-span-1 sm:w-36 sm:text-right ${Math.abs(dif) < 0.01 ? 'fin-pos' : dif < 0 ? 'fin-late' : 'text-[#7A5A1E] dark:text-[#E8C98A]'}`}>
                        {Math.abs(dif) < 0.01 ? 'Bateu certinho' : dif < 0 ? `Faltaram ${brl(-dif)}` : `Sobraram ${brl(dif)}`}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}
