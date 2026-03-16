import { NextResponse } from 'next/server'
import { requireMaster } from '@/lib/auth/session'
import { getPool, sql } from '@/lib/db'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireMaster()
    const { id } = await params
    const pool = await getPool()

    try {
      const result = await pool
        .request()
        .input('orgId', sql.UniqueIdentifier, id)
        .query(`
          SELECT id, content, tags, is_important, admin_email, created_at
          FROM admin_notes
          WHERE organization_id = @orgId
          ORDER BY created_at DESC
        `)
      return NextResponse.json(result.recordset)
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
    const pool = await getPool()

    const tags = Array.isArray(body.tags) ? JSON.stringify(body.tags) : null

    const result = await pool
      .request()
      .input('orgId',       sql.UniqueIdentifier, id)
      .input('content',     sql.NVarChar,         body.content)
      .input('tags',        sql.NVarChar,         tags)
      .input('isImportant', sql.Bit,              body.is_important ?? false)
      .input('createdBy',   sql.UniqueIdentifier, user.id)
      .input('adminEmail',  sql.NVarChar,         user.email ?? null)
      .query(`
        INSERT INTO admin_notes (organization_id, content, tags, is_important, created_by, admin_email)
        OUTPUT INSERTED.id, INSERTED.content, INSERTED.tags, INSERTED.is_important,
               INSERTED.admin_email, INSERTED.created_at
        VALUES (@orgId, @content, @tags, @isImportant, @createdBy, @adminEmail)
      `)

    return NextResponse.json(result.recordset[0], { status: 201 })
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
    const { id } = await params
    const pool = await getPool()

    if (!noteId) return NextResponse.json({ error: 'noteId required' }, { status: 400 })

    await pool
      .request()
      .input('noteId', sql.UniqueIdentifier, noteId)
      .input('orgId', sql.UniqueIdentifier, id)
      .query(`DELETE FROM admin_notes WHERE id = @noteId AND organization_id = @orgId`)

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
