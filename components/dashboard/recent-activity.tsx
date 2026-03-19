'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
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

const TYPE_CONFIG = {
  client: {
    icon: UserPlus,
    dot: 'bg-blue-500',
    ring: 'ring-blue-100 dark:ring-blue-900',
    iconColor: 'text-blue-500',
  },
  order: {
    icon: FileText,
    dot: 'bg-amber-500',
    ring: 'ring-amber-100 dark:ring-amber-900',
    iconColor: 'text-amber-500',
  },
  payment: {
    icon: DollarSign,
    dot: 'bg-emerald-500',
    ring: 'ring-emerald-100 dark:ring-emerald-900',
    iconColor: 'text-emerald-500',
  },
  order_completed: {
    icon: CheckCircle2,
    dot: 'bg-violet-500',
    ring: 'ring-violet-100 dark:ring-violet-900',
    iconColor: 'text-violet-500',
  },
}

export function RecentActivity({ activities, isLoading }: RecentActivityProps) {
  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-4">
                <Skeleton className="w-8 h-8 rounded-full shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2 pt-1">
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
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
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground max-w-[200px]">
              Nenhuma atividade ainda. Comece cadastrando seus primeiros clientes!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Atividade Recente</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline vertical line */}
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border/70" />

          <div className="space-y-1">
            {activities.map((activity, index) => {
              const config = TYPE_CONFIG[activity.type] ?? TYPE_CONFIG.order
              const Icon = config.icon
              const isLast = index === activities.length - 1

              return (
                <div
                  key={activity.id}
                  className={cn(
                    'flex items-start gap-4 pl-1 pr-2 py-2.5 rounded-xl',
                    'hover:bg-muted/50 transition-colors',
                    !isLast && 'mb-0'
                  )}
                >
                  {/* Timeline dot */}
                  <div className={cn(
                    'relative z-10 w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0',
                    'bg-card ring-2',
                    config.ring,
                  )}>
                    <Icon className={cn('h-3.5 w-3.5', config.iconColor)} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[13px] font-medium text-foreground leading-snug">
                        {activity.title}
                      </p>
                      <span className="text-[10.5px] text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">
                        {getRelativeTime(activity.timestamp)}
                      </span>
                    </div>
                    {activity.description && (
                      <p className="text-[12px] text-muted-foreground mt-0.5 truncate">
                        {activity.description}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
