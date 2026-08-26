import { DashboardShell } from '@/components/layouts/dashboard-shell'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { adminSystemSettings } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

async function getMaintenanceMode(): Promise<boolean> {
  try {
    const [row] = await db
      .select({ value: adminSystemSettings.value })
      .from(adminSystemSettings)
      .where(eq(adminSystemSettings.key, 'maintenance_mode'))
      .limit(1)
    return row?.value === 'true'
  } catch {
    return false
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const maintenanceMode = await getMaintenanceMode()
  if (maintenanceMode) redirect('/manutencao')

  return <DashboardShell>{children}</DashboardShell>
}
