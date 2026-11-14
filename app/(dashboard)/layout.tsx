import { DashboardShell } from '@/components/layouts/dashboard-shell'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { adminSystemSettings, profiles, organizations } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getImpersonationPayload } from '@/lib/auth/impersonation'

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

  // Organização suspensa pelo admin, ou sem telefone (login/cadastro via
  // Google não passa pela validação de telefone obrigatório do signup()
  // tradicional — ver app/completar-perfil): bloqueia o acesso ao
  // dashboard. Não aplica durante impersonation — o admin precisa poder
  // entrar numa org suspensa/incompleta (ex: pra investigar antes de reativar)
  const impersonation = await getImpersonationPayload()
  if (!impersonation) {
    const [profile] = await db
      .select({ organizationId: profiles.organizationId })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1)

    if (profile) {
      const [org] = await db
        .select({ subscriptionStatus: organizations.subscriptionStatus, phone: organizations.phone })
        .from(organizations)
        .where(eq(organizations.id, profile.organizationId))
        .limit(1)

      if (org?.subscriptionStatus === 'suspended') {
        redirect('/suspenso')
      }
      if (!org?.phone) {
        redirect('/completar-perfil')
      }
    }
  }

  return <DashboardShell>{children}</DashboardShell>
}
