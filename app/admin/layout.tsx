import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminLayoutClient } from '@/components/admin/admin-layout-client'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  if (user.app_metadata?.is_master !== true) redirect('/dashboard')

  return <AdminLayoutClient>{children}</AdminLayoutClient>
}
