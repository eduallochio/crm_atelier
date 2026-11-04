'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useUpdateOrderItems } from '@/hooks/use-service-orders'
import { useServices } from '@/hooks/use-services'
import type { ServiceOrder, ServiceOrderItemInput } from '@/lib/validations/service-order'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatBRL } from './client-utils'
import { numeroOS } from './order-utils'

interface Props {
  /** ordem cujos itens serão editados; null fecha o diálogo */
  order: ServiceOrder | null
  onClose: () => void
}

/** Edita os serviços/itens de uma OS já lançada e recalcula o valor total. */
export function OrderItemsDialog({ order, onClose }: Props) {
  return (
    <Dialog open={!!order} onOpenChange={(v) => { if (!v) onClose() }}>
      {order && <ItemsForm key={order.id} order={order} onClose={onClose} />}
    </Dialog>
  )
}

function ItemsForm({ order, onClose }: { order: ServiceOrder; onClose: () => void }) {
  const updateItems = useUpdateOrderItems()
  const { data: services = [] } = useServices()
  const activeServices = services.filter(s => s.ativo)

  const [items, setItems] = useState<ServiceOrderItemInput[]>(
    (order.items ?? []).map(i => ({
      service_id:     i.service_id ?? '',
      service_nome:   i.service_nome,
      quantidade:     Number(i.quantidade) || 1,
      valor_unitario: Number(i.valor_unitario) || 0,
      valor_total:    Number(i.valor_total) || 0,
      observacoes:    i.observacoes ?? undefined,
    }))
  )
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [descontoValor, setDescontoValor] = useState(Number(order.desconto_valor) || 0)
  const [descontoPercentual, setDescontoPercentual] = useState(Number(order.desconto_percentual) || 0)

  const pago = Number(order.valor_pago) || 0
  const subtotal = items.reduce((sum, item) => sum + (Number(item.valor_total) || 0), 0)
  const valorDesconto = descontoPercentual > 0 ? (subtotal * descontoPercentual) / 100 : descontoValor
  const novoTotal = Math.max(0, subtotal - valorDesconto)
  const abaixoDoPago = novoTotal < pago

  // Se alterar quantidade/valor unitário de um item, recalcula o valor_total dele
  const updateItem = (index: number, patch: Partial<ServiceOrderItemInput>) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item
      const next = { ...item, ...patch }
      next.valor_total = next.quantidade * next.valor_unitario
      return next
    }))
  }

  const addItem = () => {
    const service = activeServices.find(s => s.id === selectedServiceId)
    if (!service) return
    const valor_unitario = Number(service.preco) || 0
    setItems(prev => [...prev, {
      service_id:    service.id,
      service_nome:  service.nome,
      quantidade:    1,
      valor_unitario,
      valor_total:   valor_unitario,
    }])
    setSelectedServiceId('')
  }

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const save = async () => {
    if (items.length === 0) {
      toast.error('Adicione ao menos um serviço')
      return
    }
    if (abaixoDoPago) return
    try {
      await updateItems.mutateAsync({
        id: order.id,
        items,
        desconto_valor: descontoPercentual > 0 ? 0 : descontoValor,
        desconto_percentual: descontoPercentual,
      })
      onClose()
    } catch { /* o hook já mostra o erro */ }
  }

  const field = 'h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-[#C8714A] focus:ring-3 focus:ring-[#C8714A]/15'

  return (
    <DialogContent className="w-[calc(100vw-2rem)] max-w-xl rounded-xl p-6">
      <DialogHeader>
        <DialogTitle className="font-serif-display text-[26px] font-normal leading-tight">
          Editar serviços <span className="text-muted-foreground">{numeroOS(order.numero)}</span>
        </DialogTitle>
        <DialogDescription>Ajuste os serviços, quantidades e valores desta ordem.</DialogDescription>
      </DialogHeader>

      <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nenhum serviço adicionado.</p>
        ) : (
          items.map((item, index) => (
            <div key={index} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.service_nome}</p>
              </div>
              <input
                type="number" min={1} value={item.quantidade}
                onChange={(e) => updateItem(index, { quantidade: Math.max(1, Number(e.target.value) || 1) })}
                onWheel={(e) => e.currentTarget.blur()}
                className="h-9 w-16 rounded-md border border-border bg-background px-2 text-center text-sm outline-none focus:border-[#C8714A]"
                aria-label={`Quantidade de ${item.service_nome}`}
              />
              <input
                type="number" min={0} step="any" value={item.valor_unitario}
                onChange={(e) => updateItem(index, { valor_unitario: Math.max(0, Number(e.target.value) || 0) })}
                onWheel={(e) => e.currentTarget.blur()}
                className="h-9 w-24 rounded-md border border-border bg-background px-2 text-sm outline-none focus:border-[#C8714A]"
                aria-label={`Valor unitário de ${item.service_nome}`}
              />
              <span className="w-20 shrink-0 text-right text-sm font-semibold tabular-nums">{formatBRL(item.valor_total)}</span>
              <button type="button" onClick={() => removeItem(index)} className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-red-600/10 hover:text-red-600" aria-label={`Remover ${item.service_nome}`}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center gap-2">
        <select value={selectedServiceId} onChange={(e) => setSelectedServiceId(e.target.value)} className={`${field} flex-1`}>
          <option value="">Adicionar serviço...</option>
          {activeServices.map(s => <option key={s.id} value={s.id}>{s.nome} — {formatBRL(Number(s.preco) || 0)}</option>)}
        </select>
        <button type="button" onClick={addItem} disabled={!selectedServiceId} className="cli-ghost shrink-0" style={{ minHeight: 44 }}>
          <Plus className="h-4 w-4" aria-hidden="true" /> Adicionar
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-medium text-muted-foreground">
          Desconto (R$)
          <input type="number" min={0} step="any" value={descontoPercentual > 0 ? '' : descontoValor}
            disabled={descontoPercentual > 0}
            onChange={(e) => setDescontoValor(Math.max(0, Number(e.target.value) || 0))}
            onWheel={(e) => e.currentTarget.blur()}
            className={`${field} mt-1.5 text-foreground disabled:opacity-50`} title={descontoPercentual > 0 ? 'Zere o desconto percentual para usar valor fixo' : undefined} />
        </label>
        <label className="block text-xs font-medium text-muted-foreground">
          Desconto (%)
          <input type="number" min={0} max={100} step="any" value={descontoPercentual || ''}
            onChange={(e) => {
              const v = Math.min(100, Math.max(0, Number(e.target.value) || 0))
              setDescontoPercentual(v)
              // Zera o desconto fixo ao usar percentual (e vice-versa) — são
              // modos mutuamente exclusivos; sem isso, um valor fixo antigo
              // fica "escondido" no estado e reaparece ao zerar o percentual
              if (v > 0) setDescontoValor(0)
            }}
            onWheel={(e) => e.currentTarget.blur()}
            className={`${field} mt-1.5 text-foreground`} />
        </label>
      </div>

      <div className="space-y-1 rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm tabular-nums">
        <p className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatBRL(subtotal)}</span></p>
        {valorDesconto > 0 && <p className="flex justify-between text-muted-foreground"><span>Desconto</span><span>− {formatBRL(valorDesconto)}</span></p>}
        <p className="flex justify-between text-[16px] font-semibold"><span>Novo total</span><span>{formatBRL(novoTotal)}</span></p>
        {pago > 0 && <p className="flex justify-between text-muted-foreground"><span>Já pago</span><span>{formatBRL(pago)}</span></p>}
      </div>

      {abaixoDoPago && (
        <p className="rounded-lg border border-red-600/30 bg-red-600/10 px-3 py-2 text-[13px] text-red-700 dark:text-red-400">
          O novo total não pode ficar menor que o valor já pago ({formatBRL(pago)}). Ajuste o desconto ou os serviços.
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onClose} disabled={updateItems.isPending}
          className="cli-ghost flex-1 justify-center">
          Cancelar
        </button>
        <button type="button" onClick={save} disabled={updateItems.isPending || items.length === 0 || abaixoDoPago}
          className="cli-primary flex-1 justify-center" style={{ minHeight: 44 }}>
          {updateItems.isPending ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>
    </DialogContent>
  )
}
