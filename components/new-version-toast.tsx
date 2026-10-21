'use client'

import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { RefreshCw } from 'lucide-react'
import { useNewVersionAvailable } from '@/hooks/use-new-version'

const TOAST_ID = 'new-version-available'

export function NewVersionToast() {
  const available = useNewVersionAvailable()
  const shown = useRef(false)

  useEffect(() => {
    if (!available || shown.current) return
    shown.current = true

    toast('Nova versão disponível', {
      id: TOAST_ID,
      duration: Infinity,
      icon: <RefreshCw className="h-4 w-4" />,
      description: 'Atualize quando terminar o que estiver fazendo.',
      action: {
        label: 'Atualizar agora',
        onClick: () => window.location.reload(),
      },
      closeButton: true,
    })
  }, [available])

  return null
}
