'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, Zap, Crown, ArrowUpCircle, ExternalLink, Loader2, CreditCard, Calendar, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type PlanUsage = {
  plan:           string
  clients_count:  number
  orders_count:   number
  users_count:    number
  services_count: number
  limits: {
    max_clients:  number
    max_orders:   number
    max_users:    number
    max_services: number
  }
}

type DbPlan = {
  id:           string
  slug:         string
  name:         string
  price:        number
  price_annual: number | null
  annual_note:  string | null
  badge:        string | null
  is_featured:  boolean
  is_active:    boolean
  features:     { text: string; included: boolean }[]
  cta_text:     string
}

const PLAN_STYLE: Record<string, { icon: React.ElementType; color: string; badge: string }> = {
  free: {
    icon: Zap,
    color: 'border-gray-200 dark:border-gray-700',
    badge: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  },
  pro: {
    icon: Crown,
    color: 'border-[#c8714a] dark:border-[#c8714a]',
    badge: 'bg-[#c8714a]/10 text-[#c8714a]',
  },
}

function fmtPrice(price: number) {
  if (price === 0) return 'R$ 0'
  return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function SubscriptionSettingsForm() {
  const [upgrading, setUpgrading] = useState(false)

  const { data: usage, isLoading: loadingUsage } = useQuery<PlanUsage>({
    queryKey: ['plan-usage'],
    queryFn: async () => {
      const res = await fetch('/api/plan-usage')
      if (!res.ok) return null
      return res.json()
    },
  })

  const { data: dbPlans = [], isLoading: loadingPlans } = useQuery<DbPlan[]>({
    queryKey: ['plans-public'],
    queryFn: async () => {
      const res = await fetch('/api/plans')
      if (!res.ok) return []
      return res.json()
    },
  })

  const currentPlan = usage?.plan ?? 'free'
  const isPro = currentPlan === 'pro'

  async function handleUpgrade() {
    setUpgrading(true)
    try {
      const msg = encodeURIComponent(
        'Olá! Gostaria de fazer upgrade para o plano Pro do Meu Atelier Sistema.'
      )
      window.open(`https://wa.me/5500000000000?text=${msg}`, '_blank')
      toast.info('Redirecionando para o WhatsApp para finalizar o upgrade...')
    } finally {
      setUpgrading(false)
    }
  }

  function pct(used: number, max: number) {
    return Math.min(Math.round((used / max) * 100), 100)
  }

  const activePlans = dbPlans.filter(p => p.is_active)

  return (
    <div className="space-y-8">

      {/* Plano atual */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Plano atual</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isPro ? 'Você está no plano Pro' : 'Você está no plano Gratuito'}
            </p>
          </div>
          <span className={cn('text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide',
            isPro ? 'bg-[#c8714a]/10 text-[#c8714a]' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
          )}>
            {isPro ? 'Pro' : 'Free'}
          </span>
        </div>

        {loadingUsage ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando uso...
          </div>
        ) : usage ? (
          <div className="space-y-4">
            {[
              { label: 'Clientes',  used: usage.clients_count,  max: usage.limits.max_clients  },
              { label: 'Serviços',  used: usage.services_count, max: usage.limits.max_services },
              { label: 'Ordens',    used: usage.orders_count,   max: usage.limits.max_orders   },
              { label: 'Usuários',  used: usage.users_count,    max: usage.limits.max_users    },
            ].map(({ label, used, max }) => {
              const unlimited = max >= 999999
              const p = unlimited ? Math.min((used / 100) * 10, 30) : pct(used, max)
              return (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-muted-foreground">{label}</span>
                    <span className={cn('font-medium', !unlimited && p >= 90 ? 'text-red-500' : !unlimited && p >= 70 ? 'text-amber-500' : 'text-foreground')}>
                      {used} / {unlimited ? 'Ilimitado' : max}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', !unlimited && p >= 90 ? 'bg-red-500' : !unlimited && p >= 70 ? 'bg-amber-500' : 'bg-[#c8714a]')}
                      style={{ width: `${p}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        ) : null}
      </div>

      {/* Planos */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Planos disponíveis</h3>
        {loadingPlans ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando planos...
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {activePlans.map((plan) => {
              const style = PLAN_STYLE[plan.slug] ?? PLAN_STYLE['free']
              const Icon = style.icon
              const isCurrent = currentPlan === plan.slug
              const includedFeatures = plan.features.filter(f => f.included)
              return (
                <div key={plan.id} className={cn(
                  'relative rounded-2xl border-2 p-6 flex flex-col gap-4 transition-all',
                  style.color,
                  isCurrent ? 'bg-muted/40' : 'bg-card hover:shadow-md'
                )}>
                  {isCurrent && (
                    <span className="absolute -top-3 left-4 text-[11px] font-bold px-3 py-1 rounded-full bg-foreground text-background">
                      Plano atual
                    </span>
                  )}
                  <div className="flex items-center gap-3">
                    <div className={cn('p-2 rounded-xl', style.badge)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{plan.name}</p>
                      <p className="text-sm text-muted-foreground">
                        <span className="text-xl font-bold text-foreground">{fmtPrice(plan.price)}</span>
                        {' '}{plan.price === 0 ? 'para sempre' : 'por mês'}
                      </p>
                      {plan.annual_note && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">{plan.annual_note}</p>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-2 flex-1">
                    {includedFeatures.map((f) => (
                      <li key={f.text} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        {f.text}
                      </li>
                    ))}
                  </ul>

                  {!isCurrent && plan.slug === 'pro' && (
                    <Button
                      className="w-full gap-2 bg-[#c8714a] hover:bg-[#b5623e] text-white"
                      onClick={handleUpgrade}
                      disabled={upgrading}
                    >
                      {upgrading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpCircle className="h-4 w-4" />}
                      Fazer upgrade
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Informações de pagamento */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Pagamento e cobrança</h3>

        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: CreditCard, title: 'Formas aceitas', desc: 'PIX, Boleto, Cartão de Crédito' },
            { icon: Calendar, title: 'Ciclo de cobrança', desc: 'Mensal — cancele quando quiser' },
            { icon: Shield, title: 'Segurança', desc: 'Pagamentos processados com criptografia' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3 p-4 rounded-xl bg-muted/40">
              <Icon className="h-5 w-5 text-[#c8714a] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground flex-1">
            Dúvidas sobre pagamento? Entre em contato com nosso suporte.
          </p>
          <Button variant="outline" size="sm" className="gap-2 shrink-0" asChild>
            <a href="mailto:suporte@meuateliersistema.com.br">
              <ExternalLink className="h-3.5 w-3.5" />
              Contato
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}
