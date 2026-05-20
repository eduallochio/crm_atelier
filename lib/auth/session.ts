import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export type SessionUser = {
  id: string
  email: string
  name: string
  organizationId: string
  role: string
  isOwner: boolean
  isMaster: boolean
}

/**
 * Retorna o usuário da sessão atual ou null.
 * Use em Server Components e API Routes.
 *
 * O organization_id é buscado da tabela profiles (não do user_metadata),
 * pois o trigger handle_new_user não popula o user_metadata do Supabase Auth.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Busca o profile para obter organization_id, role e is_owner
  const [profile] = await db
    .select({
      organizationId: profiles.organizationId,
      role:           profiles.role,
      isOwner:        profiles.isOwner,
      fullName:       profiles.fullName,
    })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1)

  if (!profile) return null

  return {
    id:             user.id,
    email:          user.email ?? '',
    name:           profile.fullName ?? user.user_metadata?.full_name ?? '',
    organizationId: profile.organizationId,
    role:           profile.role,
    isOwner:        profile.isOwner,
    isMaster:       user.app_metadata?.is_master === true,
  }
}

/**
 * Retorna o usuário da sessão ou lança erro 401.
 * Use em API Routes que exigem autenticação.
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) {
    throw new Error('UNAUTHORIZED')
  }
  return user
}

/**
 * Retorna o organization_id do usuário logado.
 * Atalho conveniente para uso nas API routes.
 */
export async function getOrganizationId(): Promise<string> {
  const user = await requireAuth()
  return user.organizationId
}

/**
 * Exige que o usuário seja master. Lança erro 403 caso contrário.
 * Use em API routes e layouts exclusivos do painel admin.
 */
export async function requireMaster(): Promise<SessionUser> {
  const user = await requireAuth()
  if (!user.isMaster) {
    throw new Error('FORBIDDEN')
  }
  return user
}
