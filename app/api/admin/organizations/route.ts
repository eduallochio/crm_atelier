import { NextResponse } from 'next/server'
import { requireMaster } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { organizations, profiles, plans } from '@/lib/db/schema'
import { eq, sql as drizzleSql } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    await requireMaster()

    // Preços reais da tabela plans
    const planRows = await db
      .select({ slug: plans.slug, price: plans.price })
      .from(plans)
      .where(eq(plans.isActive, true))

    const planPrices: Record<string, number> = { free: 0, pro: 0 }
    for (const p of planRows) {
      planPrices[p.slug] = parseFloat(p.price) || 0
    }

    // Busca contagens via JOIN + GROUP BY (evita N+1 correlated subqueries)
    const rows = await db.execute(drizzleSql`
      SELECT
        o.id,
        o.name,
        o.plan,
        o.subscription_status AS "subscriptionStatus",
        o.created_at          AS "createdAt",
        COUNT(DISTINCT p.id)::int  AS "usersCount",
        COUNT(DISTINCT c.id)::int  AS "clientsCount"
      FROM organizations o
      LEFT JOIN profiles    p ON p.organization_id = o.id
      LEFT JOIN org_clients c ON c.organization_id = o.id
      GROUP BY o.id, o.name, o.plan, o.subscription_status, o.created_at
      ORDER BY o.created_at DESC
    `) as any[]

    const result = (rows as any[]).map((row) => ({
      id:            row.id,
      name:          row.name,
      plan:          row.plan,
      state:         (row.subscriptionStatus === 'inactive' ? 'active' : row.subscriptionStatus) ?? 'active',
      created_at:    row.createdAt,
      users_count:   Number(row.usersCount ?? 0),
      clients_count: Number(row.clientsCount ?? 0),
      mrr:           planPrices[row.plan] ?? 0,
    }))

    return NextResponse.json(result)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[GET /api/admin/organizations]', error); console.error('[GET /api/admin/organizations]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await requireMaster()

    const body = await request.json()
    const { name, email, password, plan = 'free', phone, cnpj } = body

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Nome, email e senha são obrigatórios' }, { status: 400 })
    }

    const adminSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    // 1. Cria o usuário no Supabase Auth
    // O trigger handle_new_user cria automaticamente: organization + profile + usage_metrics + customization_settings
    // user_metadata.full_name é usado pelo trigger como nome da organização
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    })

    if (authError || !authData.user) {
      const msg = authError?.message ?? ''
      const friendly = msg.includes('already registered') || msg.includes('already been registered')
        ? 'Este email já está cadastrado no sistema.'
        : msg.includes('invalid') || msg.includes('Invalid')
          ? 'Email inválido.'
          : msg.includes('weak') || msg.includes('password')
            ? 'Senha muito fraca. Use no mínimo 6 caracteres.'
            : 'Erro ao criar usuário. Tente novamente.'
      return NextResponse.json({ error: friendly }, { status: 400 })
    }

    const userId = authData.user.id

    // 2. Aguarda trigger processar (pequena margem) e busca a org criada pelo trigger via profile
    await new Promise(resolve => setTimeout(resolve, 800))

    const [profile] = await db
      .select({ organizationId: profiles.organizationId })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1)

    if (!profile) {
      // Trigger não rodou — limpa o usuário e retorna erro
      await adminSupabase.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: 'Trigger de criação de organização não executou. Tente novamente.' }, { status: 500 })
    }

    const orgId = profile.organizationId

    // 3. Atualiza a org com os dados extras fornecidos no formulário
    await db
      .update(organizations)
      .set({
        name,
        plan,
        phone:    phone || null,
        cnpj:     cnpj  || null,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, orgId))

    return NextResponse.json({ id: orgId }, { status: 201 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[POST /api/admin/organizations]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
