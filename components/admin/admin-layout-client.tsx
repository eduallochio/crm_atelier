'use client'

import { useState } from 'react'
import { AdminSidebar } from './admin-sidebar'
import { AdminHeader } from './admin-header'

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      <AdminSidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <AdminHeader onMenuToggle={() => setMobileOpen((v) => !v)} />
        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
