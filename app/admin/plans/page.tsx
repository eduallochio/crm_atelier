'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Star, Eye, EyeOff, Loader2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface PlanFeature {
  text: string
  included: boolean
}

interface Plan {
  id: string
  slug: string
  name: string
  description: string | null
  price: number
  price_annual: number | null
  annual_note: string | null
  badge: string | null
  is_featured: boolean
  is_active: boolean
  features: PlanFeature[]
  cta_text: string
  cta_url: string
  sort_order: number
}

const EMPTY: Omit<Plan, 'id'> = {
  slug: '', name: '', description: '', price: 0, price_annual: null,
  annual_note: null, badge: null, is_featured: false, is_active: true,
  features: [], cta_text: 'Criar conta', cta_url: '/cadastro', sort_order: 0,
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [dialog, setDialog] = useState<{ open: boolean; plan: Plan | null }>({ open: false, plan: null })
  const [form, setForm] = useState<Omit<Plan, 'id'>>(EMPTY)
  const [featureInput, setFeatureInput] = useState('')

  const fetchPlans = async () => {
    const res = await fetch('/api/admin/plans')
    setPlans(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchPlans() }, [])

  const openCreate = () => { setForm(EMPTY); setFeatureInput(''); setDialog({ open: true, plan: null }) }
  const openEdit = (p: Plan) => { setForm({ ...p }); setFeatureInput(''); setDialog({ open: true, plan: p }) }

  const handleSave = async () => {
    if (!form.slug || !form.name) return toast.error('Slug e nome são obrigatórios')
    setSaving(true)
    try {
      const url = dialog.plan ? `/api/admin/plans/${dialog.plan.id}` : '/api/admin/plans'
      const res = await fetch(url, {
        method: dialog.plan ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast.success(dialog.plan ? 'Plano atualizado' : 'Plano criado')
      setDialog({ open: false, plan: null })
      fetchPlans()
    } catch { toast.error('Erro ao salvar') } finally { setSaving(false) }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Excluir "${name}"?`)) return
    setDeleting(id)
    try {
      await fetch(`/api/admin/plans/${id}`, { method: 'DELETE' })
      toast.success('Plano excluído'); fetchPlans()
    } catch { toast.error('Erro ao excluir') } finally { setDeleting(null) }
  }

  const toggleActive = async (p: Plan) => {
    await fetch(`/api/admin/plans/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...p, is_active: !p.is_active }),
    })
    fetchPlans()
  }

  const addFeature = () => {
    if (!featureInput.trim()) return
    setForm(prev => ({ ...prev, features: [...prev.features, { text: featureInput.trim(), included: true }] }))
    setFeatureInput('')
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Carregando...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Planos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gerencie os planos exibidos na landing page</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Novo Plano</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {plans.map((plan) => (
          <div key={plan.id} className={`bg-white dark:bg-gray-900 rounded-xl border-2 p-5 space-y-4 transition-all ${
            plan.is_featured ? 'border-blue-500 shadow-lg shadow-blue-100 dark:shadow-blue-950' : 'border-gray-200 dark:border-gray-800'
          } ${!plan.is_active ? 'opacity-50' : ''}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-gray-900 dark:text-white">{plan.name}</span>
                  {plan.badge && <Badge className="text-xs">{plan.badge}</Badge>}
                  {plan.is_featured && <Star className="w-4 h-4 text-yellow-500 fill-yellow-400" />}
                  {!plan.is_active && <Badge variant="outline" className="text-xs text-gray-400">Inativo</Badge>}
                </div>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{plan.slug}</p>
              </div>
            </div>

            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {plan.price === 0 ? 'Grátis' : fmt(plan.price)}
                {plan.price > 0 && <span className="text-sm font-normal text-gray-400">/mês</span>}
              </p>
              {plan.price_annual && <p className="text-xs text-green-600">{fmt(plan.price_annual)}/ano {plan.annual_note ?? ''}</p>}
            </div>

            <ul className="space-y-1">
              {plan.features.slice(0, 4).map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  {f.included ? <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> : <X className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />}
                  <span className={f.included ? '' : 'line-through text-gray-400'}>{f.text}</span>
                </li>
              ))}
              {plan.features.length > 4 && <li className="text-xs text-gray-400">+{plan.features.length - 4} funcionalidades</li>}
            </ul>

            <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <Button size="sm" variant="outline" onClick={() => openEdit(plan)} className="flex-1">
                <Pencil className="w-3.5 h-3.5 mr-1.5" />Editar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => toggleActive(plan)} title={plan.is_active ? 'Desativar' : 'Ativar'}>
                {plan.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600"
                onClick={() => handleDelete(plan.id, plan.name)} disabled={deleting === plan.id}>
                {deleting === plan.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        ))}
        {plans.length === 0 && <div className="col-span-3 text-center py-20 text-gray-400">Nenhum plano. Crie o primeiro!</div>}
      </div>

      <Dialog open={dialog.open} onOpenChange={(o) => !o && setDialog({ open: false, plan: null })}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{dialog.plan ? 'Editar Plano' : 'Novo Plano'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Slug *</Label>
                <Input placeholder="free, pro" value={form.slug} onChange={(e) => setForm(p => ({ ...p, slug: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Nome *</Label>
                <Input placeholder="Plano Gratuito" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Descrição</Label>
              <Input value={form.description ?? ''} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Preço mensal (R$)</Label>
                <Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm(p => ({ ...p, price: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1">
                <Label>Preço anual (R$)</Label>
                <Input type="number" min="0" step="0.01" value={form.price_annual ?? ''} onChange={(e) => setForm(p => ({ ...p, price_annual: e.target.value ? Number(e.target.value) : null }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Badge</Label>
                <Input placeholder="Popular, Recomendado..." value={form.badge ?? ''} onChange={(e) => setForm(p => ({ ...p, badge: e.target.value || null }))} />
              </div>
              <div className="space-y-1">
                <Label>Ordem de exibição</Label>
                <Input type="number" min="0" value={form.sort_order} onChange={(e) => setForm(p => ({ ...p, sort_order: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Texto do CTA</Label>
                <Input value={form.cta_text} onChange={(e) => setForm(p => ({ ...p, cta_text: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>URL do CTA</Label>
                <Input value={form.cta_url} onChange={(e) => setForm(p => ({ ...p, cta_url: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.is_featured} onCheckedChange={(v) => setForm(p => ({ ...p, is_featured: v }))} />
                <Label>Destaque</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm(p => ({ ...p, is_active: v }))} />
                <Label>Ativo</Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Funcionalidades</Label>
              <div className="flex gap-2">
                <Input placeholder="Ex: Até 50 clientes" value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())} />
                <Button type="button" variant="outline" onClick={addFeature}><Plus className="w-4 h-4" /></Button>
              </div>
              <div className="space-y-1 max-h-44 overflow-y-auto">
                {form.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <button type="button" onClick={() => setForm(prev => ({ ...prev, features: prev.features.map((ft, idx) => idx === i ? { ...ft, included: !ft.included } : ft) }))}>
                      {f.included ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-gray-300" />}
                    </button>
                    <span className={`flex-1 text-sm ${!f.included ? 'line-through text-gray-400' : ''}`}>{f.text}</span>
                    <button type="button" onClick={() => setForm(prev => ({ ...prev, features: prev.features.filter((_, idx) => idx !== i) }))}>
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog({ open: false, plan: null })}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
