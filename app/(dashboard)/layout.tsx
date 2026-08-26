import { DashboardShell } from '@/components/layouts/dashboard-shell'
import { getSessionUser } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { adminSystemSettings } from '@/lib/db/schema'
import { inArray } from 'drizzle-orm'

async function getSystemFlags() {
  try {
    const rows = await db
      .select({ key: adminSystemSettings.key, value: adminSystemSettings.value })
      .from(adminSystemSettings)
      .where(inArray(adminSystemSettings.key, ['maintenance_mode']))

    const map: Record<string, string> = {}
    for (const r of rows) map[r.key] = r.value
    return { maintenanceMode: map.maintenance_mode === 'true' }
  } catch {
    return { maintenanceMode: false }
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let user = null
  try {
    user = await getSessionUser()
  } catch (err) {
    if ((err as Error)?.message?.startsWith('NEXT_')) throw err
    redirect('/login')
  }

  if (!user) {
    redirect('/login')
  }

  const { maintenanceMode } = await getSystemFlags()
  if (maintenanceMode) {
    redirect('/manutencao')
  }

  return <DashboardShell>{children}</DashboardShell>
}
