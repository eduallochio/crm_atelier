import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getPool, sql } from '@/lib/db'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const pool = await getPool()

    const result = await pool
      .request()
      .input('orderId', sql.UniqueIdentifier, id)
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(`
        SELECT n.*
        FROM org_service_order_notes n
        INNER JOIN org_service_orders o ON o.id = n.order_id
        WHERE n.order_id = @orderId AND o.organization_id = @orgId
        ORDER BY n.created_at DESC
      `)

    return NextResponse.json(result.recordset)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[GET /api/orders/:id/notes]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { id } = await params
    const pool = await getPool()

    const result = await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .input('orderId', sql.UniqueIdentifier, id)
      .input('userEmail', sql.NVarChar, user.email || '')
      .input('nota', sql.NVarChar, body.nota)
      .query(`
        INSERT INTO org_service_order_notes (organization_id, order_id, user_email, nota)
        OUTPUT INSERTED.*
        VALUES (@orgId, @orderId, @userEmail, @nota)
      `)

    return NextResponse.json(result.recordset[0], { status: 201 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[POST /api/orders/:id/notes]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
