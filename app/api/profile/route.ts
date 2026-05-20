import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const user = await requireAuth()
    const supabase = await createClient()

    const [rows, { data: authData }] = await Promise.all([
      db
        .select({
          id:             profiles.id,
          organizationId: profiles.organizationId,
          fullName:       profiles.fullName,
          role:           profiles.role,
          isOwner:        profiles.isOwner,
          createdAt:      profiles.createdAt,
        })
        .from(profiles)
        .where(eq(profiles.id, user.id)),
      supabase.auth.getUser(),
    ])

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const profile = rows[0]
    return NextResponse.json({
      id:         profile.id,
      // snake_case para compatibilidade com a página
      full_name:  profile.fullName ?? '',
      role:       profile.role,
      is_owner:   profile.isOwner,
      created_at: profile.createdAt,
      // email vem do Supabase Auth
      email:      authData.user?.email ?? '',
    })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[GET /api/profile]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const supabase = await createClient()

    if (body.new_password) {
      // Update password via Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        password: body.new_password,
      })

      if (authError) {
        return NextResponse.json({ error: authError.message }, { status: 400 })
      }
    }

    const newName = body.full_name || user.name

    // Update full_name in Supabase Auth user_metadata
    await supabase.auth.updateUser({ data: { full_name: newName } })

    // Update full_name in profiles table
    const [row] = await db
      .update(profiles)
      .set({ fullName: newName })
      .where(eq(profiles.id, user.id))
      .returning({
        id:        profiles.id,
        fullName:  profiles.fullName,
        role:      profiles.role,
        createdAt: profiles.createdAt,
      })

    return NextResponse.json({
      id:         row.id,
      full_name:  row.fullName ?? '',
      role:       row.role,
      created_at: row.createdAt,
      email:      (await supabase.auth.getUser()).data.user?.email ?? '',
    })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[PUT /api/profile]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
