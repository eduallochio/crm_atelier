'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Clock, Calendar, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface UrgentOrder {
  id: string
  numero: string
  client: {
    nome: string
  } | null
  data_entrega: string
  status: string
  valor_total: number
}

interface UrgentOrdersProps {
  orders: UrgentOrder[]
  isLoading?: boolean
}

export function UrgentOrders({ orders, isLoading }: UrgentOrdersProps) {
  const calculateDaysRemaining = (deliveryDate: string): number => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const delivery = new Date(deliveryDate)
    delivery.setHours(0, 0, 0, 0)
    
    const diffTime = delivery.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays
  }

  const getUrgencyLevel = (daysRemaining: number): 'urgent' | 'warning' | 'normal' => {
    if (daysRemaining < 0) return 'urgent' // Atrasado
    if (daysRemaining <= 2) return 'urgent'
    if (daysRemaining <= 5) return 'warning'
    return 'normal'
  }

  const getUrgencyStyles = (level: 'urgent' | 'warning' | 'normal') => {
    switch (level) {
      case 'urgent':
        return {
          badge: 'bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-400 border-red-200 dark:border-red-900',
          icon: 'text-red-600 dark:text-red-400',
          border: 'border-l-4 border-l-red-500',
        }
      case 'warning':
        return {
          badge: 'bg-yellow-100 dark:bg-yellow-950/50 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900',
          icon: 'text-yellow-600 dark:text-yellow-400',
          border: 'border-l-4 border-l-yellow-500',
        }
      default:
        return {
          badge: 'bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-400 border-green-200 dark:border-green-900',
          icon: 'text-green-600 dark:text-green-400',
          border: 'border-l-4 border-l-green-500',
        }
    }
  }

  const getUrgencyText = (daysRemaining: number): string => {
    if (daysRemaining < 0) return `Atrasado ${Math.abs(daysRemaining)} ${Math.abs(daysRemaining) === 1 ? 'dia' : 'dias'}`
    if (daysRemaining === 0) return 'Entrega hoje'
    if (daysRemaining === 1) return 'Entrega amanhã'
    return `Faltam ${daysRemaining} dias`
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Ordens Urgentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 border border-border rounded-lg animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Ordens Urgentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-full mb-4">
              <Clock className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              Nenhuma ordem urgente
            </p>
            <p className="text-sm text-muted-foreground">
              Todas as ordens estão dentro do prazo
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Ordens Urgentes
          </CardTitle>
          <Link href="/ordens-servico">
            <Button variant="ghost" size="sm" className="gap-2">
              Ver todas
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {orders.map((order) => {
            const daysRemaining = calculateDaysRemaining(order.data_entrega)
            const urgencyLevel = getUrgencyLevel(daysRemaining)
            const styles = getUrgencyStyles(urgencyLevel)

            return (
              <Link 
                key={order.id} 
                href={`/ordens-servico?id=${order.id}`}
                className="block"
              >
                <div
                  className={cn(
                    'p-4 border border-border rounded-lg transition-all hover:shadow-md hover:scale-[1.01]',
                    styles.border
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-foreground text-sm">
                          {order.numero}
                        </h4>
                        <span className={cn(
                          'px-2 py-0.5 text-xs font-medium rounded-full border',
                          styles.badge
                        )}>
                          {getUrgencyText(daysRemaining)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {order.client?.nome || 'Cliente não informado'}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(order.data_entrega).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="font-medium text-foreground">
                          R$ {order.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                    <div className={cn('p-2 rounded-lg bg-muted', styles.icon)}>
                      {urgencyLevel === 'urgent' ? (
                        <AlertTriangle className="h-5 w-5" />
                      ) : (
                        <Clock className="h-5 w-5" />
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
