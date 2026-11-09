'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useUpdateOrderEmbalagens } from '@/hooks/use-service-orders'
import type { Product } from '@/hooks/use-inventory'
import type { ServiceOrder } from '@/lib/validations/service-order'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { numeroOS } from './order-utils'

interface EmbalagemRow {
  product_id?: string | null
  nome: string
  quantidade: number
  unidade: string
}

interface Props {
  /** ordem cuja embalagem será editada; null fecha o diálogo */
  order: ServiceOrder | null
  onClose: () => void
}

/** Edita a embalagem de uma OS já lançada (pendente/em andamento). */
export function OrderEmbalagensDialog({ order, onClose }: Props) {
  return (
    <Dialog open={!!order} onOpenChange={(v) => { if (!v) onClose() }}>
      {order && <EmbalagensForm key={order.id} order={order} onClose={onClose} />}
    </Dialog>
  )
}

function EmbalagensForm({ order, onClose }: { order: ServiceOrder; onClose: () => void }) {
  const updateEmbalagens = useUpdateOrderEmbalagens()

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch('/api/inventory/products')
      if (!res.ok) throw new Error('Erro ao buscar produtos')
      return res.json()
    },
  })
  const activeEmbalagemProducts = products.filter(p => p.ativo && p.is_embalagem)

  const [embalagens, setEmbalagens] = useState<EmbalagemRow[]>(
    (order.embalagens ?? []).map(e => ({
      product_id: e.product_id,
      nome: e.nome,
      quantidade: Number(e.quantidade) || 1,
      unidade: e.unidade || 'un',
    }))
  )
  const [selectedProductId, setSelectedProductId] = useState('')
  const [quantidade, setQuantidade] = useState(1)

  const addEmbalagem = () => {
    const product = activeEmbalagemProducts.find(p => p.id === selectedProductId)
    if (!product) return
    setEmbalagens(prev => [...prev, {
      product_id: product.id,
      nome: product.nome,
      quantidade,
      unidade: product.unidade || 'un',
    }])
    setSelectedProductId('')
    setQuantidade(1)
  }

  const removeEmbalagem = (index: number) => {
    setEmbalagens(prev => prev.filter((_, i) => i !== index))
  }

  const save = async () => {
    try {
      await updateEmbalagens.mutateAsync({ id: order.id, embalagens })
      onClose()
    } catch { /* o hook já mostra o erro */ }
  }

  const field = 'h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-[#C8714A] focus:ring-3 focus:ring-[#C8714A]/15'

  return (
    <DialogContent className="w-[calc(100vw-2rem)] max-w-xl rounded-xl p-6">
      <DialogHeader>
        <DialogTitle className="font-serif-display text-[26px] font-normal leading-tight">
          Editar embalagem <span className="text-muted-foreground">{numeroOS(order.numero)}</span>
        </DialogTitle>
        <DialogDescription>Ajuste as embalagens desta ordem.</DialogDescription>
      </DialogHeader>

      <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
        {embalagens.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma embalagem adicionada.</p>
        ) : (
          embalagens.map((e, index) => (
            <div key={index} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5">
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{e.nome}</span>
              <span className="shrink-0 text-sm text-muted-foreground">{e.quantidade} {e.unidade}</span>
              <button type="button" onClick={() => removeEmbalagem(index)} className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-red-600/10 hover:text-red-600" aria-label={`Remover ${e.nome}`}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center gap-2">
        <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} className={`${field} flex-1`}>
          <option value="">Adicionar embalagem...</option>
          {activeEmbalagemProducts.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
        <input
          type="number" min={0.001} step="any" value={quantidade}
          onChange={(e) => setQuantidade(Math.max(0.001, Number(e.target.value) || 1))}
          onWheel={(e) => e.currentTarget.blur()}
          className="h-11 w-20 rounded-lg border border-border bg-background px-2 text-center text-sm outline-none focus:border-[#C8714A]"
          aria-label="Quantidade"
        />
        <button type="button" onClick={addEmbalagem} disabled={!selectedProductId} className="cli-ghost shrink-0" style={{ minHeight: 44 }}>
          <Plus className="h-4 w-4" aria-hidden="true" /> Adicionar
        </button>
      </div>

      {activeEmbalagemProducts.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Nenhum produto marcado como embalagem. Cadastre em Estoque → Novo produto, marcando “Este produto é embalagem”.
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onClose} disabled={updateEmbalagens.isPending}
          className="cli-ghost flex-1 justify-center">
          Cancelar
        </button>
        <button type="button" onClick={save} disabled={updateEmbalagens.isPending}
          className="cli-primary flex-1 justify-center" style={{ minHeight: 44 }}>
          {updateEmbalagens.isPending ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>
    </DialogContent>
  )
}
