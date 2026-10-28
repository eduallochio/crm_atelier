'use client'

import { useState } from 'react'
import { CheckCircle2, ReceiptText, CircleDashed } from 'lucide-react'
import { toast } from 'sonner'
import { useUpdateServiceOrder } from '@/hooks/use-service-orders'
import { useActivePaymentMethods } from '@/hooks/use-payment-methods'
import type { ServiceOrder } from '@/lib/validations/service-order'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatBRL } from './client-utils'
import { numeroOS, saldoOf } from './order-utils'
import { todayISO } from '@/components/financeiro/finance-ui'

interface Props {
  /** ordem a concluir/receber; null fecha o diálogo */
  order: ServiceOrder | null
  onClose: () => void
}

/**
 * Concluir uma ordem com saldo em aberto (ou registrar o pagamento de uma já concluída):
 * "Sim" lança no caixa com a forma e a data escolhidas, "Não" gera a conta a receber.
 * Mesma regra que existia na tabela de ordens.
 */
export function OrderPaymentDialog({ order, onClose }: Props) {
  return (
    <Dialog open={!!order} onOpenChange={(v) => { if (!v) onClose() }}>
      {order && <PaymentForm key={order.id} order={order} onClose={onClose} />}
    </Dialog>
  )
}

function PaymentForm({ order, onClose }: { order: ServiceOrder; onClose: () => void }) {
  const updateOrder = useUpdateServiceOrder()
  const { data: paymentMethods = [] } = useActivePaymentMethods()
  const [method, setMethod] = useState(order.forma_pagamento || '')
  const [date, setDate] = useState(() => todayISO())
  const saldo = saldoOf(order)

  const pay = async () => {
    if (!method) { toast.error('Selecione a forma de pagamento'); return }
    try {
      const result = await updateOrder.mutateAsync({
        id: order.id,
        input: { status: 'concluido', payment_action: 'paid', forma_pagamento: method, payment_date: date },
      })
      if (result.no_cashier_session) {
        if (method.toLowerCase().includes('pix')) {
          toast.warning(
            'OS concluída como paga, mas o valor não foi lançado no caixa pois não há nenhum caixa aberto. ' +
            'Para registrar recebimentos via PIX, cadastre um caixa com a chave PIX correspondente (ex: "Nubank PIX", "Conta PIX") ' +
            'em Financeiro → Caixa, e abra uma sessão antes de finalizar as ordens.',
            { duration: 10000 },
          )
        } else {
          toast.success('OS concluída e registrada como paga!')
        }
      }
    } catch { /* o hook já mostra o erro */ } finally {
      onClose()
    }
  }

  const receivable = async () => {
    try {
      await updateOrder.mutateAsync({ id: order.id, input: { status: 'concluido', payment_action: 'receivable' } })
    } catch { /* o hook já mostra o erro */ } finally {
      onClose()
    }
  }

  const undecided = async () => {
    try {
      await updateOrder.mutateAsync({ id: order.id, input: { status: 'concluido', payment_action: 'undecided' } })
      toast.success('OS concluída. O pagamento pode ser registrado depois.')
    } catch { /* o hook já mostra o erro */ } finally {
      onClose()
    }
  }

  const field = 'h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-[#C8714A] focus:ring-3 focus:ring-[#C8714A]/15'

  return (
    <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-xl p-6">
      <DialogHeader>
        <DialogTitle className="font-serif-display text-[26px] font-normal leading-tight">
          {order.status === 'concluido' ? 'Registrar pagamento' : 'Concluir ordem'} <span className="text-muted-foreground">{numeroOS(order.numero)}</span>
        </DialogTitle>
        <DialogDescription>A OS foi paga pelo cliente?</DialogDescription>
      </DialogHeader>

      <div className="rounded-xl border border-[#D4A85A]/50 bg-[#D4A85A]/10 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Saldo em aberto</p>
        <p className="mt-1 font-serif-display text-[34px] leading-none tabular-nums text-foreground">{formatBRL(saldo)}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-medium text-muted-foreground">
          Forma de pagamento
          <select value={method} onChange={(e) => setMethod(e.target.value)} className={`${field} mt-1.5 text-foreground`}>
            <option value="">Selecione...</option>
            {paymentMethods.map((m) => <option key={m.id} value={m.code}>{m.name}</option>)}
          </select>
        </label>
        <label className="block text-xs font-medium text-muted-foreground">
          Data do pagamento
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${field} mt-1.5 text-foreground`} />
        </label>
      </div>

      <div className="flex flex-col gap-2 pt-1">
        <button type="button" onClick={pay} disabled={updateOrder.isPending || !method}
          className="cli-primary w-full justify-center" style={{ minHeight: 46 }}>
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Sim — lançar no caixa
        </button>
        <button type="button" onClick={receivable} disabled={updateOrder.isPending}
          className="cli-ghost w-full justify-center">
          <ReceiptText className="h-4 w-4" aria-hidden="true" /> Não — gerar conta a receber
        </button>
        <button type="button" onClick={undecided} disabled={updateOrder.isPending}
          className="cli-ghost w-full justify-center text-muted-foreground" title="Conclui a OS sem lançar no caixa nem gerar conta a receber — decida o pagamento depois pelo aviso de pendência">
          <CircleDashed className="h-4 w-4" aria-hidden="true" /> Decidir depois
        </button>
        <button type="button" onClick={onClose} disabled={updateOrder.isPending}
          className="min-h-10 rounded-md text-sm text-muted-foreground hover:text-foreground">
          Cancelar
        </button>
      </div>
    </DialogContent>
  )
}
