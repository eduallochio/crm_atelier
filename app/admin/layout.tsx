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
  } catch (err) {
    // Propaga NEXT_REDIRECT/NEXT_NOT_FOUND corretamente (lançados por redirect()/notFound())
    if ((err as Error)?.message?.startsWith('NEXT_')) throw err
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
