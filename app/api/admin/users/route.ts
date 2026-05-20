import { NextRequest, NextResponse } from 'next/server'
import { requireMaster } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { profiles, organizations } from '@/lib/db/schema'
import { eq, and, asc } from 'drizzle-orm'
import { logAdminAction } from '@/lib/admin-log'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { logServerError } from '@/lib/log-error'

export async function GET() {
  try {
    await requireMaster()

    const masterProfiles = await db
      .select({
        id: profiles.id,
        fullName: profiles.fullName,
        createdAt: profiles.createdAt,
      })
      .from(profiles)
      .where(eq(profiles.isMaster, true))
      .orderBy(asc(profiles.createdAt))

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

    const admins = masterProfiles.map((u) => ({
      id: u.id,
      name: u.fullName ?? emailMap[u.id] ?? '',
      email: emailMap[u.id] ?? '',
      role: 'super_admin' as const,
      createdAt: u.createdAt,
    }))

    return NextResponse.json(admins)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    logServerError('[GET /api/admin/users]', error); console.error('[GET /api/admin/users]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireMaster()
    const { email, name, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 })
    }

    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if user already exists in auth
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find((u) => u.email === email)

    if (existingUser) {
      // Check if already master in profiles
      const existingProfile = await db
        .select({ id: profiles.id, isMaster: profiles.isMaster })
        .from(profiles)
        .where(eq(profiles.id, existingUser.id))
        .limit(1)

      if (existingProfile[0]?.isMaster) {
        return NextResponse.json({ error: 'Usuário já é admin' }, { status: 409 })
      }

      // Promote existing user
      await db
        .update(profiles)
        .set({ isMaster: true })
        .where(eq(profiles.id, existingUser.id))

      await logAdminAction({
        action: 'UPDATE',
        resourceType: 'admin_user',
        resourceId: existingUser.id,
        description: `Usuário "${email}" promovido a admin`,
        adminEmail: admin.email,
      })

      return NextResponse.json({ id: existingUser.id, promoted: true })
    }

    // Find system-master org
    const orgRows = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.slug, 'system-master'))
      .limit(1)

    if (orgRows.length === 0) {
      return NextResponse.json({
        error: 'Organização system-master não encontrada.',
      }, { status: 500 })
    }

    const orgId = orgRows[0].id

    // Create new Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name ?? email },
    })

    if (authError) {
      if (authError.message.includes('already') || authError.message.includes('duplicate')) {
        return NextResponse.json({ error: 'Email já cadastrado' }, { status: 409 })
      }
      throw authError
    }

    const newId = authData.user.id

    await db.insert(profiles).values({
      id: newId,
      organizationId: orgId,
      fullName: name ?? email,
      role: 'owner',
      isOwner: true,
      isMaster: true,
    })

    await logAdminAction({
      action: 'CREATE',
      resourceType: 'admin_user',
      resourceId: newId,
      description: `Novo admin "${email}" criado`,
      adminEmail: admin.email,
    })

    return NextResponse.json({ id: newId }, { status: 201 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    logServerError('[POST /api/admin/users]', error); console.error('[POST /api/admin/users]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireMaster()
    const { id } = await request.json()

    if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

    if (id === admin.id) {
      return NextResponse.json({ error: 'Você não pode remover seus próprios privilégios de admin' }, { status: 400 })
    }

    const userProfile = await db
      .select({ id: profiles.id, isMaster: profiles.isMaster })
      .from(profiles)
      .where(and(eq(profiles.id, id), eq(profiles.isMaster, true)))
      .limit(1)

    if (userProfile.length === 0) {
      return NextResponse.json({ error: 'Admin não encontrado' }, { status: 404 })
    }

    // Get email for log
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: userData } = await supabase.auth.admin.getUserById(id)
    const userEmail = userData?.user?.email ?? ''

    await db
      .update(profiles)
      .set({ isMaster: false })
      .where(eq(profiles.id, id))

    await logAdminAction({
      action: 'UPDATE',
      resourceType: 'admin_user',
      resourceId: id,
      description: `Privilégios de admin removidos de "${userEmail}"`,
      adminEmail: admin.email,
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    logServerError('[DELETE /api/admin/users]', error); console.error('[DELETE /api/admin/users]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
