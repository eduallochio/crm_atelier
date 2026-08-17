'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AppTour } from '@/components/tour/app-tour'
import { SessionGuard } from '@/components/layouts/session-guard'

// ssr: false garante que o Sidebar (que usa useQuery) nunca seja
// renderizado no servidor, evitando o erro "No QueryClient set"
const Sidebar = dynamic(() => import('@/components/layouts/sidebar').then(m => m.Sidebar), { ssr: false })

const REMINDER_KEY = 'cashier_reminder_date'

function CashierAutomation() {
  const autoCloseScheduled = useRef(false)

  const { data: settings } = useQuery({
    queryKey: ['system-preferences'],
    queryFn: () => fetch('/api/settings/system').then(r => r.json()),
    staleTime: 60_000,
  })

  const { data: sessions } = useQuery({
    queryKey: ['cashier-sessions-open'],
    queryFn: async () => {
      const res = await fetch('/api/cashiers/sessions?status=aberto')
      if (!res.ok) throw new Error('Erro ao buscar sessões')
      return res.json()
    },
    enabled: !!settings,
    staleTime: 60_000,
  })

  // Lembrete diário: exibe uma vez por dia se não há caixa aberto
  useEffect(() => {
    if (!settings?.fechamento_automatico_caixa) return
    // Só age quando sessions for um array válido (ignora erro/undefined)
    if (!Array.isArray(sessions)) return

    const today = new Date().toISOString().slice(0, 10)
    const lastShown = localStorage.getItem(REMINDER_KEY)
    if (lastShown === today) return

    if (sessions.length === 0) {
      localStorage.setItem(REMINDER_KEY, today)
      toast.warning('Nenhum caixa aberto', {
        description: 'Não esqueça de abrir o caixa para registrar os pagamentos do dia.',
        duration: 10_000,
        action: {
          label: 'Ir para Caixa',
          onClick: () => { window.location.href = '/financeiro/caixa' },
        },
      })
    }
  }, [settings, sessions])

  // Fechamento automático à meia-noite
  useEffect(() => {
    if (!settings?.fechamento_automatico_caixa) return

    // Resetar flag a cada vez que o effect rodar para não perder timer em re-renders
    autoCloseScheduled.current = false

    const now = new Date()
    const midnight = new Date(now)
    midnight.setHours(24, 0, 0, 0)
    const msUntilMidnight = midnight.getTime() - now.getTime()

    if (autoCloseScheduled.current) return
    autoCloseScheduled.current = true

    const timer = setTimeout(async () => {
      autoCloseScheduled.current = false
      try {
        await fetch('/api/cashiers/sessions/close-all', { method: 'POST' })
      } catch {
        // silencioso — erro não crítico
      }
    }, msUntilMidnight)

    return () => {
      clearTimeout(timer)
      autoCloseScheduled.current = false
    }
  }, [settings])

  return null
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <SessionGuard>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <AppTour />
        <CashierAutomation />
        <main className="flex-1 overflow-y-auto lg:ml-64 bg-muted/30">
          {children}
        </main>
      </div>
    </SessionGuard>
  )
}
