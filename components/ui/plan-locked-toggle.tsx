'use client'

import { Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PlanLockedToggleProps {
  title: string
  description: string
}

/**
 * Bloqueio inline de um toggle específico dentro de uma tela com outros
 * toggles liberados (ex: Configurações → Sistema) — diferente do
 * <UpgradePrompt>, que substitui a página inteira (Estoque/Financeiro).
 */
export function PlanLockedToggle({ title, description }: PlanLockedToggleProps) {
  const router = useRouter()

  return (
    <div className="rounded-lg border border-indigo-200 dark:border-indigo-900 bg-indigo-50/40 dark:bg-indigo-950/20 p-4 mt-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground">{title}</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              <Lock className="h-2.5 w-2.5" aria-hidden="true" />
              Pro
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        <div
          aria-hidden="true"
          className="relative inline-flex h-6 w-11 shrink-0 cursor-not-allowed rounded-full border-2 border-transparent bg-input opacity-50"
        >
          <span className="pointer-events-none block h-5 w-5 translate-x-0 rounded-full bg-background shadow-lg ring-0" />
        </div>
      </div>
      <button
        type="button"
        onClick={() => router.push('/configuracoes?tab=assinatura')}
        className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline"
      >
        Disponível a partir do plano Pro — fazer upgrade
      </button>
    </div>
  )
}
