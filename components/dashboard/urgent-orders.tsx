'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Clock, Calendar, ArrowRight, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface UrgentOrder {
  id: string
  numero: string
  client: { nome: string } | null
  data_prevista: string
  status: string
  valor_total: number
}

interface UrgentOrdersProps {
  orders: UrgentOrder[]
  isLoading?: boolean
}

export function UrgentOrders({ orders, isLoading }: UrgentOrdersProps) {
  const parseLocalDate = (dateStr: string): Date => {
    const [y, m, d] = dateStr.split('T')[0].split('-').map(Number)
    return new Date(y, m - 1, d)
  }

  const calculateDaysRemaining = (deliveryDate: string): number => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const delivery = parseLocalDate(deliveryDate)
    return Math.ceil((delivery.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }

  const getUrgency = (days: number) => {
    if (days < 0)  return { level: 'overdue',  label: `Atrasado ${Math.abs(days)}d`, bar: 'bg-red-500',    badge: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900' }
    if (days === 0) return { level: 'today',   label: 'Entrega hoje',               bar: 'bg-red-500',    badge: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900' }
    if (days === 1) return { level: 'tomorrow', label: 'Entrega amanhã',            bar: 'bg-orange-400', badge: 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900' }
    if (days <= 5)  return { level: 'warning',  label: `${days} dias`,              bar: 'bg-amber-400',  badge: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900' }
    return           { level: 'normal',  label: `${days} dias`,              bar: 'bg-emerald-500', badge: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900' }
  }

  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            Ordens Urgentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[68px] rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (orders.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            Ordens Urgentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Tudo em dia!</p>
              <p className="text-xs text-muted-foreground mt-0.5">Todas as ordens estão dentro do prazo</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            Ordens Urgentes
          </CardTitle>
          <Link href="/ordens-servico">
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground">
              Ver todas
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2.5">
          {orders.map((order) => {
            const days = calculateDaysRemaining(order.data_prevista)
            const urgency = getUrgency(days)

            return (
              <Link
                key={order.id}
                href={`/ordens-servico?id=${order.id}`}
                className="block group"
              >
                <div className="relative flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-card hover:bg-muted/50 hover:border-border transition-all duration-200 overflow-hidden">
                  {/* Left colored strip */}
                  <div className={cn('absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl', urgency.bar)} />

                  {/* Days remaining badge */}
                  <div className={cn(
                    'shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded-xl border text-center',
                    urgency.badge
                  )}>
                    <span className="text-[15px] font-bold leading-none">
                      {Math.abs(days)}
                    </span>
                    <span className="text-[9px] font-medium uppercase tracking-wide leading-tight mt-0.5">
                      {days < 0 ? 'atr.' : 'dias'}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[13px] font-semibold text-foreground">#{order.numero}</span>
                      <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full border', urgency.badge)}>
                        {urgency.label}
                      </span>
                    </div>
                    <p className="text-[12px] text-muted-foreground truncate">
                      {order.client?.nome || 'Cliente não informado'}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-2.5 w-2.5" />
                        {parseLocalDate(order.data_prevista).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="text-[11px] font-semibold text-foreground">
                        R$ {order.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <Clock className="h-4 w-4 text-muted-foreground/40 shrink-0 group-hover:text-muted-foreground transition-colors" />
                </div>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
