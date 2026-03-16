import { Sidebar } from '@/components/layouts/sidebar'
import { AppTour } from '@/components/tour/app-tour'
import { getSessionUser } from '@/lib/auth/session'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getSessionUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <AppTour />

      <main className="flex-1 overflow-y-auto lg:ml-64 bg-muted/30">
        {children}
      </main>
    </div>
  )
}
