'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Trash2, Check, X, Star, GripVertical, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface Feature {
  text: string
  included: boolean
}

interface Plan {
  id: string
  slug: string
  name: string
  description: string
  price: number
  price_annual: number | null
  annual_note: string
  badge: string
  is_featured: boolean
  is_active: boolean
  cta_text: string
  cta_url: string
  sort_order: number
  features: Feature[]
}

const EMPTY_PLAN: Omit<Plan, 'id'> = {
  slug: '',
  name: '',
  description: '',
  price: 0,
  price_annual: null,
  annual_note: '',
  badge: '',
  is_featured: false,
  is_active: true,
  cta_text: 'Criar conta',
  cta_url: '/cadastro',
  sort_order: 0,
  features: [],
}

/* ─── Price helper ──────────────────────────────────────────────────────── */
function PriceDisplay({ price, featured }: { price: number; featured: boolean }) {
  const textColor = featured ? '#2C1810' : '#F7F0E6'
  const mutedColor = featured ? '#7a6a5a' : 'rgba(247,240,230,0.4)'

  if (price === 0) {
    return (
      <div style={{ marginBottom: 8 }}>
        <span style={{ fontFamily: 'Georgia,serif', fontSize: 48, fontWeight: 300, color: textColor }}>R$ 0</span>
        <span style={{ color: mutedColor, fontSize: 14 }}> /mês</span>
      </div>
    )
  }
  const whole = Math.floor(price)
  const cents = Math.round((price - whole) * 100).toString().padStart(2, '0')
  return (
    <div style={{ marginBottom: 8 }}>
      <span style={{ fontFamily: 'Georgia,serif', fontSize: 48, fontWeight: 300, color: textColor }}>R$ {whole}</span>
      <span style={{ color: mutedColor, fontSize: 14 }}>,{cents} /mês</span>
    </div>
  )
}

/* ─── Plan Preview Card ─────────────────────────────────────────────────── */
function PlanPreviewCard({ plan }: { plan: Plan }) {
  const featured = plan.is_featured
  const bg = featured ? '#fff8f0' : 'rgba(247,240,230,0.04)'
  const ink = featured ? '#2C1810' : '#F7F0E6'
  const mid = featured ? '#7a6a5a' : 'rgba(247,240,230,0.5)'
  const gold = '#D4A85A'
  const terra = '#C8714A'

  return (
    <div style={{
      background: bg,
      padding: '32px 28px',
      position: 'relative',
      height: '100%',
      minHeight: 420,
      fontFamily: "'DM Sans',system-ui,sans-serif",
      border: featured ? 'none' : '1px solid rgba(212,168,90,0.1)',
    }}>
      {featured && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: terra }} />
      )}
      {plan.badge && (
        <div style={{ position: 'absolute', top: 14, right: 14 }}>
          <span style={{
            background: terra, color: '#F7F0E6',
            fontSize: 9, padding: '3px 8px',
            letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>{plan.badge}</span>
        </div>
      )}

      <p style={{ fontSize: 24, fontWeight: 300, color: ink, marginBottom: 4, fontFamily: 'Georgia,serif' }}>
        {plan.name || 'Sem nome'}
      </p>

      <PriceDisplay price={plan.price} featured={featured} />

      <p style={{ fontSize: 12, color: mid, marginBottom: 24 }}>
        {plan.annual_note || plan.description || '\u00a0'}
      </p>

      <div style={{
        display: 'block', textAlign: 'center',
        padding: '10px 20px', marginBottom: 24,
        background: featured ? terra : 'transparent',
        color: featured ? '#F7F0E6' : '#F7F0E6',
        border: featured ? 'none' : '1px solid rgba(247,240,230,0.3)',
        fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase',
        cursor: 'default',
      }}>
        {plan.cta_text || 'Criar conta'}
      </div>

      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {plan.features.map((f, i) => (
          <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {f.included
              ? <Check size={12} style={{ color: featured ? terra : gold, flexShrink: 0 }} />
              : <X size={12} style={{ color: 'rgba(150,130,110,0.4)', flexShrink: 0 }} />
            }
            <span style={{
              fontSize: 12,
              color: f.included ? mid : (featured ? 'rgba(44,24,16,0.3)' : 'rgba(247,240,230,0.25)'),
            }}>{f.text}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ─── Feature Row ───────────────────────────────────────────────────────── */
function FeatureRow({
  feature, index, onChange, onRemove,
}: {
  feature: Feature
  index: number
  onChange: (index: number, updated: Feature) => void
  onRemove: (index: number) => void
}) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
      <GripVertical size={14} style={{ color: '#9ca3af', flexShrink: 0 }} />
      <input
        type="text"
        value={feature.text}
        onChange={(e) => onChange(index, { ...feature, text: e.target.value })}
        placeholder="Descrição da feature"
        style={{
          flex: 1, padding: '6px 10px', borderRadius: 6, fontSize: 13,
          border: '1px solid #e5e7eb', background: '#fff', color: '#111',
          outline: 'none',
        }}
      />
      <button
        type="button"
        onClick={() => onChange(index, { ...feature, included: !feature.included })}
        title={feature.included ? 'Incluído — clique para excluir' : 'Excluído — clique para incluir'}
        style={{
          width: 28, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer',
          background: feature.included ? '#d1fae5' : '#fee2e2',
          color: feature.included ? '#065f46' : '#991b1b',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}
      >
        {feature.included ? <Check size={13} /> : <X size={13} />}
      </button>
      <button
        type="button"
        onClick={() => onRemove(index)}
        style={{
          width: 28, height: 28, borderRadius: 6, border: '1px solid #e5e7eb',
          cursor: 'pointer', background: '#fff', color: '#6b7280',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}

/* ─── Dialog ────────────────────────────────────────────────────────────── */
function PlanDialog({
  open, plan, onClose, onSaved,
}: {
  open: boolean
  plan: Plan | null
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<Omit<Plan, 'id'>>(EMPTY_PLAN)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(plan ? { ...plan } : { ...EMPTY_PLAN })
    }
  }, [open, plan])

  function setField<K extends keyof typeof form>(key: K, val: typeof form[K]) {
    setForm((f) => ({ ...f, [key]: val }))
  }

  function handleFeatureChange(i: number, updated: Feature) {
    const features = [...form.features]
    features[i] = updated
    setField('features', features)
  }

  function handleFeatureRemove(i: number) {
    setField('features', form.features.filter((_, idx) => idx !== i))
  }

  function addFeature() {
    setField('features', [...form.features, { text: '', included: true }])
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error('Nome é obrigatório'); return }
    if (!form.slug.trim()) { toast.error('Slug é obrigatório'); return }

    setSaving(true)
    try {
      const url = plan ? `/api/admin/plans/${plan.id}` : '/api/admin/plans'
      const method = plan ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Erro ao salvar')
      }
      toast.success(plan ? 'Plano atualizado!' : 'Plano criado!')
      onSaved()
      onClose()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  const inp: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: 6, fontSize: 13,
    border: '1px solid #e5e7eb', background: '#fff', color: '#111', outline: 'none',
    boxSizing: 'border-box',
  }
  const lbl: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 500,
    color: '#374151', marginBottom: 4,
  }
  const col: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4 }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: '#fff', borderRadius: 12, width: '100%', maxWidth: 900,
        maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 28px', borderBottom: '1px solid #f0f0f0',
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111', margin: 0 }}>
            {plan ? 'Editar plano' : 'Novo plano'}
          </h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#6b7280', padding: 4,
          }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Left column — preview */}
            <div>
              <p style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Pré-visualização
              </p>
              <div style={{ background: form.is_featured ? '#f7f0e6' : '#2C1810', borderRadius: 8, overflow: 'hidden' }}>
                <PlanPreviewCard plan={{ ...form, id: '' }} />
              </div>
            </div>

            {/* Right column — form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Row 1 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={col}>
                  <label style={lbl}>Nome *</label>
                  <input style={inp} value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="Free" />
                </div>
                <div style={col}>
                  <label style={lbl}>Slug *</label>
                  <input style={inp} value={form.slug} onChange={(e) => setField('slug', e.target.value.toLowerCase().replace(/\s/g, '-'))} placeholder="free" />
                </div>
              </div>

              {/* Row 2 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={col}>
                  <label style={lbl}>Preço mensal (R$)</label>
                  <input type="number" step="0.01" min="0" style={inp} value={form.price} onChange={(e) => setField('price', parseFloat(e.target.value) || 0)} />
                </div>
                <div style={col}>
                  <label style={lbl}>Preço anual (R$)</label>
                  <input type="number" step="0.01" min="0" style={inp}
                    value={form.price_annual ?? ''}
                    onChange={(e) => setField('price_annual', e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="Opcional"
                  />
                </div>
              </div>

              {/* Nota anual */}
              <div style={col}>
                <label style={lbl}>Nota anual</label>
                <input style={inp} value={form.annual_note} onChange={(e) => setField('annual_note', e.target.value)} placeholder="ou R$ 599/ano — 2 meses grátis" />
              </div>

              {/* Descrição */}
              <div style={col}>
                <label style={lbl}>Descrição</label>
                <input style={inp} value={form.description} onChange={(e) => setField('description', e.target.value)} placeholder="Para começar" />
              </div>

              {/* Row 3 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={col}>
                  <label style={lbl}>Badge</label>
                  <input style={inp} value={form.badge} onChange={(e) => setField('badge', e.target.value)} placeholder="Popular" />
                </div>
                <div style={col}>
                  <label style={lbl}>Ordem</label>
                  <input type="number" min="0" style={inp} value={form.sort_order} onChange={(e) => setField('sort_order', parseInt(e.target.value) || 0)} />
                </div>
              </div>

              {/* Row 4 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={col}>
                  <label style={lbl}>Texto do botão</label>
                  <input style={inp} value={form.cta_text} onChange={(e) => setField('cta_text', e.target.value)} placeholder="Criar conta" />
                </div>
                <div style={col}>
                  <label style={lbl}>URL do botão</label>
                  <input style={inp} value={form.cta_url} onChange={(e) => setField('cta_url', e.target.value)} placeholder="/cadastro" />
                </div>
              </div>

              {/* Toggles */}
              <div style={{ display: 'flex', gap: 24 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: '#374151' }}>
                  <input type="checkbox" checked={form.is_featured}
                    onChange={(e) => setField('is_featured', e.target.checked)}
                    style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#C8714A' }}
                  />
                  <Star size={14} style={{ color: '#D4A85A' }} />
                  Destaque
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: '#374151' }}>
                  <input type="checkbox" checked={form.is_active}
                    onChange={(e) => setField('is_active', e.target.checked)}
                    style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#059669' }}
                  />
                  {form.is_active ? <Eye size={14} style={{ color: '#059669' }} /> : <EyeOff size={14} style={{ color: '#6b7280' }} />}
                  Ativo na landing
                </label>
              </div>
            </div>
          </div>

          {/* Features */}
          <div style={{ marginTop: 28, borderTop: '1px solid #f0f0f0', paddingTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', margin: 0 }}>
                Features ({form.features.length})
              </p>
              <button
                type="button"
                onClick={addFeature}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 6,
                  background: '#2C1810', color: '#F7F0E6',
                  border: 'none', cursor: 'pointer', fontSize: 12,
                }}
              >
                <Plus size={13} /> Adicionar
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
              {form.features.map((f, i) => (
                <FeatureRow
                  key={i}
                  feature={f}
                  index={i}
                  onChange={handleFeatureChange}
                  onRemove={handleFeatureRemove}
                />
              ))}
            </div>
            {form.features.length === 0 && (
              <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', padding: '20px 0' }}>
                Nenhuma feature. Clique em "Adicionar" para incluir.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', gap: 12, justifyContent: 'flex-end',
          padding: '16px 28px', borderTop: '1px solid #f0f0f0',
          background: '#fafafa',
        }}>
          <button onClick={onClose} style={{
            padding: '10px 24px', borderRadius: 8, border: '1px solid #e5e7eb',
            background: '#fff', color: '#374151', cursor: 'pointer', fontSize: 14,
          }}>
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '10px 24px', borderRadius: 8, border: 'none',
              background: '#2C1810', color: '#F7F0E6',
              cursor: saving ? 'not-allowed' : 'pointer', fontSize: 14,
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Salvando…' : (plan ? 'Salvar alterações' : 'Criar plano')}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Page ──────────────────────────────────────────────────────────────── */
export default function AdminSubscriptionsPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const loadPlans = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/plans')
      if (!res.ok) throw new Error()
      setPlans(await res.json())
    } catch {
      toast.error('Erro ao carregar planos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadPlans() }, [loadPlans])

  async function handleDelete(plan: Plan) {
    if (!confirm(`Excluir o plano "${plan.name}"? Esta ação não pode ser desfeita.`)) return
    setDeleting(plan.id)
    try {
      const res = await fetch(`/api/admin/plans/${plan.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Plano excluído')
      loadPlans()
    } catch {
      toast.error('Erro ao excluir plano')
    } finally {
      setDeleting(null)
    }
  }

  function openCreate() {
    setEditingPlan(null)
    setDialogOpen(true)
  }

  function openEdit(plan: Plan) {
    setEditingPlan(plan)
    setDialogOpen(true)
  }

  const active = plans.filter((p) => p.is_active).length
  const inactive = plans.filter((p) => !p.is_active).length
  const featured = plans.filter((p) => p.is_featured).length

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111', margin: 0 }}>Gestão de Planos</h1>
            <p style={{ fontSize: 14, color: '#6b7280', margin: '4px 0 0' }}>
              Configure os planos exibidos na landing page. Alterações refletem imediatamente.
            </p>
          </div>
          <button
            onClick={openCreate}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 8,
              background: '#2C1810', color: '#F7F0E6',
              border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500,
            }}
          >
            <Plus size={16} /> Criar plano
          </button>
        </div>

        {/* Stats strip */}
        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          {[
            { label: 'Total', value: plans.length, color: '#6b7280' },
            { label: 'Ativos', value: active, color: '#059669' },
            { label: 'Inativos', value: inactive, color: '#dc2626' },
            { label: 'Destaque', value: featured, color: '#D4A85A' },
          ].map((s) => (
            <div key={s.label} style={{
              padding: '12px 20px', borderRadius: 8, background: '#fff',
              border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</span>
              <span style={{ fontSize: 13, color: '#6b7280' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Plan Cards Grid ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 80, color: '#6b7280', fontSize: 14 }}>
          Carregando planos…
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 24,
          alignItems: 'start',
        }}>
          {plans.map((plan) => (
            <div key={plan.id} style={{
              borderRadius: 12, overflow: 'hidden',
              border: '1px solid #e5e7eb',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              opacity: plan.is_active ? 1 : 0.6,
            }}>
              {/* Preview */}
              <div style={{ background: plan.is_featured ? '#f7f0e6' : '#2C1810' }}>
                <PlanPreviewCard plan={plan} />
              </div>

              {/* Card footer */}
              <div style={{
                padding: '12px 16px', background: '#fff',
                borderTop: '1px solid #e5e7eb',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 999,
                    background: plan.is_active ? '#d1fae5' : '#fee2e2',
                    color: plan.is_active ? '#065f46' : '#991b1b',
                    fontWeight: 500,
                  }}>
                    {plan.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                  {plan.is_featured && (
                    <span style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 999,
                      background: '#fef3c7', color: '#92400e', fontWeight: 500,
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      <Star size={10} /> Destaque
                    </span>
                  )}
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>#{plan.sort_order}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => openEdit(plan)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 14px', borderRadius: 6,
                      border: '1px solid #e5e7eb', background: '#fff',
                      color: '#374151', cursor: 'pointer', fontSize: 12,
                    }}
                  >
                    <Edit2 size={12} /> Editar
                  </button>
                  <button
                    onClick={() => handleDelete(plan)}
                    disabled={deleting === plan.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 14px', borderRadius: 6,
                      border: '1px solid #fecaca', background: '#fff5f5',
                      color: '#dc2626', cursor: 'pointer', fontSize: 12,
                      opacity: deleting === plan.id ? 0.5 : 1,
                    }}
                  >
                    <Trash2 size={12} /> {deleting === plan.id ? '…' : 'Excluir'}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add card */}
          <button
            onClick={openCreate}
            style={{
              borderRadius: 12, border: '2px dashed #d1d5db', background: 'transparent',
              minHeight: 300, cursor: 'pointer', color: '#9ca3af',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 12, transition: 'border-color 0.2s, color 0.2s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#2C1810'; (e.currentTarget as HTMLButtonElement).style.color = '#2C1810' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#d1d5db'; (e.currentTarget as HTMLButtonElement).style.color = '#9ca3af' }}
          >
            <Plus size={28} />
            <span style={{ fontSize: 14, fontWeight: 500 }}>Criar novo plano</span>
          </button>
        </div>
      )}

      <PlanDialog
        open={dialogOpen}
        plan={editingPlan}
        onClose={() => setDialogOpen(false)}
        onSaved={loadPlans}
      />
    </div>
  )
}
