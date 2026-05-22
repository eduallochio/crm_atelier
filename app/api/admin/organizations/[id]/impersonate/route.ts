import { NextResponse } from 'next/server'
import { requireMaster } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { logServerError } from '@/lib/log-error'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireMaster()
    const { id: orgId } = await params

    // Busca o owner da organização
    const [owner] = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.organizationId, orgId))
      .limit(1)

    if (!owner) {
      return NextResponse.json({ error: 'Organização sem usuários' }, { status: 404 })
    }

    const adminSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Gera magic link para o owner — expira em 1 hora
    const { data, error } = await adminSupabase.auth.admin.generateLink({
      type: 'magiclink',
      email: (await adminSupabase.auth.admin.getUserById(owner.id)).data.user?.email ?? '',
      options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard` },
    })

    if (error || !data.properties?.hashed_token) {
      return NextResponse.json({ error: error?.message ?? 'Falha ao gerar link' }, { status: 500 })
    }

    // Retorna a URL do magic link para abrir em nova aba
    const magicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/verify?token=${data.properties.hashed_token}&type=magiclink&redirect_to=${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`

    return NextResponse.json({ url: magicUrl })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    if ((error as Error).message === 'FORBIDDEN')    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    logServerError('[POST /api/admin/organizations/:id/impersonate]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
