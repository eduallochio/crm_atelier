'use client'

import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface UpgradePromptProps {
  message?: string
}

export function UpgradePrompt({ message }: UpgradePromptProps) {
  const defaultMessage =
    'Este recurso está disponível a partir do plano Pro. Faça upgrade para desbloquear todas as funcionalidades.'

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="flex flex-col items-center gap-4 max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center">
          <Lock className="h-8 w-8 text-indigo-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Recurso do Plano Pago</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {message ?? defaultMessage}
          </p>
        </div>
        <Button className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white">
          Fazer Upgrade para Pro
        </Button>
      </div>
    </div>
  )
}
