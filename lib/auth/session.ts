import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getImpersonationPayload } from '@/lib/auth/impersonation'

export type SessionUser = {
  id: string
  email: string
  name: string
  organizationId: string
  role: string
  isOwner: boolean
  isMaster: boolean
  impersonating?: { organizationName: string }
}

/**
 * Retorna o usuário da sessão atual ou null.
 * Use em Server Components e API Routes.
 *
 * O organization_id é buscado da tabela profiles (não do user_metadata),
 * pois o trigger handle_new_user não popula o user_metadata do Supabase Auth.
 *
 * Se houver um cookie de impersonation ativo (admin "entrando como" uma
 * organização), retorna o usuário impersonado em vez da sessão real —
 * sem nunca sobrescrever os cookies sb-* da sessão master.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const impersonation = await getImpersonationPayload()
  if (impersonation) {
    const adminSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data, error } = await adminSupabase.auth.getUser(impersonation.accessToken)
    if (!error && data.user) {
      const [profile] = await db
        .select({
          organizationId: profiles.organizationId,
          role:           profiles.role,
          isOwner:        profiles.isOwner,
          fullName:       profiles.fullName,
        })
        .from(profiles)
        .where(eq(profiles.id, data.user.id))
        .limit(1)

      if (profile) {
        return {
          id:             data.user.id,
          email:          data.user.email ?? '',
          name:           profile.fullName ?? '',
          organizationId: profile.organizationId,
          role:           profile.role,
          isOwner:        profile.isOwner,
          isMaster:       false, // impersonado nunca herda privilégios de master
          impersonating:  { organizationName: impersonation.organizationName },
        }
      }
    }
    // Cookie de impersonation inválido/expirado — cai para a sessão real abaixo
  }

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
 * Use em API routes que também precisam de organizationId.
 */
export async function requireMaster(): Promise<SessionUser> {
  const user = await requireAuth()
  if (!user.isMaster) {
    throw new Error('FORBIDDEN')
  }
  return user
}

/**
 * Versão rápida: verifica master sem query ao banco.
 * isMaster vem do app_metadata no JWT — não precisa do profile.
 * Use em API routes admin que NÃO precisam de organizationId.
 */
export async function requireMasterFast(): Promise<{ id: string; email: string; isMaster: true }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('UNAUTHORIZED')
  if (user.app_metadata?.is_master !== true) throw new Error('FORBIDDEN')
  return { id: user.id, email: user.email ?? '', isMaster: true }
}
