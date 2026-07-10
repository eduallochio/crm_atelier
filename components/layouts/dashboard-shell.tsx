'use client'

import { Sidebar } from '@/components/layouts/sidebar'
import { AppTour } from '@/components/tour/app-tour'
import { SessionGuard } from '@/components/layouts/session-guard'

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
