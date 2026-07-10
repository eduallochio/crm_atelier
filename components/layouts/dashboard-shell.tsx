'use client'

import dynamic from 'next/dynamic'
import { AppTour } from '@/components/tour/app-tour'
import { SessionGuard } from '@/components/layouts/session-guard'

// ssr: false garante que o Sidebar (que usa useQuery) nunca seja
// renderizado no servidor, evitando o erro "No QueryClient set"
const Sidebar = dynamic(() => import('@/components/layouts/sidebar').then(m => m.Sidebar), { ssr: false })

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <SessionGuard>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <AppTour />
        <main className="flex-1 overflow-y-auto lg:ml-64 bg-muted/30">
          {children}
        </main>
      </div>
    </SessionGuard>
  )
}
