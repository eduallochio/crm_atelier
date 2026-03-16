'use client'

import { useEffect, useState, useCallback } from 'react'
import { RefreshCw, Flag, Loader2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

type Plan = 'free' | 'pro'

interface FeatureFlag {
  key: string
  label: string
  description: string
  category: string
  plans: Partial<Record<Plan, boolean>>
}

const DEFAULT_FLAGS: FeatureFlag[] = [
  {
    key: 'clients',
    label: 'Gestão de Clientes',
    description: 'Cadastro, edição e listagem de clientes do ateliê',
    category: 'Core',
    plans: { free: true, pro: true },
  },
  {
    key: 'services',
    label: 'Catálogo de Serviços',
    description: 'Criação e gerenciamento do catálogo de serviços',
    category: 'Core',
    plans: { free: true, pro: true },
  },
  {
    key: 'service_orders',
    label: 'Ordens de Serviço',
    description: 'Abertura e acompanhamento de ordens de serviço',
    category: 'Core',
    plans: { free: true, pro: true },
  },
  {
    key: 'financial',
    label: 'Módulo Financeiro',
    description: 'Contas a receber, pagar e fluxo de caixa',
    category: 'Financeiro',
    plans: { free: false, pro: true },
  },
  {
    key: 'cashier',
    label: 'Caixa',
    description: 'Abertura e fechamento de caixa com conferências',
    category: 'Financeiro',
    plans: { free: false, pro: true },
  },
  {
    key: 'suppliers',
    label: 'Fornecedores',
    description: 'Cadastro e gestão de fornecedores',
    category: 'Financeiro',
    plans: { free: false, pro: true },
  },
  {
    key: 'reports_pdf',
    label: 'Exportar PDF',
    description: 'Geração de relatórios em PDF',
    category: 'Relatórios',
    plans: { free: false, pro: true },
  },
  {
    key: 'reports_excel',
    label: 'Exportar Excel',
    description: 'Exportação de dados em planilhas Excel',
    category: 'Relatórios',
    plans: { free: false, pro: true },
  },
  {
    key: 'custom_branding',
    label: 'Personalização Visual',
    description: 'Logo, cores e white-label por organização',
    category: 'Personalização',
    plans: { free: false, pro: true },
  },
  {
    key: 'multi_user',
    label: 'Múltiplos Usuários',
    description: 'Adicionar membros da equipe à organização',
    category: 'Equipe',
    plans: { free: false, pro: true },
  },
  {
    key: 'price_history',
    label: 'Histórico de Preços',
    description: 'Rastrear variações de preço nos serviços ao longo do tempo',
    category: 'Core',
    plans: { free: false, pro: true },
  },
  {
    key: 'api_access',
    label: 'Acesso à API',
    description: 'Integração via API REST para sistemas externos',
    category: 'Integrações',
    plans: { free: false, pro: false },
  },
]

const PLAN_LABELS: Record<Plan, string> = {
  free: 'Free',
  pro: 'Pro',
}

const PLAN_COLORS: Record<Plan, string> = {
  free: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  pro: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
}

const PLANS: Plan[] = ['free', 'pro']

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>(DEFAULT_FLAGS)
  const [hasChanges, setHasChanges] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState<string>('all')

  const fetchFlags = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/system-settings')
      const data = await res.json()
      if (data?.feature_flags) {
        try {
          const loaded = JSON.parse(data.feature_flags) as FeatureFlag[]
          if (Array.isArray(loaded) && loaded.length > 0) {
            // Merge loaded with defaults to ensure new flags are present
            const merged = DEFAULT_FLAGS.map((def) => {
              const found = loaded.find((l) => l.key === def.key)
              return found ? { ...def, plans: found.plans } : def
            })
            setFlags(merged)
          }
        } catch {
          // keep defaults
        }
      }
    } catch {
      // keep defaults
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchFlags() }, [fetchFlags])

  const toggle = (key: string, plan: Plan) => {
    setFlags((prev) =>
      prev.map((f) =>
        f.key === key
          ? { ...f, plans: { ...f.plans, [plan]: !f.plans[plan] } }
          : f
      )
    )
    setHasChanges(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/system-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature_flags: JSON.stringify(flags) }),
      })
      if (!res.ok) throw new Error('Erro ao salvar')
      toast.success('Feature flags salvas com sucesso')
      setHasChanges(false)
    } catch {
      toast.error('Erro ao salvar feature flags')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    fetchFlags()
    setHasChanges(false)
  }

  const categories = ['all', ...Array.from(new Set(DEFAULT_FLAGS.map((f) => f.category)))]
  const filtered = filter === 'all' ? flags : flags.filter((f) => f.category === filter)

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Carregando...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Funcionalidades por Plano</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Controle quais funcionalidades estão disponíveis em cada plano
          </p>
        </div>
        {hasChanges && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleReset} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar Alterações
            </Button>
          </div>
        )}
      </div>

      {/* Legenda de planos */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Info className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500">Planos:</span>
        </div>
        {PLANS.map((plan) => (
          <span key={plan} className={`text-xs px-2 py-1 rounded font-medium ${PLAN_COLORS[plan]}`}>
            {PLAN_LABELS[plan]}
          </span>
        ))}
      </div>

      {/* Filtro por categoria */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors border ${
              filter === cat
                ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 font-medium'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            {cat === 'all' ? 'Todas' : cat}
          </button>
        ))}
      </div>

      {/* Tabela de flags */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 w-1/2">
                Funcionalidade
              </th>
              {PLANS.map((plan) => (
                <th key={plan} className="text-center py-3 px-4 font-medium">
                  <span className={`text-xs px-2 py-1 rounded ${PLAN_COLORS[plan]}`}>
                    {PLAN_LABELS[plan]}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
            {filtered.map((flag) => (
              <tr key={flag.key} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                <td className="py-4 px-4">
                  <div className="flex items-start gap-2">
                    <Flag className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 dark:text-white">{flag.label}</p>
                        <Badge variant="outline" className="text-xs font-mono px-1.5">
                          {flag.key}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{flag.description}</p>
                    </div>
                  </div>
                </td>
                {PLANS.map((plan) => (
                  <td key={plan} className="py-4 px-4 text-center">
                    <div className="flex justify-center">
                      <Switch
                        checked={flag.plans[plan] ?? false}
                        onCheckedChange={() => toggle(flag.key, plan)}
                      />
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Resumo por plano */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const enabled = flags.filter((f) => f.plans[plan]).length
          return (
            <div key={plan} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs px-2 py-1 rounded font-medium ${PLAN_COLORS[plan]}`}>
                  {PLAN_LABELS[plan]}
                </span>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{enabled}</span>
              </div>
              <p className="text-xs text-gray-500">funcionalidades ativas de {flags.length}</p>
              <div className="mt-2 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className="h-1.5 rounded-full bg-blue-500 transition-all"
                  style={{ width: `${(enabled / flags.length) * 100}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
