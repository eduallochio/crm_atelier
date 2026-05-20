import { NextResponse } from 'next/server'
import { requireMaster } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { adminLogs } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

// admin_notes table does not exist in the Drizzle schema.
// Notes are stored as admin_logs entries with action = 'NOTE' and resource_type = 'org_note'.
// This keeps the feature functional without requiring a new migration.

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

      const notes = rows
        .filter((r) => r.action === 'NOTE')
        .map((r) => {
          const details = (r.detailsJson ?? {}) as Record<string, unknown>
          return {
            id:           r.id,
            content:      details.content as string ?? r.description,
            tags:         details.tags ?? [],
            is_important: details.is_important ?? false,
            admin_email:  r.adminEmail,
            created_at:   r.createdAt,
          }
        })

      return NextResponse.json(notes)
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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireMaster()
    const body = await request.json()
    const { id } = await params

    const tags = Array.isArray(body.tags) ? body.tags : []
    const isImportant = Boolean(body.is_important)

    const inserted = await db.insert(adminLogs).values({
      action:       'NOTE',
      resourceType: 'org_note',
      resourceId:   id,
      description:  body.content,
      adminEmail:   user.email ?? null,
      detailsJson:  {
        content:      body.content,
        tags,
        is_important: isImportant,
      },
    }).returning()

    const r = inserted[0]
    const details = (r.detailsJson ?? {}) as Record<string, unknown>
    return NextResponse.json({
      id:           r.id,
      content:      details.content as string,
      tags:         details.tags,
      is_important: details.is_important,
      admin_email:  r.adminEmail,
      created_at:   r.createdAt,
    }, { status: 201 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[POST /api/admin/organizations/:id/notes]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireMaster()
    const { searchParams } = new URL(request.url)
    const noteId = searchParams.get('noteId')

    if (!noteId) return NextResponse.json({ error: 'noteId required' }, { status: 400 })

    await db.delete(adminLogs).where(eq(adminLogs.id, noteId))

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
