import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { logServerError } from '@/lib/log-error'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await requireAuth()

    if (!user.isOwner) {
      return NextResponse.json({ error: 'Apenas o proprietário pode alterar permissões' }, { status: 403 })
    }

    const { role } = await req.json()
    const validRoles = ['admin', 'member']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Cargo inválido' }, { status: 400 })
    }

    // Não permite alterar o próprio cargo nem o do owner
    const check = await db
      .select({ id: profiles.id, isOwner: profiles.isOwner })
      .from(profiles)
      .where(and(eq(profiles.id, id), eq(profiles.organizationId, user.organizationId)))
      .limit(1)

    if (check.length === 0) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }
    if (check[0].isOwner) {
      return NextResponse.json({ error: 'Não é possível alterar o cargo do proprietário' }, { status: 403 })
    }

    await db
      .update(profiles)
      .set({ role })
      .where(and(eq(profiles.id, id), eq(profiles.organizationId, user.organizationId)))

    return NextResponse.json({ success: true })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[PUT /api/users/[id]]', error); console.error('[PUT /api/users/[id]]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await requireAuth()

    if (!user.isOwner) {
      return NextResponse.json({ error: 'Apenas o proprietário pode remover usuários' }, { status: 403 })
    }

    if (id === user.id) {
      return NextResponse.json({ error: 'Você não pode remover a si mesmo' }, { status: 400 })
    }

    const check = await db
      .select({ id: profiles.id, isOwner: profiles.isOwner })
      .from(profiles)
      .where(and(eq(profiles.id, id), eq(profiles.organizationId, user.organizationId)))
      .limit(1)

    if (check.length === 0) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }
    if (check[0].isOwner) {
      return NextResponse.json({ error: 'Não é possível remover o proprietário' }, { status: 403 })
    }

    // Delete from Supabase Auth (cascades to profiles via trigger)
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    await supabase.auth.admin.deleteUser(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[DELETE /api/users/[id]]', error); console.error('[DELETE /api/users/[id]]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
