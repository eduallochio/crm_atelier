import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database.types'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANTE: usar getUser() e nunca getSession() no servidor
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  // Refresh token inválido/expirado: limpa os cookies de sessão para evitar
  // que o cliente continue reenviando o mesmo token quebrado indefinidamente
  if (error?.code === 'refresh_token_not_found' || error?.status === 400) {
    await supabase.auth.signOut()
  }

  return { supabaseResponse, user }
}
