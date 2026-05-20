import { NextResponse } from 'next/server'
import { requireMaster } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireMaster()
    const { id } = await params

    const profileRows = await db
      .select({
        id: profiles.id,
        fullName: profiles.fullName,
        role: profiles.role,
        createdAt: profiles.createdAt,
      })
      .from(profiles)
      .where(eq(profiles.organizationId, id))
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
      created_at: p.createdAt,
    }))

    return NextResponse.json(result)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[GET /api/admin/organizations/:id/users]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
