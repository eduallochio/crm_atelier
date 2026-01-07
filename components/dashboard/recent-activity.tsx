'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserPlus, FileText, DollarSign, Clock, CheckCircle2 } from 'lucide-react'
import { getRelativeTime } from '@/lib/utils/date-utils'
import { cn } from '@/lib/utils'

export interface Activity {
  id: string
  type: 'client' | 'order' | 'payment' | 'order_completed'
  title: string
  description?: string
  timestamp: string
  metadata?: {
    clientName?: string
    orderNumber?: string
    amount?: number
    status?: string
  }
}

interface RecentActivityProps {
  activities: Activity[]
  isLoading?: boolean
}

export function RecentActivity({ activities, isLoading }: RecentActivityProps) {
  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'client':
        return UserPlus
      case 'order':
        return FileText
      case 'payment':
        return DollarSign
      case 'order_completed':
        return CheckCircle2
      default:
        return Clock
    }
  }

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'client':
        return 'bg-blue-500 dark:bg-blue-600'
      case 'order':
        return 'bg-green-500 dark:bg-green-600'
      case 'payment':
        return 'bg-yellow-500 dark:bg-yellow-600'
      case 'order_completed':
        return 'bg-purple-500 dark:bg-purple-600'
      default:
        return 'bg-gray-500 dark:bg-gray-600'
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 bg-muted rounded-full mb-4">
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">
              Nenhuma atividade ainda. Comece cadastrando seus primeiros clientes!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Atividade Recente</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {activities.map((activity, index) => {
            const Icon = getActivityIcon(activity.type)
            const colorClass = getActivityColor(activity.type)

            return (
              <div
                key={activity.id}
                className={cn(
                  'flex items-start gap-4 p-3 rounded-lg transition-colors hover:bg-muted/50',
                  index !== activities.length - 1 && 'border-b border-border/50'
                )}
              >
                <div className={cn('p-2 rounded-full shrink-0', colorClass)}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {activity.title}
                  </p>
                  {activity.description && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {activity.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {getRelativeTime(activity.timestamp)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
