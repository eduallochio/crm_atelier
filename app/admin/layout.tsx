import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth/session'
import { AdminLayoutClient } from '@/components/admin/admin-layout-client'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let user = null
  try {
    user = await getSessionUser()
  } catch {
    redirect('/login')
  }

  if (!user) {
    redirect('/login')
  }

  if (!user.isMaster) {
    redirect('/dashboard')
  }

  return <AdminLayoutClient>{children}</AdminLayoutClient>
}
