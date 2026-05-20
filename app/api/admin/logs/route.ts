import { NextRequest, NextResponse } from 'next/server'
import { requireMaster } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { adminLogs } from '@/lib/db/schema'
import { eq, gte, ilike, or, desc, asc, and } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'

export async function GET(request: NextRequest) {
  try {
    await requireMaster()
    const { searchParams } = new URL(request.url)

    const action       = searchParams.get('action') || ''
    const resourceType = searchParams.get('resource_type') || ''
    const since        = searchParams.get('since') || ''
    const search       = searchParams.get('search') || ''
    const limit        = Math.min(parseInt(searchParams.get('limit') || '100'), 500)

    const conditions = []

    if (action) conditions.push(eq(adminLogs.action, action))
    if (resourceType) conditions.push(eq(adminLogs.resourceType, resourceType))
    if (since) conditions.push(gte(adminLogs.createdAt, new Date(since)))
    if (search) {
      conditions.push(
        or(
          ilike(adminLogs.description, `%${search}%`),
          ilike(adminLogs.adminEmail, `%${search}%`),
        )
      )
    }

    const rows = await db
      .select()
      .from(adminLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(adminLogs.createdAt))
      .limit(limit)

    const logs = rows.map((r) => ({
      id: r.id,
      action: r.action,
      resource_type: r.resourceType,
      resource_id: r.resourceId,
      description: r.description,
      admin_email: r.adminEmail,
      details: r.detailsJson,
      created_at: r.createdAt,
    }))

    // Distinct actions for filter
    const actionsResult = await db
      .selectDistinct({ action: adminLogs.action })
      .from(adminLogs)
      .orderBy(asc(adminLogs.action))

    const availableActions = actionsResult.map((r) => r.action).filter(Boolean) as string[]

    return NextResponse.json({ logs, availableActions })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    logServerError('[GET /api/admin/logs]', error); console.error('[GET /api/admin/logs]', error)
    return NextResponse.json({ logs: [], availableActions: [] })
  }
}
