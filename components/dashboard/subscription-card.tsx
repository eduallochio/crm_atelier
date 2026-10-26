'use client'

import { CalendarClock } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { daysUntil, renewalLabel } from '@/lib/utils/subscription'

/** Contador de dias até a próxima cobrança da assinatura — só aparece pra quem é Pro/Enterprise */
export function SubscriptionCard({ nextDueDate }: { nextDueDate: string }) {
  const days = daysUntil(nextDueDate)
  const late = days < 0

  return (
    <section aria-labelledby="sub-h" className="fin-card sub-card px-5 py-5 sm:px-6">
      <div className="flex items-center gap-4">
        <div className={`sub-ic ${late ? 'late' : ''}`} aria-hidden="true">
          <CalendarClock className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 id="sub-h" className="fin-cap">Assinatura</h2>
          <p className={`mt-1 text-[17px] font-semibold ${late ? 'fin-late' : 'text-foreground'}`}>
            {renewalLabel(nextDueDate)}
          </p>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">
            Próxima cobrança em {format(new Date(nextDueDate + 'T00:00:00'), "dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
      </div>
    </section>
  )
}

export const SUBSCRIPTION_CSS = `
.sub-card { display: flex; }
.sub-ic { flex: none; width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: color-mix(in oklab, #C8714A 14%, transparent); color: #C8714A; }
.sub-ic.late { background: color-mix(in oklab, #E2614A 16%, transparent); color: #E2614A; }
`
