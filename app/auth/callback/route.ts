import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  // Em produção atrás de proxy (Vercel), usar o host do header forwarded
  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocalEnv = process.env.NODE_ENV === 'development'
  const baseUrl = isLocalEnv
    ? origin
    : forwardedHost
      ? `https://${forwardedHost}`
      : origin

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Login social (Google) cria organização + profile pelo trigger
      // handle_new_user, mas não passa pelo formulário de cadastro (app/
      // (auth)/actions.ts), que é o único lugar que disparava o email de
      // boas-vindas e a notificação do Telegram — ficavam sempre sem enviar
      // para quem entrava direto com Google. Roda só no primeiro login
      // (profile criado há poucos segundos); não bloqueia o redirect.
      const userId = data.user?.id
      if (userId) {
        notifyFirstLoginIfNeeded(userId).catch(() => { /* não bloqueia o login */ })
      }
      return NextResponse.redirect(`${baseUrl}${next}`)
    }
  }

  return NextResponse.redirect(`${baseUrl}/login?error=oauth`)
}

// Dispara boas-vindas (email + Telegram) só quando o profile do usuário foi
// criado há poucos segundos — sinal de que este é o primeiro login de
// verdade, não um retorno de quem já tem conta (o trigger handle_new_user
// roda uma única vez, no INSERT de auth.users, então profiles.created_at é
// o sinal mais confiável disponível, melhor que last_sign_in_at do Supabase
// Auth, que não fica populado de forma confiável logo após o OAuth)
async function notifyFirstLoginIfNeeded(userId: string) {
  const { db } = await import('@/lib/db')
  const { profiles, organizations } = await import('@/lib/db/schema')
  const { eq, and } = await import('drizzle-orm')

  const [row] = await db
    .select({
      fullName:       profiles.fullName,
      profileCreated: profiles.createdAt,
      orgName:        organizations.name,
    })
    .from(profiles)
    .innerJoin(organizations, eq(organizations.id, profiles.organizationId))
    .where(and(eq(profiles.id, userId), eq(profiles.isOwner, true)))
    .limit(1)

  if (!row?.profileCreated) return
  const ageMs = Date.now() - new Date(row.profileCreated).getTime()
  if (ageMs > 60_000) return // não é o primeiro login — já tinha conta

  const { createClient: createServiceClient } = await import('@supabase/supabase-js')
  const adminSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: userData } = await adminSupabase.auth.admin.getUserById(userId)
  const email = userData?.user?.email
  const fullName = row.fullName || 'por aí'

  if (email) {
    try {
      const { sendBoasVindas } = await import('@/lib/email')
      await sendBoasVindas(email, fullName)
    } catch { /* não bloqueia o login */ }
  }

  try {
    const { notificarTelegram } = await import('@/lib/telegram')
    await notificarTelegram(
      `🆕 <b>Nova organização cadastrada (Google)</b>\n👤 ${fullName}\n📧 ${email ?? '—'}\n🏪 ${row.orgName}`
    )
  } catch { /* não bloqueia o login */ }
}
