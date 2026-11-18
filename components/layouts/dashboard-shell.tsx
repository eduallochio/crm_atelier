'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Lock } from 'lucide-react'
import { AppTour } from '@/components/tour/app-tour'
import { SessionGuard } from '@/components/layouts/session-guard'
import { ProCelebrationWatcher } from '@/components/subscription/plan-celebration'
import { ImpersonationBanner } from '@/components/admin/impersonation-banner'
import { OpenCashierDialog } from '@/components/financeiro/open-cashier-dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const SERIF = { fontFamily: "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif" }

// ssr: false — tentativa anterior de habilitar SSR aqui (sem esse flag)
// reproduziu um hydration mismatch NOVO e real: o id="radix-..." gerado por
// useId() no DropdownMenuTrigger do menu de usuário divergiu entre servidor
// e cliente (ver sidebar.tsx:498), mesmo com suppressHydrationWarning no
// elemento — o Radix monta Popper/Menu providers que amplificam qualquer
// mismatch anterior na árvore em vez de só suprimir o warning local. Ficou
// pior que o ssr:false original, então foi revertido. loading: mantém o
// espaço reservado (largura fixa) até a hidratação completar.
const Sidebar = dynamic(() => import('@/components/layouts/sidebar').then(m => m.Sidebar), {
  ssr: false,
  loading: () => <div className="hidden lg:block fixed top-0 left-0 z-40 h-screen w-64 bg-[#2C1810]" />,
})

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
  const { data: settings } = useQuery({
    queryKey: ['system-preferences'],
    queryFn: () => fetch('/api/settings/system').then(r => r.json()),
    staleTime: 60_000,
  })

  const { data: sessions } = useQuery({
    queryKey: ['cashier-sessions-open'],
    queryFn: async () => {
      const res = await fetch('/api/cashiers/sessions?status=aberto')
      // Caixa é módulo exclusivo do plano Pro+ — requireProPlan() responde 403
      // para organizações Free/sem licença vitalícia. Isso não é um erro nem
      // "nenhum caixa aberto" (que dispararia o aviso abaixo indevidamente),
      // é "módulo não disponível para esta org" — sentinel próprio para o
      // efeito abaixo distinguir dos dois outros casos
      if (res.status === 403) return 'no_access' as const
      if (!res.ok) throw new Error('Erro ao buscar sessões')
      return res.json()
    },
    enabled: !!settings,
    staleTime: 60_000,
  })

  // Lembrete diário centralizado — antes era um toast de canto (pequeno e
  // some sozinho), agora fica visível até o usuário abrir o caixa ou fechar
  const [showReminder, setShowReminder] = useState(false)
  const [opening, setOpening] = useState(false)

  useEffect(() => {
    if (!settings?.fechamento_automatico_caixa) return
    if (sessions === 'no_access') return
    // Só age quando sessions for um array válido (ignora erro/undefined)
    if (!Array.isArray(sessions)) return

    const today = new Date().toISOString().slice(0, 10)
    const lastShown = localStorage.getItem(REMINDER_KEY)
    if (lastShown === today) return

    if (sessions.length === 0) {
      localStorage.setItem(REMINDER_KEY, today)
      setShowReminder(true)
    }
  }, [settings, sessions])

  // O fechamento automático à meia-noite roda no servidor via Vercel Cron
  // (app/api/cron/close-cashiers), não mais aqui — um setTimeout no
  // navegador só dispararia se alguém estivesse com o app aberto bem no
  // instante da virada, o que raramente acontece na prática.

  return (
    <>
      <AlertDialog open={showReminder} onOpenChange={(v) => { if (!v) setShowReminder(false) }}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/50">
              <Lock className="h-7 w-7 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            </div>
            <AlertDialogTitle className="text-center text-[26px] font-normal leading-tight" style={SERIF}>Nenhum caixa aberto</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-[15px]">
              Não esqueça de abrir o caixa para registrar os pagamentos do dia.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogCancel onClick={() => setShowReminder(false)}>Fechar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowReminder(false); setOpening(true) }}>Abrir caixa agora</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <OpenCashierDialog open={opening} onClose={() => setOpening(false)} />
    </>
  )
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  // Trava o scroll do <body> enquanto o dashboard está montado — sem isso, em
  // páginas longas (ex.: o Manual do sistema) o documento ganha um scroll
  // próprio que compete com o scroll interno do <main>, dando a impressão de
  // duas barras de rolagem e um espaço vazio sobrando abaixo do conteúdo
  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prevOverflow }
  }, [])

  return (
    <SessionGuard>
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        <ImpersonationBanner />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <AppTour />
          <CashierAutomation />
          <RenewalReminder />
          <ProCelebrationWatcher />
          <main className="flex-1 overflow-y-auto lg:ml-64 bg-muted/30">
            {children}
          </main>
        </div>
      </div>
    </SessionGuard>
  )
}
