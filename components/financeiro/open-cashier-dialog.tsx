'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useCashiers, useCashierSessions, useOpenCashier } from '@/hooks/use-cashier'
import { parseMoney } from '@/lib/utils/money'

const SERIF = { fontFamily: "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif" }

/**
 * Abre o caixa sem sair da tela: escolhe o caixa (quando há mais de um fechado),
 * informa o dinheiro que já está na gaveta e pronto. Mesma abertura da tela /financeiro/caixa/abrir.
 */
export function OpenCashierDialog({ open, onClose, caixaId }: { open: boolean; onClose: () => void; caixaId?: string }) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      {open && <OpenForm onClose={onClose} caixaId={caixaId} />}
    </Dialog>
  )
}

function OpenForm({ onClose, caixaId }: { onClose: () => void; caixaId?: string }) {
  const { data: cashiers = [], isLoading } = useCashiers()
  const { data: openSessions = [] } = useCashierSessions({ status: 'aberto' })
  const openCashier = useOpenCashier()
  const [picked, setPicked] = useState(caixaId)
  const [valor, setValor] = useState('')
  const [obs, setObs] = useState('')

  const abertos = new Set(openSessions.map((s) => s.caixa_id))
  const ativos = cashiers.filter((c) => c.ativo !== false)
  const fechados = ativos.filter((c) => c.id && !abertos.has(c.id))
  const current = fechados.find((c) => c.id === picked) ?? fechados[0]

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!current?.id) return
    try {
      await openCashier.mutateAsync({
        caixa_id: current.id,
        saldo_inicial: parseMoney(valor),
        observacoes_abertura: obs.trim() || undefined,
        status: 'aberto',
      })
      onClose()
    } catch { /* o hook já mostra o erro */ }
  }

  const field = 'w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-[#C8714A] focus:ring-3 focus:ring-[#C8714A]/15'

  return (
    <DialogContent className="w-[calc(100vw-2rem)] rounded-xl sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="text-[28px] font-normal leading-tight" style={SERIF}>Abrir o caixa</DialogTitle>
        <DialogDescription>Conte o dinheiro que já está na gaveta: é o troco para começar o dia.</DialogDescription>
      </DialogHeader>

      {isLoading ? (
        <div className="space-y-3" aria-busy="true">
          <div className="h-14 animate-pulse rounded-lg bg-muted" />
          <div className="h-11 animate-pulse rounded-lg bg-muted" />
        </div>
      ) : ativos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-5 text-center">
          <p className="text-sm text-muted-foreground">Você ainda não tem um caixa cadastrado. Cadastre o primeiro (ex.: “Gaveta do balcão”) para poder abrir.</p>
          <Link href="/financeiro/caixa/cadastro" onClick={onClose} className="cli-primary mt-4 inline-flex"><Plus className="h-4 w-4" aria-hidden="true" />Cadastrar um caixa</Link>
        </div>
      ) : !current ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-5 text-center">
          <p className="text-sm text-muted-foreground">Todos os seus caixas já estão abertos.</p>
          <div className="mt-4"><button type="button" className="cli-ghost" onClick={onClose}>Fechar</button></div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {fechados.length > 1 ? (
            <fieldset>
              <legend className="mb-2 text-xs font-medium text-muted-foreground">Qual caixa?</legend>
              <div className="grid gap-2" role="radiogroup">
                {fechados.map((c) => {
                  const on = c.id === current.id
                  return (
                    <label key={c.id} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-3.5 py-2.5 transition-colors ${on ? 'border-[#C8714A] bg-[#C8714A]/8' : 'border-border hover:bg-muted/50'}`}>
                      <input type="radio" name="caixa" value={c.id} checked={on} onChange={() => setPicked(c.id)} className="h-4 w-4 accent-[#C8714A]" />
                      <span className="min-w-0">
                        <b className="block truncate text-sm font-semibold text-foreground">{c.nome}</b>
                        {c.descricao && <small className="block truncate text-[12px] text-muted-foreground">{c.descricao}</small>}
                      </span>
                    </label>
                  )
                })}
              </div>
            </fieldset>
          ) : (
            <div className="rounded-lg border border-border/70 bg-muted/40 px-3.5 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Caixa</p>
              <p className="mt-0.5 text-sm font-semibold text-foreground">{current.nome}</p>
              {current.descricao && <p className="text-[12px] text-muted-foreground">{current.descricao}</p>}
            </div>
          )}

          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Dinheiro na gaveta agora</span>
            <span className="mt-1.5 flex items-center gap-2 rounded-lg border border-border bg-background px-3 focus-within:border-[#C8714A] focus-within:ring-3 focus-within:ring-[#C8714A]/15">
              <span className="text-[22px] text-muted-foreground" style={SERIF} aria-hidden="true">R$</span>
              <input autoFocus inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00"
                aria-describedby="open-cash-hint"
                className="h-14 w-full bg-transparent text-[30px] tabular-nums text-foreground outline-none placeholder:text-muted-foreground/50" style={SERIF} />
            </span>
            <span id="open-cash-hint" className="mt-1 block text-[12px] text-muted-foreground">Pode deixar em branco se a gaveta começa vazia.</span>
          </label>

          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Observação (opcional)</span>
            <textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2} placeholder="Ex.: troco separado ontem"
              className={`${field} mt-1.5 resize-none py-2.5`} />
          </label>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="cli-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="cli-primary" style={{ minHeight: 44 }} disabled={openCashier.isPending}>
              {openCashier.isPending ? 'Abrindo...' : 'Abrir caixa'}
            </button>
          </div>
        </form>
      )}
    </DialogContent>
  )
}
