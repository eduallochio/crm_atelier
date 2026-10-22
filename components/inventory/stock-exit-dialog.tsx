'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useCreateStockExit, useProducts, type Product } from '@/hooks/use-inventory'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type Row = { productId: string; produtoNome: string; quantidade: number; unidade: string }
const EMPTY: Row = { productId: '', produtoNome: '', quantidade: 1, unidade: 'un' }
const rowOf = (p?: Product | null): Row => (p ? { productId: p.id, produtoNome: p.nome, quantidade: 1, unidade: p.unidade || 'un' } : { ...EMPTY })

/** Saída manual de estoque (mesma regra de antes), opcionalmente já com um produto escolhido */
export function StockExitDialog({ open, onOpenChange, defaultProduct }: { open: boolean; onOpenChange: (v: boolean) => void; defaultProduct?: Product | null }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && <ExitForm key={defaultProduct?.id ?? 'novo'} defaultProduct={defaultProduct} onDone={() => onOpenChange(false)} />}
    </Dialog>
  )
}

function ExitForm({ defaultProduct, onDone }: { defaultProduct?: Product | null; onDone: () => void }) {
  const { data: products = [] } = useProducts()
  const createExit = useCreateStockExit()
  const [observacoes, setObservacoes] = useState('')
  const [itens, setItens] = useState<Row[]>([rowOf(defaultProduct)])

  const update = (idx: number, patch: Partial<Row>) => setItens((prev) => prev.map((r, i) => {
    if (i !== idx) return r
    if (patch.productId !== undefined) {
      const p = products.find((x) => x.id === patch.productId)
      return { ...r, productId: patch.productId, produtoNome: p?.nome ?? '', unidade: p?.unidade ?? 'un' }
    }
    return { ...r, ...patch }
  }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const valid = itens.filter((i) => i.productId && i.quantidade > 0)
    if (!valid.length) { toast.error('Adicione ao menos um item válido'); return }
    try {
      await createExit.mutateAsync({ tipo: 'manual', observacoes: observacoes || undefined, itens: valid })
      onDone()
    } catch { /* o hook já mostra o erro */ }
  }

  const field = 'h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-[#C8714A] focus:ring-3 focus:ring-[#C8714A]/15'

  return (
    <DialogContent className="max-h-[88vh] w-[calc(100vw-2rem)] max-w-lg overflow-y-auto rounded-xl">
      <DialogHeader>
        <DialogTitle className="font-serif-display text-[26px] font-normal">Saída de estoque</DialogTitle>
        <DialogDescription>Material que saiu do ateliê sem passar por uma ordem de serviço.</DialogDescription>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2.5">
          {itens.map((item, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_76px_60px_40px] items-end gap-2">
              <label className="text-xs text-muted-foreground">
                {idx === 0 && <span className="mb-1 block">Produto</span>}
                <select value={item.productId} onChange={(e) => update(idx, { productId: e.target.value })} className={`${field} text-foreground`} required aria-label={`Produto ${idx + 1}`}>
                  <option value="">Selecione...</option>
                  {products.filter((p) => p.ativo).map((p) => (
                    <option key={p.id} value={p.id}>{p.nome} ({Number(p.quantidade_atual).toLocaleString('pt-BR', { maximumFractionDigits: 3 })} {p.unidade})</option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-muted-foreground">
                {idx === 0 && <span className="mb-1 block">Qtd.</span>}
                <input type="number" min="0.001" step="0.001" value={item.quantidade} onChange={(e) => update(idx, { quantidade: Number(e.target.value) })} className={`${field} text-foreground`} required aria-label={`Quantidade ${idx + 1}`} />
              </label>
              <label className="text-xs text-muted-foreground">
                {idx === 0 && <span className="mb-1 block">Un.</span>}
                <input type="text" value={item.unidade} onChange={(e) => update(idx, { unidade: e.target.value })} className={`${field} text-foreground`} aria-label={`Unidade ${idx + 1}`} />
              </label>
              <button type="button" onClick={() => setItens((p) => p.filter((_, i) => i !== idx))} disabled={itens.length === 1}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-600/10 disabled:opacity-30" aria-label="Remover item">
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}
          <button type="button" onClick={() => setItens((p) => [...p, { ...EMPTY }])} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#8A4B2C] hover:underline dark:text-[#E39B78]">
            <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Adicionar item
          </button>
        </div>
        <label className="block text-xs text-muted-foreground">
          Observações
          <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2} placeholder="Motivo da saída, destino, etc."
            className="mt-1 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-[#C8714A] focus:ring-3 focus:ring-[#C8714A]/15" />
        </label>
        <div className="flex gap-2">
          <button type="button" className="cli-ghost flex-1 justify-center" onClick={onDone}>Cancelar</button>
          <button type="submit" className="cli-primary flex-1 justify-center" style={{ minHeight: 44 }} disabled={createExit.isPending}>
            {createExit.isPending ? 'Registrando...' : 'Registrar saída'}
          </button>
        </div>
      </form>
    </DialogContent>
  )
}
