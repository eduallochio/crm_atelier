import { DashboardShell } from '@/components/layouts/dashboard-shell'
import { getSessionUser } from '@/lib/auth/session'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
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

  return <DashboardShell>{children}</DashboardShell>
}
