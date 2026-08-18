'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  CheckCircle2, Zap, Crown, ArrowUpCircle, ExternalLink,
  Loader2, CreditCard, Calendar, Shield, Tag, X, Check,
  QrCode, RefreshCw, AlertTriangle,
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  features:     { text: string; included: boolean }[]
  cta_text:     string
}

type CouponResult = {
  valid:           boolean
  code?:           string
  description?:    string
  discount_type?:  string
  discount_value?: number
  discount_amount?: number
  base_price?:     number
  final_price?:    number
  error?:          string
}

type BillingType = 'PIX' | 'CREDIT_CARD'

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

const BILLING_OPTIONS: { value: BillingType; label: string; icon: React.ElementType }[] = [
  { value: 'PIX',         label: 'PIX',              icon: QrCode     },
  { value: 'CREDIT_CARD', label: 'Cartão de crédito', icon: CreditCard },
]

function fmtPrice(price: number) {
  if (price === 0) return 'R$ 0'
  return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function pct(used: number, max: number) {
  return Math.min(Math.round((used / max) * 100), 100)
}

export function SubscriptionSettingsForm() {
  const queryClient = useQueryClient()
  const [showCheckout, setShowCheckout] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [billingType, setBillingType] = useState<BillingType>('PIX')
  const [cycle, setCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY')
  const [couponCode, setCouponCode] = useState('')
  const [couponResult, setCouponResult] = useState<CouponResult | null>(null)
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Parcelamento (apenas anual + cartão)
  const [installments, setInstallments] = useState(3)

  // Dados do cartão
  const [cardHolderName, setCardHolderName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')   // MM/AAAA
  const [cardCcv, setCardCcv] = useState('')
  const [cardHolderCpf, setCardHolderCpf] = useState('')
  const [cardHolderPhone, setCardHolderPhone] = useState('')

  const { data: usage, isLoading: loadingUsage } = useQuery<PlanUsage>({
    queryKey: ['plan-usage'],
    queryFn: async () => {
      const res = await fetch('/api/plan-usage')
      if (!res.ok) return null
      return res.json()
    },
  })

  const { data: subscriptionInfo } = useQuery<{ plan: string; status: string | null; next_due_date: string | null; cycle?: string; value?: number }>({
    queryKey: ['subscription-info'],
    queryFn: async () => {
      const res = await fetch('/api/subscription')
      if (!res.ok) return null
      return res.json()
    },
    staleTime: 60_000,
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

  const proPlan = dbPlans.find(p => p.slug === 'pro')
  const monthlyPrice = proPlan?.price ?? 0
  const annualPrice  = proPlan?.price_annual ?? monthlyPrice * 10
  const basePrice    = cycle === 'MONTHLY' ? monthlyPrice : annualPrice
  const finalPrice   = couponResult?.valid ? (couponResult.final_price ?? basePrice) : basePrice

  // Parcelamento: anual + cartão usa installments escolhido; demais sempre 1x
  const activeInstallments = billingType === 'CREDIT_CARD' && cycle === 'YEARLY' ? installments : 1
  // Valor por parcela sem juros (apenas para exibição das opções sem juros)
  const installmentValue   = activeInstallments > 1 ? Math.ceil((finalPrice / activeInstallments) * 100) / 100 : finalPrice

  async function validateCoupon() {
    if (!couponCode.trim()) return
    setValidatingCoupon(true)
    setCouponResult(null)
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, plan: 'pro', cycle }),
      })
      const data: CouponResult = await res.json()
      setCouponResult(data)
      if (data.valid) {
        toast.success(`Cupom aplicado! Desconto de ${fmtPrice(data.discount_amount ?? 0)}`)
      } else {
        toast.error(data.error ?? 'Cupom inválido')
      }
    } catch {
      toast.error('Erro ao validar cupom')
    } finally {
      setValidatingCoupon(false)
    }
  }

  function removeCoupon() {
    setCouponCode('')
    setCouponResult(null)
  }

  async function handleCancel() {
    setCancelling(true)
    try {
      const res = await fetch('/api/subscription/cancel', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao cancelar')
      toast.success('Assinatura cancelada. Seu plano voltou para Free.')
      queryClient.invalidateQueries({ queryKey: ['plan-usage'] })
      queryClient.invalidateQueries({ queryKey: ['subscription-info'] })
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setCancelling(false)
    }
  }

  async function handleCheckout() {
    if (billingType === 'CREDIT_CARD') {
      if (!cardHolderName.trim() || !cardNumber.trim() || !cardExpiry.trim() || !cardCcv.trim()) {
        toast.error('Preencha todos os dados do cartão')
        return
      }
      if (!cardHolderCpf.trim()) {
        toast.error('Informe o CPF do titular do cartão')
        return
      }
    }

    setSubmitting(true)
    try {
      const [expiryMonth, expiryYear] = cardExpiry.split('/')

      const res = await fetch('/api/checkout/asaas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billing_type:       billingType,
          cycle,
          plan:               'pro',
          coupon_code:        couponResult?.valid ? couponCode : undefined,
          installment_count:  activeInstallments > 1 ? activeInstallments : undefined,
          // sem juros → enviamos o valor por parcela; com juros → Asaas calcula
          installment_value:  activeInstallments > 1 && activeInstallments <= 3 ? installmentValue : undefined,
          card_holder_name:   billingType === 'CREDIT_CARD' ? cardHolderName.trim() : undefined,
          card_number:        billingType === 'CREDIT_CARD' ? cardNumber.replace(/\s/g, '') : undefined,
          card_expiry_month:  billingType === 'CREDIT_CARD' ? expiryMonth?.trim() : undefined,
          card_expiry_year:   billingType === 'CREDIT_CARD' ? expiryYear?.trim() : undefined,
          card_ccv:           billingType === 'CREDIT_CARD' ? cardCcv.trim() : undefined,
          card_holder_cpf:    billingType === 'CREDIT_CARD' ? cardHolderCpf : undefined,
          card_holder_phone:  billingType === 'CREDIT_CARD' ? cardHolderPhone : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao processar pagamento')

      if (billingType === 'PIX') {
        toast.success('Assinatura criada! Você receberá as instruções de pagamento por e-mail.')
      } else {
        toast.success('Assinatura criada com sucesso! Seu plano Pro já está ativo.')
        queryClient.invalidateQueries({ queryKey: ['plan-usage'] })
        queryClient.invalidateQueries({ queryKey: ['subscription-info'] })
      }
      setShowCheckout(false)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const isOverdue = isPro && subscriptionInfo?.status === 'overdue'

  return (
    <div className="space-y-8">

      {/* Banner de inadimplência */}
      {isOverdue && (
        <div className="rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-700 dark:text-red-400 text-sm">Pagamento pendente</p>
            <p className="text-sm text-red-600 dark:text-red-300 mt-0.5">
              Há uma cobrança em atraso na sua assinatura Pro. Regularize o pagamento para evitar a suspensão do plano.
            </p>
            <a
              href="https://www.asaas.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-red-700 dark:text-red-400 underline mt-2"
            >
              Regularizar pagamento <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* Plano atual */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Plano atual</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isOverdue ? 'Plano Pro — pagamento em atraso' : isPro ? 'Você está no plano Pro' : 'Você está no plano Gratuito'}
            </p>
            {isPro && subscriptionInfo?.next_due_date && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <RefreshCw className="h-3 w-3" />
                Próxima renovação: {new Date(subscriptionInfo.next_due_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                {subscriptionInfo.value ? ` · ${fmtPrice(subscriptionInfo.value)}` : ''}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={cn('text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide',
              isOverdue  ? 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400' :
              isPro      ? 'bg-[#c8714a]/10 text-[#c8714a]' :
                           'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
            )}>
              {isOverdue ? 'Em atraso' : isPro ? 'Pro' : 'Free'}
            </span>
            {isPro && subscriptionInfo?.next_due_date && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-red-500 h-7 px-2">
                    Cancelar plano
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      Cancelar assinatura Pro?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Sua conta voltará imediatamente para o plano <strong>Free</strong> com os limites reduzidos
                      (50 clientes, 20 serviços, 100 ordens). Dados existentes não serão excluídos,
                      mas você perderá acesso aos módulos exclusivos.
                      <br /><br />
                      Esta ação não pode ser desfeita sem uma nova assinatura.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Manter plano Pro</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-700 text-white"
                      onClick={handleCancel}
                      disabled={cancelling}
                    >
                      {cancelling && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Sim, cancelar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
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
      {!showCheckout && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Planos disponíveis</h3>
          {loadingPlans ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando planos...
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {dbPlans.map((plan) => {
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
                        onClick={() => setShowCheckout(true)}
                      >
                        <ArrowUpCircle className="h-4 w-4" />
                        Assinar agora
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Checkout */}
      {showCheckout && (
        <div className="rounded-2xl border-2 border-[#c8714a] bg-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Crown className="h-5 w-5 text-[#c8714a]" />
              Assinar Plano Pro
            </h3>
            <Button variant="ghost" size="icon" onClick={() => {
              setShowCheckout(false)
              removeCoupon()
              setInstallments(3)
              setCardHolderName(''); setCardNumber(''); setCardExpiry('')
              setCardCcv(''); setCardHolderCpf(''); setCardHolderPhone('')
            }}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Ciclo de cobrança */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Ciclo de cobrança</Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'MONTHLY' as const, label: 'Mensal', price: monthlyPrice, note: '' },
                { value: 'YEARLY'  as const, label: 'Anual',  price: annualPrice,  note: proPlan?.annual_note ?? 'Economize 2 meses' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { setCycle(opt.value); setCouponResult(null) }}
                  className={cn(
                    'relative p-4 rounded-xl border-2 text-left transition-all',
                    cycle === opt.value ? 'border-[#c8714a] bg-[#c8714a]/5' : 'border-border hover:border-[#c8714a]/50'
                  )}
                >
                  {opt.note && (
                    <span className="absolute -top-2.5 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                      {opt.note}
                    </span>
                  )}
                  <p className="font-semibold text-foreground">{opt.label}</p>
                  <p className="text-sm text-muted-foreground">{fmtPrice(opt.price)}{opt.value === 'MONTHLY' ? '/mês' : '/ano'}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Forma de pagamento */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Forma de pagamento</Label>
            <div className="grid grid-cols-2 gap-3">
              {BILLING_OPTIONS.map((opt) => {
                const Icon = opt.icon
                const desc = opt.value === 'PIX'
                  ? 'À vista · aprovação imediata'
                  : cycle === 'YEARLY'
                    ? `até 6x · 3x sem juros`
                    : `À vista · ${fmtPrice(finalPrice)}`
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setBillingType(opt.value)}
                    className={cn(
                      'p-3 rounded-xl border-2 text-center transition-all flex flex-col items-center gap-1.5',
                      billingType === opt.value ? 'border-[#c8714a] bg-[#c8714a]/5' : 'border-border hover:border-[#c8714a]/50'
                    )}
                  >
                    <Icon className="h-5 w-5 text-[#c8714a]" />
                    <p className="text-xs font-semibold text-foreground">{opt.label}</p>
                    <p className="text-[10px] text-muted-foreground">{desc}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Seletor de parcelas (anual + cartão) */}
          {billingType === 'CREDIT_CARD' && cycle === 'YEARLY' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Parcelamento</Label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6].map((n) => {
                  const semJuros = n <= 3
                  const parcVal  = Math.ceil((finalPrice / n) * 100) / 100
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setInstallments(n)}
                      className={cn(
                        'p-2.5 rounded-xl border-2 text-center transition-all flex flex-col items-center gap-0.5',
                        installments === n ? 'border-[#c8714a] bg-[#c8714a]/5' : 'border-border hover:border-[#c8714a]/50'
                      )}
                    >
                      <p className="text-xs font-bold text-foreground">{n}x de {fmtPrice(parcVal)}</p>
                      <p className={cn('text-[10px] font-medium', semJuros ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400')}>
                        {semJuros ? 'sem juros' : 'com juros*'}
                      </p>
                    </button>
                  )
                })}
              </div>
              {installments > 3 && (
                <p className="text-[11px] text-muted-foreground">* Juros calculados pelo Asaas no momento do pagamento.</p>
              )}
            </div>
          )}

          {/* Formulário de cartão */}
          {billingType === 'CREDIT_CARD' && (
            <div className="space-y-3 rounded-xl border border-border p-4 bg-muted/30">
              <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-[#c8714a]" />
                Dados do cartão
              </p>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Nome no cartão</Label>
                <Input
                  placeholder="NOME SOBRENOME"
                  value={cardHolderName}
                  onChange={e => setCardHolderName(e.target.value.toUpperCase())}
                  className="uppercase"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Número do cartão</Label>
                <Input
                  placeholder="0000 0000 0000 0000"
                  value={cardNumber}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 16)
                    setCardNumber(v.replace(/(.{4})/g, '$1 ').trim())
                  }}
                  inputMode="numeric"
                  maxLength={19}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Validade (MM/AAAA)</Label>
                  <Input
                    placeholder="MM/AAAA"
                    value={cardExpiry}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 6)
                      setCardExpiry(v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v)
                    }}
                    inputMode="numeric"
                    maxLength={7}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">CVV</Label>
                  <Input
                    placeholder="000"
                    value={cardCcv}
                    onChange={e => setCardCcv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    inputMode="numeric"
                    maxLength={4}
                    type="password"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">CPF do titular</Label>
                <Input
                  placeholder="000.000.000-00"
                  value={cardHolderCpf}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 11)
                    setCardHolderCpf(v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4'))
                  }}
                  inputMode="numeric"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Telefone do titular (opcional)</Label>
                <Input
                  placeholder="(00) 00000-0000"
                  value={cardHolderPhone}
                  onChange={e => setCardHolderPhone(e.target.value)}
                  inputMode="tel"
                />
              </div>
            </div>
          )}

          {/* Cupom de desconto */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" />
              Cupom de desconto (opcional)
            </Label>
            {couponResult?.valid ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800">
                <Check className="h-5 w-5 text-emerald-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{couponResult.code}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-500">{couponResult.description ?? `Desconto de ${fmtPrice(couponResult.discount_amount ?? 0)}`}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-emerald-600" onClick={removeCoupon}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="CUPOM10"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && validateCoupon()}
                  className="uppercase"
                />
                <Button
                  variant="outline"
                  onClick={validateCoupon}
                  disabled={validatingCoupon || !couponCode.trim()}
                  className="shrink-0"
                >
                  {validatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aplicar'}
                </Button>
              </div>
            )}
          </div>

          {/* Resumo do pedido */}
          <div className="rounded-xl bg-muted/40 p-4 space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Plano Pro {cycle === 'MONTHLY' ? 'Mensal' : 'Anual'}</span>
              <span>{fmtPrice(basePrice)}</span>
            </div>
            {couponResult?.valid && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Desconto ({couponResult.code})</span>
                <span>− {fmtPrice(couponResult.discount_amount ?? 0)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-foreground pt-2 border-t border-border">
              <span>Total</span>
              <span>
                {activeInstallments > 1
                  ? `${activeInstallments}x de ${fmtPrice(installmentValue)}${activeInstallments > 3 ? ' + juros' : ''}`
                  : `${fmtPrice(finalPrice)}${cycle === 'MONTHLY' ? '/mês' : '/ano'}`}
              </span>
            </div>
          </div>

          <Button
            className="w-full gap-2 bg-[#c8714a] hover:bg-[#b5623e] text-white h-11"
            onClick={handleCheckout}
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            {submitting
              ? 'Processando...'
              : activeInstallments > 1
                ? `Assinar — ${activeInstallments}x de ${fmtPrice(installmentValue)}${activeInstallments > 3 ? ' + juros' : ''}`
                : `Assinar por ${fmtPrice(finalPrice)}${cycle === 'MONTHLY' ? '/mês' : '/ano'}`}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Pagamento processado com segurança pelo Asaas. Cancele quando quiser.
          </p>
        </div>
      )}

      {/* Informações de pagamento */}
      {!showCheckout && (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Pagamento e cobrança</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: CreditCard, title: 'Formas aceitas', desc: 'PIX e Cartão de Crédito' },
              { icon: Calendar,   title: 'Ciclo de cobrança', desc: 'Mensal ou Anual — cancele quando quiser' },
              { icon: Shield,     title: 'Segurança', desc: 'Pagamentos processados pelo Asaas' },
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
      )}
    </div>
  )
}
