import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((request) => {
  const { nextUrl, auth: session } = request
  const isLoggedIn = !!session?.user
  const isMaster = !!(session?.user as any)?.isMaster

  const isAuthRoute = nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/cadastro')
  const isApiRoute = nextUrl.pathname.startsWith('/api')
  const isAdminRoute = nextUrl.pathname.startsWith('/admin')
  const isPublicRoute =
    nextUrl.pathname === '/' ||
    nextUrl.pathname.startsWith('/lgpd') ||
    nextUrl.pathname.startsWith('/termos') ||
    nextUrl.pathname.startsWith('/privacidade')

  // Rotas de API não passam por esta proteção
  if (isApiRoute) return NextResponse.next()

  // Rotas públicas (landing page, lgpd, etc.) sempre acessíveis
  if (isPublicRoute) return NextResponse.next()

  // Rotas /admin/* — exige usuário master
  if (isAdminRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/login', nextUrl))
    }
    if (!isMaster) {
      return NextResponse.redirect(new URL('/dashboard', nextUrl))
    }
    return NextResponse.next()
  }

  // Usuário logado tentando acessar login/cadastro → redireciona ao dashboard
  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }

  // Usuário não logado tentando acessar rota protegida → redireciona ao login
  if (!isLoggedIn && !isAuthRoute) {
    return NextResponse.redirect(new URL('/login', nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
