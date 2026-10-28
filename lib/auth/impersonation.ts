import { cookies } from 'next/headers'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

// Cookie próprio, separado dos cookies sb-* da sessão master — permite que o
// admin "entre como" uma organização sem perder a própria sessão de master.
// httpOnly: só o servidor lê; o middleware usa isso para montar um client
// Supabase autenticado como o owner da organização impersonada.
export const IMPERSONATION_COOKIE = 'impersonation_session'

type ImpersonationPayload = {
  accessToken: string
  refreshToken: string
  organizationId: string
  organizationName: string
  masterUserId: string // quem iniciou — auditoria e proteção contra cookie forjado
}

export async function setImpersonationCookie(payload: ImpersonationPayload) {
  const cookieStore = await cookies()
  cookieStore.set(IMPERSONATION_COOKIE, JSON.stringify(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60, // 1 hora — mesma janela do magic link original
  })
}

export async function getImpersonationPayload(): Promise<ImpersonationPayload | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(IMPERSONATION_COOKIE)?.value
  if (!raw) return null
  try {
    return JSON.parse(raw) as ImpersonationPayload
  } catch {
    return null
  }
}

export async function clearImpersonationCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(IMPERSONATION_COOKIE)
}

/** Client Supabase autenticado com a sessão impersonada (access/refresh token do owner) */
export function createImpersonatedClient(accessToken: string, refreshToken: string) {
  const client = createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  return { client, accessToken, refreshToken }
}
