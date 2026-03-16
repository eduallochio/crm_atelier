'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Tag, Copy, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface Coupon {
  id: string
  code: string
  description: string | null
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  max_uses: number | null
  uses_count: number
  expires_at: string | null
  is_active: boolean
  applicable_plans: string | null
  created_at: string
}

const EMPTY_FORM = {
  code: '',
  description: '',
  discount_type: 'percentage' as 'percentage' | 'fixed',
  discount_value: 10,
  max_uses: '' as string | number,
  expires_at: '',
  is_active: true,
  applicable_plans: '',
}

function fmtDate(dateStr: string | null) {
  if (!dateStr) return '-'
  const [y, m, d] = dateStr.split('T')[0].split('-')
  return `${d}/${m}/${y}`
}

function isExpired(expires_at: string | null) {
  if (!expires_at) return false
  return new Date(expires_at) < new Date()
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [dialog, setDialog] = useState<{ open: boolean; coupon: Coupon | null }>({ open: false, coupon: null })
  const [form, setForm] = useState(EMPTY_FORM)

  const fetchCoupons = async () => {
    const res = await fetch('/api/admin/coupons')
    if (res.ok) setCoupons(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchCoupons() }, [])

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setDialog({ open: true, coupon: null })
  }

  const openEdit = (c: Coupon) => {
    setForm({
      code: c.code,
      description: c.description ?? '',
      discount_type: c.discount_type,
      discount_value: c.discount_value,
      max_uses: c.max_uses ?? '',
      expires_at: c.expires_at ? c.expires_at.split('T')[0] : '',
      is_active: c.is_active,
      applicable_plans: c.applicable_plans ? JSON.parse(c.applicable_plans).join(', ') : '',
    })
    setDialog({ open: true, coupon: c })
  }

  const handleSave = async () => {
    if (!form.code) return toast.error('Código é obrigatório')
    if (!form.discount_value || Number(form.discount_value) <= 0) return toast.error('Valor de desconto inválido')
    if (form.discount_type === 'percentage' && Number(form.discount_value) > 100) {
      return toast.error('Desconto percentual não pode exceder 100%')
    }

    setSaving(true)
    try {
      const applicable_plans = form.applicable_plans
        ? form.applicable_plans.split(',').map(s => s.trim()).filter(Boolean)
        : null

      const payload = {
        code: form.code.toUpperCase(),
        description: form.description || null,
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        max_uses: form.max_uses !== '' ? Number(form.max_uses) : null,
        expires_at: form.expires_at || null,
        is_active: form.is_active,
        applicable_plans,
      }

      const url = dialog.coupon ? `/api/admin/coupons/${dialog.coupon.id}` : '/api/admin/coupons'
      const method = dialog.coupon ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao salvar')
      }

      toast.success(dialog.coupon ? 'Cupom atualizado' : 'Cupom criado')
      setDialog({ open: false, coupon: null })
      fetchCoupons()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Excluir cupom "${code}"? Esta ação não pode ser desfeita.`)) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Cupom excluído')
      fetchCoupons()
    } catch { toast.error('Erro ao excluir') } finally { setDeleting(null) }
  }

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !coupon.is_active }),
      })
      if (!res.ok) throw new Error()
      toast.success(coupon.is_active ? 'Cupom desativado' : 'Cupom ativado')
      fetchCoupons()
    } catch { toast.error('Erro ao atualizar') }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('Código copiado!')
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cupons de Desconto</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gerencie cupons para desconto em planos
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cupom
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: coupons.length, color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Ativos', value: coupons.filter(c => c.is_active && !isExpired(c.expires_at)).length, color: 'text-green-600 dark:text-green-400' },
          { label: 'Inativos', value: coupons.filter(c => !c.is_active).length, color: 'text-gray-500' },
          { label: 'Expirados', value: coupons.filter(c => isExpired(c.expires_at)).length, color: 'text-red-500 dark:text-red-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">
            <Tag className="h-8 w-8 mx-auto mb-3 opacity-40" />
            <p>Nenhum cupom cadastrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  {['Código', 'Desconto', 'Usos', 'Expiração', 'Planos', 'Status', 'Ações'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {coupons.map(coupon => {
                  const expired = isExpired(coupon.expires_at)
                  const exhausted = coupon.max_uses != null && coupon.uses_count >= coupon.max_uses
                  const effectivelyActive = coupon.is_active && !expired && !exhausted

                  return (
                    <tr key={coupon.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-gray-900 dark:text-white">{coupon.code}</span>
                          <button
                            onClick={() => copyCode(coupon.code)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            title="Copiar código"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {coupon.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{coupon.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-green-600 dark:text-green-400">
                        {coupon.discount_type === 'percentage'
                          ? `${coupon.discount_value}%`
                          : `R$ ${Number(coupon.discount_value).toFixed(2)}`}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        <span className={exhausted ? 'text-red-500' : ''}>
                          {coupon.uses_count}
                          {coupon.max_uses != null ? ` / ${coupon.max_uses}` : ' / ∞'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        <span className={expired ? 'text-red-500' : ''}>{fmtDate(coupon.expires_at)}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                        {coupon.applicable_plans
                          ? JSON.parse(coupon.applicable_plans).join(', ')
                          : 'Todos'}
                      </td>
                      <td className="px-4 py-3">
                        {expired ? (
                          <Badge variant="destructive">Expirado</Badge>
                        ) : exhausted ? (
                          <Badge variant="secondary">Esgotado</Badge>
                        ) : effectivelyActive ? (
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">Ativo</Badge>
                        ) : (
                          <Badge variant="secondary">Inativo</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleToggleActive(coupon)}
                            className={`p-1.5 rounded transition-colors ${
                              coupon.is_active
                                ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30'
                                : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                            title={coupon.is_active ? 'Desativar' : 'Ativar'}
                          >
                            {coupon.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => openEdit(coupon)}
                            className="p-1.5 rounded text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(coupon.id, coupon.code)}
                            disabled={deleting === coupon.id}
                            className="p-1.5 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50"
                            title="Excluir"
                          >
                            {deleting === coupon.id
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <Trash2 className="h-4 w-4" />}
                          </button>
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialog.open} onOpenChange={(open) => !saving && setDialog({ open, coupon: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dialog.coupon ? 'Editar Cupom' : 'Novo Cupom'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Código *</Label>
                <Input
                  placeholder="EX: PROMO10"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="font-mono uppercase"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tipo de Desconto *</Label>
                <select
                  value={form.discount_type}
                  onChange={(e) => setForm({ ...form, discount_type: e.target.value as 'percentage' | 'fixed' })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="percentage">Percentual (%)</option>
                  <option value="fixed">Valor fixo (R$)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>
                  Valor do Desconto * {form.discount_type === 'percentage' ? '(%)' : '(R$)'}
                </Label>
                <Input
                  type="number"
                  min="0"
                  max={form.discount_type === 'percentage' ? 100 : undefined}
                  step="0.01"
                  value={form.discount_value}
                  onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Máximo de Usos</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="Ilimitado"
                  value={form.max_uses}
                  onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Input
                placeholder="Ex: Desconto de lançamento"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Data de Expiração</Label>
              <Input
                type="date"
                value={form.expires_at}
                onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Planos Aplicáveis</Label>
              <Input
                placeholder="Ex: basic, pro (vazio = todos)"
                value={form.applicable_plans}
                onChange={(e) => setForm({ ...form, applicable_plans: e.target.value })}
              />
              <p className="text-xs text-gray-500">Slugs dos planos separados por vírgula. Deixe vazio para aplicar a todos.</p>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-3">
              <div>
                <p className="text-sm font-medium">Cupom ativo</p>
                <p className="text-xs text-gray-500">Cupons inativos não podem ser utilizados</p>
              </div>
              <Switch
                checked={form.is_active}
                onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog({ open: false, coupon: null })} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {dialog.coupon ? 'Salvar alterações' : 'Criar cupom'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
