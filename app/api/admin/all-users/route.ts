import { NextResponse } from 'next/server'
import { requireMaster } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { profiles, organizations } from '@/lib/db/schema'
import { eq, desc, and } from 'drizzle-orm'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { logServerError } from '@/lib/log-error'

export async function GET() {
  try {
    await requireMaster()

    const profileRows = await db
      .select({
        id: profiles.id,
        fullName: profiles.fullName,
        role: profiles.role,
        isOwner: profiles.isOwner,
        isMaster: profiles.isMaster,
        createdAt: profiles.createdAt,
        organizationId: profiles.organizationId,
        orgName: organizations.name,
        orgPlan: organizations.plan,
        orgState: organizations.subscriptionStatus,
      })
      .from(profiles)
      .innerJoin(organizations, eq(organizations.id, profiles.organizationId))
      .orderBy(desc(profiles.createdAt))

    // Get emails from Supabase auth
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data } = await supabase.auth.admin.listUsers()
    const emailMap: Record<string, string> = {}
    if (data?.users) {
      for (const u of data.users) {
        emailMap[u.id] = u.email ?? ''
      }
    }

    const result = profileRows.map((p) => ({
      id: p.id,
      email: emailMap[p.id] ?? '',
      full_name: p.fullName,
      role: p.role,
      is_owner: p.isOwner,
      is_master: p.isMaster,
      created_at: p.createdAt,
      org_id: p.organizationId,
      org_name: p.orgName,
      org_plan: p.orgPlan,
      org_state: p.orgState,
    }))

    return NextResponse.json(result)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    logServerError('[GET /api/admin/all-users]', error); console.error('[GET /api/admin/all-users]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    await requireMaster()
    const body = await request.json()
    const { id, action, new_password } = body

    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    if (action === 'reset_password') {
      if (!new_password || (new_password as string).length < 6) {
        return NextResponse.json({ error: 'Senha deve ter ao menos 6 caracteres' }, { status: 400 })
      }
      const { error } = await supabase.auth.admin.updateUserById(id, {
        password: new_password as string,
      })
      if (error) throw error
      return NextResponse.json({ ok: true })
    }

    if (action === 'deactivate') {
      // Deactivate non-master users by setting role to deactivated
      await db
        .update(profiles)
        .set({ role: 'deactivated' })
        .where(and(eq(profiles.id, id), eq(profiles.isMaster, false)))
      return NextResponse.json({ ok: true })
    }

    if (action === 'reactivate') {
      await db
        .update(profiles)
        .set({ role: 'member' })
        .where(eq(profiles.id, id))
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    logServerError('[PUT /api/admin/all-users]', error); console.error('[PUT /api/admin/all-users]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
