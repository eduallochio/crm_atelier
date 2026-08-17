import { NextResponse } from 'next/server'
import { requireMaster } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { organizations, profiles, orgClients, usageMetrics, customizationSettings, plans } from '@/lib/db/schema'
import { eq, desc, sql as drizzleSql, count } from 'drizzle-orm'
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

    // Gera slug único a partir do nome
    const slug = name
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50)

    // Verifica duplicidade de slug
    const existing = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.slug, slug))
      .limit(1)

    const finalSlug = existing.length > 0 ? `${slug}-${Date.now()}` : slug

    // 1. Cria a organização
    const [org] = await db
      .insert(organizations)
      .values({ name, slug: finalSlug, plan, phone: phone || null, cnpj: cnpj || null, subscriptionStatus: 'inactive' })
      .returning({ id: organizations.id })

    // 2. Cria o usuário no Supabase Auth
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { organization_id: org.id, full_name: name },
    })

    if (authError || !authData.user) {
      // Rollback: remove a org criada
      await db.delete(organizations).where(eq(organizations.id, org.id))
      return NextResponse.json({ error: authError?.message ?? 'Erro ao criar usuário' }, { status: 400 })
    }

    const userId = authData.user.id

    // 3. Cria o profile
    await db.insert(profiles).values({
      id: userId,
      organizationId: org.id,
      fullName: name,
      role: 'owner',
      isOwner: true,
      isMaster: false,
    })

    // 4. Cria usage_metrics
    await db.insert(usageMetrics).values({ organizationId: org.id })

    // 5. Cria customization_settings
    await db.insert(customizationSettings).values({ organizationId: org.id })

    return NextResponse.json({ id: org.id }, { status: 201 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[POST /api/admin/organizations]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
