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
  const isApiRoute = nextUrl.pathname.startsWith('/api')
  const isAdminRoute = nextUrl.pathname.startsWith('/admin')
  const isPublicRoute =
    nextUrl.pathname === '/' ||
    nextUrl.pathname.startsWith('/lgpd') ||
    nextUrl.pathname.startsWith('/termos') ||
    nextUrl.pathname.startsWith('/privacidade')

  // Rotas de API e públicas: apenas atualiza sessão, sem redirecionamento
  if (isApiRoute || isPublicRoute) {
    return await updateSession(request).then((r) => r.supabaseResponse)
  }

  const { supabaseResponse, user } = await updateSession(request)
  const isLoggedIn = !!user

  // Rotas /admin/* — exige usuário master (app_metadata.is_master)
  if (isAdminRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/login', nextUrl))
    }
    const isMaster = user?.app_metadata?.is_master === true
    if (!isMaster) {
      return NextResponse.redirect(new URL('/dashboard', nextUrl))
    }
    return supabaseResponse
  }

  // Rotas de redefinição e confirmação de email são acessíveis independente do estado de login
  const isPasswordResetRoute =
    nextUrl.pathname.startsWith('/redefinir-senha') ||
    nextUrl.pathname.startsWith('/confirmar-email')

  // Usuário logado tentando acessar login/cadastro → redireciona ao dashboard
  if (isLoggedIn && isAuthRoute && !isPasswordResetRoute) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }

  // Usuário não logado tentando acessar rota protegida → redireciona ao login
  if (!isLoggedIn && !isAuthRoute) {
    return NextResponse.redirect(new URL('/login', nextUrl))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
