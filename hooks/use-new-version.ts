'use client'

import { useEffect, useRef, useState } from 'react'

const CHECK_INTERVAL_MS = 5 * 60 * 1000 // 5 minutos

export function useNewVersionAvailable() {
  const [available, setAvailable] = useState(false)
  const currentBuildId = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const check = async () => {
      try {
        const res = await fetch('/api/version', { cache: 'no-store' })
        if (!res.ok) return
        const { buildId } = await res.json() as { buildId: string }

        if (currentBuildId.current === null) {
          currentBuildId.current = buildId
          return
        }

        if (buildId !== currentBuildId.current && !cancelled) {
          setAvailable(true)
        }
      } catch {
        // silencioso — falha de rede não deve incomodar o usuário
      }
    }

    check()
    const interval = setInterval(check, CHECK_INTERVAL_MS)

    // Também revalida quando a aba volta a ficar visível — pega o caso
    // de alguém que deixou a aba aberta em segundo plano por horas
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') check()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      cancelled = true
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  return available
}
