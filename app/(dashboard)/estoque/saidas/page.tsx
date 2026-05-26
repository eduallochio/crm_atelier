'use client'

import { useState, useMemo } from 'react'
import { PackageMinus, Plus, CalendarDays, Trash2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { usePlanUsage } from '@/hooks/use-plan-usage'
import { UpgradePrompt } from '@/components/upgrade-prompt'
import { useStockExits, useCreateStockExit, useDeleteStockExit, useProducts, type StockExit } from '@/hooks/use-inventory'
import { toast } from 'sonner'

function StatCard({ title, value, icon: Icon, grad, textColor }: {
  title: string
  value: string | number
  icon: React.ElementType
  grad: string
  textColor: string
}) {
  return (
    <div className="relative bg-card rounded-2xl overflow-hidden border border-border/40 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      <div className={`absolute inset-0 ${grad} opacity-[0.07] dark:opacity-[0.12] pointer-events-none`} />
      <div className={`absolute -bottom-6 -right-6 w-20 h-20 rounded-full ${grad} opacity-20 blur-2xl pointer-events-none`} />
      <div className="p-4 sm:p-5 pt-5 sm:pt-6">
        <div className="flex items-start justify-between mb-3">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{title}</p>
          <div className={`p-2 rounded-xl shadow-sm shrink-0 ${grad}`}>
            <Icon className="h-3.5 w-3.5 text-white" />
          </div>
        </div>
        <p className={`font-bold text-3xl ${textColor}`}>{value}</p>
      </div>
    </div>
  )
}

const tipoBadge: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  manual:         { label: 'Manual',       variant: 'secondary' },
  ordem_servico:  { label: 'Ordem de Serviço', variant: 'default' },
}

function StockExitDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const { data: products = [] } = useProducts()
  const createExit = useCreateStockExit()
  const [observacoes, setObservacoes] = useState('')
  const [itens, setItens] = useState<{ productId: string; produtoNome: string; quantidade: number; unidade: string }[]>([
    { productId: '', produtoNome: '', quantidade: 1, unidade: 'un' },
  ])

  function addItem() {
    setItens(prev => [...prev, { productId: '', produtoNome: '', quantidade: 1, unidade: 'un' }])
  }

  function removeItem(idx: number) {
    setItens(prev => prev.filter((_, i) => i !== idx))
  }

  function updateItem(idx: number, field: string, value: string | number) {
    setItens(prev => prev.map((item, i) => {
      if (i !== idx) return item
      if (field === 'productId') {
        const product = products.find(p => p.id === value)
        return { ...item, productId: String(value), produtoNome: product?.nome ?? '', unidade: product?.unidade ?? 'un' }
      }
      return { ...item, [field]: value }
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validItems = itens.filter(i => i.productId && i.quantidade > 0)
    if (!validItems.length) {
      toast.error('Adicione ao menos um item válido')
      return
    }
    await createExit.mutateAsync({ tipo: 'manual', observacoes: observacoes || undefined, itens: validItems })
    setItens([{ productId: '', produtoNome: '', quantidade: 1, unidade: 'un' }])
    setObservacoes('')
    onOpenChange(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Nova Saída de Estoque</h2>
          <button onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">Itens</p>
              <Button type="button" variant="outline" size="sm" onClick={addItem} className="h-7 text-xs gap-1">
                <Plus className="h-3 w-3" /> Adicionar
              </Button>
            </div>
            {itens.map((item, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-end">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Produto</label>
                  <select
                    value={item.productId}
                    onChange={e => updateItem(idx, 'productId', e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                    required
                  >
                    <option value="">Selecione...</option>
                    {products.filter(p => p.ativo).map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nome} ({Number(p.quantidade_atual).toFixed(3)} {p.unidade})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-20">
                  <label className="text-xs text-muted-foreground mb-1 block">Qtd</label>
                  <input
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={item.quantidade}
                    onChange={e => updateItem(idx, 'quantidade', Number(e.target.value))}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                    required
                  />
                </div>
                <div className="w-16">
                  <label className="text-xs text-muted-foreground mb-1 block">Un.</label>
                  <input
                    type="text"
                    value={item.unidade}
                    onChange={e => updateItem(idx, 'unidade', e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="h-9 w-9 flex items-center justify-center text-destructive hover:bg-destructive/10 rounded-md transition-colors mt-5"
                  disabled={itens.length === 1}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Observações</label>
            <textarea
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
              placeholder="Motivo da saída, destino, etc."
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={createExit.isPending}>
              {createExit.isPending ? 'Registrando...' : 'Registrar Saída'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function SaidasPage() {
  const { data: planData, isLoading: planLoading } = usePlanUsage()
  const { data: exits = [], isLoading: exitsLoading } = useStockExits()
  const deleteExit = useDeleteStockExit()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedExit, setSelectedExit] = useState<StockExit | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const isFree = planData?.plan === 'free'

  const now = new Date()
  const exitsThisMonth = useMemo(() => exits.filter(e => {
    const d = new Date(e.created_at)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  }), [exits, now])

  const totalItems = useMemo(() =>
    exits.reduce((acc, e) => acc + (e.itens?.length ?? 0), 0),
  [exits])

  async function handleDelete(id: string) {
    await deleteExit.mutateAsync(id)
    setConfirmDelete(null)
  }

  if (planLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (isFree) {
    return <UpgradePrompt message="O controle de estoque está disponível a partir do plano Pro. Faça upgrade para registrar saídas e acompanhar o consumo de materiais." />
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <PackageMinus className="h-6 w-6 text-rose-500" />
            Saídas de Estoque
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Histórico de saídas e consumo de materiais</p>
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" className="h-9 gap-2" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Nova Saída
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total de Saídas"        value={exits.length}          icon={PackageMinus} grad="bg-rose-500"   textColor="text-rose-600 dark:text-rose-400" />
        <StatCard title="Saídas Este Mês"        value={exitsThisMonth.length} icon={CalendarDays} grad="bg-orange-500" textColor="text-orange-600 dark:text-orange-400" />
        <StatCard title="Total de Itens Retirados" value={totalItems}          icon={PackageMinus} grad="bg-amber-500"  textColor="text-amber-600 dark:text-amber-400" />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {exitsLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : exits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <PackageMinus className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium">Nenhuma saída registrada</p>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Registrar primeira saída
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Data</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tipo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Observações</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Itens</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ações</th>
                </tr>
              </thead>
              <tbody>
                {exits.map((exit, i) => {
                  const badge = tipoBadge[exit.tipo] ?? tipoBadge.manual
                  return (
                    <tr
                      key={exit.id}
                      className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/10'}`}
                    >
                      <td className="px-4 py-3 text-sm text-foreground">
                        {new Date(exit.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground max-w-[200px] truncate">
                        {exit.observacoes || <span className="text-muted-foreground/40">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-medium text-foreground">
                        {exit.itens?.length ?? 0}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedExit(exit)} className="h-8 px-2 text-xs">
                            <FileText className="h-3.5 w-3.5 mr-1" />
                            Detalhes
                          </Button>
                          {exit.tipo === 'manual' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setConfirmDelete(exit.id)}
                              className="h-8 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedExit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Detalhes da Saída</h2>
              <button onClick={() => setSelectedExit(null)} className="text-muted-foreground hover:text-foreground text-xl leading-none">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Tipo</p>
                  <Badge variant={tipoBadge[selectedExit.tipo]?.variant ?? 'secondary'}>
                    {tipoBadge[selectedExit.tipo]?.label ?? selectedExit.tipo}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Data</p>
                  <p className="font-medium">{new Date(selectedExit.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
              {selectedExit.observacoes && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Observações</p>
                  <p className="text-sm">{selectedExit.observacoes}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Itens ({selectedExit.itens?.length ?? 0})</p>
                <div className="space-y-2">
                  {(selectedExit.itens ?? []).map(item => (
                    <div key={item.id} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
                      <p className="text-sm font-medium text-foreground">{item.produto_nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {Number(item.quantidade).toLocaleString('pt-BR', { maximumFractionDigits: 3 })} {item.unidade}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-sm w-full shadow-2xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground">Excluir saída?</h2>
            <p className="text-sm text-muted-foreground">
              A saída será removida e as quantidades dos produtos serão revertidas automaticamente.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={deleteExit.isPending}
                onClick={() => handleDelete(confirmDelete)}
              >
                {deleteExit.isPending ? 'Excluindo...' : 'Excluir'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <StockExitDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
