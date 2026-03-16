import { auth } from '@/auth'

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
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth()
  if (!session?.user?.id) return null
  return session.user as SessionUser
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
