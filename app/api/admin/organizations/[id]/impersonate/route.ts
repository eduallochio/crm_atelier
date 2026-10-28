import { NextResponse } from 'next/server'
import { requireMasterFast } from '@/lib/auth/session'
import { setImpersonationCookie } from '@/lib/auth/impersonation'
import { db } from '@/lib/db'
import { profiles, organizations } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { logServerError } from '@/lib/log-error'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const master = await requireMasterFast()
    const { id: orgId } = await params

    const [org] = await db
      .select({ name: organizations.name })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1)

    if (!org) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
    }

    // Prioriza o owner; cai para o profile mais antigo se não houver owner marcado
    const [owner] = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(and(eq(profiles.organizationId, orgId), eq(profiles.isOwner, true)))
      .orderBy(profiles.createdAt)
      .limit(1)

    const [fallback] = owner ? [] : await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.organizationId, orgId))
      .orderBy(profiles.createdAt)
      .limit(1)

    const targetUserId = owner?.id ?? fallback?.id
    if (!targetUserId) {
      return NextResponse.json({ error: 'Organização sem usuários' }, { status: 404 })
    }

    const adminSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: targetUser } = await adminSupabase.auth.admin.getUserById(targetUserId)
    const email = targetUser.user?.email
    if (!email) {
      return NextResponse.json({ error: 'Usuário sem e-mail cadastrado' }, { status: 400 })
    }

    // Gera o magic link apenas para obter o hashed_token — nunca seguimos o
    // redirect no navegador (isso trocaria o cookie de sessão do admin).
    // Em vez disso, trocamos o token por uma sessão aqui no servidor e
    // guardamos os tokens num cookie próprio, separado do cookie sb-* da
    // sessão master — assim o admin continua logado como master.
    const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
    })

    if (linkError || !linkData.properties?.hashed_token) {
      return NextResponse.json({ error: linkError?.message ?? 'Falha ao gerar acesso' }, { status: 500 })
    }

    const { data: otpData, error: otpError } = await adminSupabase.auth.verifyOtp({
      type: 'magiclink',
      token_hash: linkData.properties.hashed_token,
    })

    if (otpError || !otpData.session) {
      return NextResponse.json({ error: otpError?.message ?? 'Falha ao criar sessão' }, { status: 500 })
    }

    await setImpersonationCookie({
      accessToken:      otpData.session.access_token,
      refreshToken:     otpData.session.refresh_token,
      organizationId:   orgId,
      organizationName: org.name,
      masterUserId:     master.id,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    if ((error as Error).message === 'FORBIDDEN')    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    logServerError('[POST /api/admin/organizations/:id/impersonate]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
