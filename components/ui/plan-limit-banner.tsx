'use client'

import { AlertTriangle, Lock, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface PlanLimitBannerProps {
  resource: string    // ex: "clientes", "serviços", "ordens de serviço"
  usage: number
  limit: number
  atLimit: boolean    // true = bloqueado; false = aviso (próximo do limite)
}

export function PlanLimitBanner({ resource, usage, limit, atLimit }: PlanLimitBannerProps) {
  const router = useRouter()

  if (atLimit) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-4 flex flex-col items-center gap-3 text-center my-2">
        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
          <Lock className="h-5 w-5 text-red-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-red-700 dark:text-red-400">
            Limite atingido — {usage}/{limit} {resource}
          </p>
          <p className="text-xs text-red-600/80 dark:text-red-400/70 mt-0.5">
            O plano gratuito não permite adicionar mais {resource}. Faça upgrade para continuar.
          </p>
        </div>
        <Button
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
          onClick={() => router.push('/configuracoes?tab=assinatura')}
        >
          <Zap className="h-3.5 w-3.5" />
          Fazer Upgrade
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 p-3 flex items-start gap-3 my-2">
      <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Você está usando <strong>{usage} de {limit}</strong> {resource} do plano gratuito.{' '}
          <button
            type="button"
            className="underline font-medium hover:text-amber-900 dark:hover:text-amber-200"
            onClick={() => router.push('/configuracoes?tab=assinatura')}
          >
            Fazer upgrade
          </button>
          {' '}para remover esse limite.
        </p>
      </div>
    </div>
  )
}
