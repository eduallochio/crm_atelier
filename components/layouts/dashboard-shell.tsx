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
const RENEWAL_REMINDER_KEY = 'renewal_reminder_date'

function RenewalReminder() {
  const { data } = useQuery({
    queryKey: ['subscription-info'],
    queryFn: async () => {
      const res = await fetch('/api/subscription')
      if (!res.ok) return null
      return res.json() as Promise<{ plan: string; next_due_date: string | null; value?: number }>
    },
    staleTime: 5 * 60_000, // 5 minutos
  })

  useEffect(() => {
    if (!data?.next_due_date || data.plan !== 'pro') return

    const today = new Date().toISOString().slice(0, 10)
    const lastShown = localStorage.getItem(RENEWAL_REMINDER_KEY)
    if (lastShown === today) return

    const due = new Date(data.next_due_date + 'T12:00:00')
    const daysUntil = Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

    if (daysUntil <= 7 && daysUntil >= 0) {
      localStorage.setItem(RENEWAL_REMINDER_KEY, today)
      const dueFmt = due.toLocaleDateString('pt-BR')
      const msg = daysUntil === 0
        ? 'Sua assinatura Pro renova hoje!'
        : `Sua assinatura Pro renova em ${daysUntil} dia${daysUntil > 1 ? 's' : ''} (${dueFmt})`

      toast.info(msg, {
        description: data.value ? `Valor: R$ ${Number(data.value).toFixed(2).replace('.', ',')}` : undefined,
        duration: 12_000,
        action: {
          label: 'Ver assinatura',
          onClick: () => { window.location.href = '/configuracoes?tab=assinatura' },
        },
      })
    }
  }, [data])

  return null
}

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
        <RenewalReminder />
        <main className="flex-1 overflow-y-auto lg:ml-64 bg-muted/30">
          {children}
        </main>
      </div>
    </SessionGuard>
  )
}
