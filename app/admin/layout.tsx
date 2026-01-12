'use client'

import { useEffect } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminHeader } from '@/components/admin/admin-header'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        // Verificar autenticação
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          redirect('/login')
        }

        // Verificar role
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (error || !profile) {
          redirect('/dashboard')
        }

        // Verificar se é admin
        const adminRoles = ['admin', 'super_admin', 'support', 'billing']
        if (!adminRoles.includes(profile.role)) {
          redirect('/dashboard')
        }
      } catch (error) {
        redirect('/dashboard')
      }
    }

    checkAdminAccess()
  }, [])

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <AdminHeader />

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
