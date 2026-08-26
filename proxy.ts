import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export default async function proxy(request: NextRequest) {
  const { nextUrl } = request

  const isAuthRoute =
    nextUrl.pathname.startsWith('/login') ||
    nextUrl.pathname.startsWith('/cadastro') ||
    nextUrl.pathname.startsWith('/esqueci-senha') ||
    nextUrl.pathname.startsWith('/redefinir-senha') ||
    nextUrl.pathname.startsWith('/confirmar-email')
  const isApiRoute      = nextUrl.pathname.startsWith('/api')
  const isAuthCallback  = nextUrl.pathname.startsWith('/auth/callback')
  const isAdminRoute    = nextUrl.pathname.startsWith('/admin')
  const isMaintenancePage = nextUrl.pathname === '/manutencao'

  // API e callback OAuth: apenas atualiza sessão
  if (isApiRoute || isAuthCallback) {
    return await updateSession(request).then((r) => r.supabaseResponse)
  }

  // Rotas sempre acessíveis sem verificação de sessão
  if (
    isMaintenancePage ||
    nextUrl.pathname.startsWith('/lgpd') ||
    nextUrl.pathname.startsWith('/termos') ||
    nextUrl.pathname.startsWith('/privacidade') ||
    nextUrl.pathname.startsWith('/promo')
  ) {
    return await updateSession(request).then((r) => r.supabaseResponse)
  }

  const { supabaseResponse, user } = await updateSession(request)
  const isLoggedIn = !!user
  const isMaster   = user?.app_metadata?.is_master === true

  // Landing page: usuário logado vai ao dashboard
  if (nextUrl.pathname === '/') {
    if (isLoggedIn) return NextResponse.redirect(new URL('/dashboard', nextUrl))
    return supabaseResponse
  }

  // Rotas /admin/* — exige master
  if (isAdminRoute) {
    if (!isLoggedIn) return NextResponse.redirect(new URL('/login', nextUrl))
    if (!isMaster)   return NextResponse.redirect(new URL('/dashboard', nextUrl))
    return supabaseResponse
  }

  const isPasswordResetRoute =
    nextUrl.pathname.startsWith('/redefinir-senha') ||
    nextUrl.pathname.startsWith('/confirmar-email')

  // Logado tentando acessar auth routes → dashboard
  if (isLoggedIn && isAuthRoute && !isPasswordResetRoute) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }

  // Não logado em rota protegida → login
  if (!isLoggedIn && !isAuthRoute) {
    return NextResponse.redirect(new URL('/login', nextUrl))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|html)$).*)',
  ],
}
