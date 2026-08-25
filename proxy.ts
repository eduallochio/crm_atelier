import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

const STATUS_KEYS = ['maintenance_mode', 'enable_signup']

// Cache em memória com TTL de 30s — funciona por instância de worker
let statusCache: { maintenanceMode: boolean; enableSignup: boolean; at: number } | null = null

async function getSystemStatus(): Promise<{ maintenanceMode: boolean; enableSignup: boolean }> {
  if (statusCache && Date.now() - statusCache.at < 30_000) return statusCache

  try {
    // Usa fetch direto para a tabela via Supabase REST — compatível com Edge Runtime
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    )

    const { data } = await supabase
      .from('admin_system_settings')
      .select('key, value')
      .in('key', STATUS_KEYS)

    const map: Record<string, string> = {}
    for (const row of (data ?? [])) map[row.key] = row.value

    const result = {
      maintenanceMode: map.maintenance_mode === 'true',
      enableSignup: map.enable_signup !== 'false',
      at: Date.now(),
    }

    statusCache = result
    return result
  } catch {
    return { maintenanceMode: false, enableSignup: true }
  }
}

export default async function proxy(request: NextRequest) {
  const { nextUrl } = request

  const isAuthRoute =
    nextUrl.pathname.startsWith('/login') ||
    nextUrl.pathname.startsWith('/cadastro') ||
    nextUrl.pathname.startsWith('/esqueci-senha') ||
    nextUrl.pathname.startsWith('/redefinir-senha') ||
    nextUrl.pathname.startsWith('/confirmar-email')
  const isApiRoute = nextUrl.pathname.startsWith('/api')
  const isAuthCallback = nextUrl.pathname.startsWith('/auth/callback')
  const isAdminRoute = nextUrl.pathname.startsWith('/admin')
  const isMaintenancePage = nextUrl.pathname === '/manutencao'

  // Rotas de API e callback OAuth: apenas atualiza sessão, sem redirecionamento
  if (isApiRoute || isAuthCallback) {
    return await updateSession(request).then((r) => r.supabaseResponse)
  }

  // Página de manutenção em si: sempre acessível
  if (isMaintenancePage) {
    return await updateSession(request).then((r) => r.supabaseResponse)
  }

  // Rotas públicas (lgpd, termos, privacidade, promo): sempre acessíveis
  const isStrictPublic =
    nextUrl.pathname.startsWith('/lgpd') ||
    nextUrl.pathname.startsWith('/termos') ||
    nextUrl.pathname.startsWith('/privacidade') ||
    nextUrl.pathname.startsWith('/promo')

  if (isStrictPublic) {
    return await updateSession(request).then((r) => r.supabaseResponse)
  }

  const { supabaseResponse, user } = await updateSession(request)
  const isLoggedIn = !!user
  const isMaster = user?.app_metadata?.is_master === true

  // Landing page (/): sempre acessível (usuário logado vai direto ao dashboard)
  if (nextUrl.pathname === '/') {
    if (isLoggedIn) return NextResponse.redirect(new URL('/dashboard', nextUrl))
    return supabaseResponse
  }

  // Verificar status do sistema (maintenance_mode e enable_signup)
  // Admins (masters) sempre têm acesso, mesmo em manutenção
  if (!isMaster) {
    const { maintenanceMode, enableSignup } = await getSystemStatus()

    // Modo manutenção: redireciona todos (exceto admins) para /manutencao
    if (maintenanceMode) {
      return NextResponse.redirect(new URL('/manutencao', nextUrl))
    }

    // Cadastros desabilitados: bloqueia /cadastro
    if (!enableSignup && nextUrl.pathname.startsWith('/cadastro')) {
      return NextResponse.redirect(new URL('/login?cadastro=desabilitado', nextUrl))
    }
  }

  // Rotas /admin/* — exige usuário master (app_metadata.is_master)
  if (isAdminRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/login', nextUrl))
    }
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|html)$).*)',
  ],
}
