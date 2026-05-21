'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const INACTIVITY_MS = 30 * 60 * 1000  // 30 minutos
const WARNING_MS   =  2 * 60 * 1000  // aviso 2 minutos antes

const EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click']

export function useInactivityLogout() {
  const logoutTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const doLogout = async () => {
      toast.error('Sessão encerrada por inatividade. Faça login novamente.')
      await supabase.auth.signOut()
      window.location.href = '/login'
    }

    const resetTimers = () => {
      if (logoutTimer.current)  clearTimeout(logoutTimer.current)
      if (warningTimer.current) clearTimeout(warningTimer.current)

      warningTimer.current = setTimeout(() => {
        toast.warning('Sua sessão expira em 2 minutos por inatividade.', {
          duration: 10_000,
          id: 'inactivity-warning',
        })
      }, INACTIVITY_MS - WARNING_MS)

      logoutTimer.current = setTimeout(doLogout, INACTIVITY_MS)
    }

    // Inicia os timers
    resetTimers()

    // Reinicia ao detectar atividade
    EVENTS.forEach(e => window.addEventListener(e, resetTimers, { passive: true }))

    return () => {
      if (logoutTimer.current)  clearTimeout(logoutTimer.current)
      if (warningTimer.current) clearTimeout(warningTimer.current)
      EVENTS.forEach(e => window.removeEventListener(e, resetTimers))
    }
  }, [])
}
