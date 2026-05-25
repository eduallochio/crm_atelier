import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { organizations, profiles, adminSystemSettings } from '@/lib/db/schema'
import { eq, desc, inArray } from 'drizzle-orm'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { logServerError } from '@/lib/log-error'
import { hasLifetimeLicense } from '@/lib/plan-limits'

const DEFAULTS = {
  max_users_free: 1,
}

async function getMaxUsersFree(): Promise<number> {
  try {
    const rows = await db
      .select({ value: adminSystemSettings.value })
      .from(adminSystemSettings)
      .where(eq(adminSystemSettings.key, 'max_users_free'))
      .limit(1)
    const val = parseInt(rows[0]?.value ?? '')
    return !isNaN(val) && val > 0 ? val : DEFAULTS.max_users_free
  } catch {
    return DEFAULTS.max_users_free
  }
}

export async function GET() {
  try {
    const user = await requireAuth()
    const orgId = user.organizationId

    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get profiles for this org
    const profileRows = await db
      .select({
        id: profiles.id,
        fullName: profiles.fullName,
        role: profiles.role,
        isOwner: profiles.isOwner,
        createdAt: profiles.createdAt,
      })
      .from(profiles)
      .where(eq(profiles.organizationId, orgId))
      .orderBy(desc(profiles.isOwner), profiles.createdAt)

    // Get emails from Supabase auth
    const ids = profileRows.map((p) => p.id)
    let emailMap: Record<string, string> = {}
    if (ids.length > 0) {
      const { data } = await supabase.auth.admin.listUsers()
      if (data?.users) {
        for (const u of data.users) {
          if (ids.includes(u.id)) {
            emailMap[u.id] = u.email ?? ''
          }
        }
      }
    }

    const result = profileRows.map((p) => ({
      id: p.id,
      full_name: p.fullName,
      email: emailMap[p.id] ?? '',
      role: p.role,
      is_owner: p.isOwner,
      created_at: p.createdAt,
    }))

    return NextResponse.json(result)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[GET /api/users]', error); console.error('[GET /api/users]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth()

    // Somente owner pode convidar usuários
    if (!user.isOwner) {
      return NextResponse.json({ error: 'Apenas o proprietário pode convidar usuários' }, { status: 403 })
    }

    const { full_name, email, password, role } = await req.json()

    if (!full_name?.trim() || !email?.trim() || !password?.trim()) {
      return NextResponse.json({ error: 'Nome, email e senha são obrigatórios' }, { status: 400 })
    }

    const validRoles = ['admin', 'member']
    const safeRole = validRoles.includes(role) ? role : 'member'

    // Verificar limite do plano
    const [orgRows, maxUsers, lifetime] = await Promise.all([
      db.select({ plan: organizations.plan })
        .from(organizations)
        .where(eq(organizations.id, user.organizationId))
        .limit(1),
      getMaxUsersFree(),
      hasLifetimeLicense(user.organizationId),
    ])

    const plan = orgRows[0]?.plan ?? 'free'

    if (!lifetime && plan === 'free') {
      const countRows = await db
        .select({ count: profiles.id })
        .from(profiles)
        .where(eq(profiles.organizationId, user.organizationId))

      if (countRows.length >= maxUsers) {
        return NextResponse.json({
          error: `O plano gratuito permite apenas ${maxUsers} usuário(s). Faça upgrade para o plano Pro para adicionar mais.`,
        }, { status: 403 })
      }
    }

    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true,
      user_metadata: { full_name: full_name.trim() },
    })

    if (authError) {
      if (authError.message.includes('already') || authError.message.includes('duplicate')) {
        return NextResponse.json({ error: 'Este email já está em uso' }, { status: 409 })
      }
      throw authError
    }

    const newUserId = authData.user.id

    // Criar perfil na tabela profiles
    await db.insert(profiles).values({
      id: newUserId,
      organizationId: user.organizationId,
      fullName: full_name.trim(),
      role: safeRole,
      isOwner: false,
    })

    return NextResponse.json({
      id: newUserId,
      full_name: full_name.trim(),
      email: email.toLowerCase().trim(),
      role: safeRole,
      is_owner: false,
    }, { status: 201 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[POST /api/users]', error); console.error('[POST /api/users]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
