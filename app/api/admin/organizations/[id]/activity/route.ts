import { NextResponse } from 'next/server'
import { requireMaster } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { adminLogs } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireMaster()
    const { id } = await params

    try {
      const rows = await db
        .select()
        .from(adminLogs)
        .where(eq(adminLogs.resourceId, id))
        .orderBy(desc(adminLogs.createdAt))
        .limit(50)

      const result = rows.map((r) => ({
        id:            r.id,
        action:        r.action,
        resource_type: r.resourceType,
        resource_id:   r.resourceId,
        description:   r.description,
        admin_email:   r.adminEmail,
        details_json:  r.detailsJson,
        created_at:    r.createdAt,
      }))

      return NextResponse.json(result)
    } catch {
      return NextResponse.json([])
    }
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
