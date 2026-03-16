import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getPool, sql } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const pool = await getPool()

    const methods: { id: string; display_order: number }[] = Array.isArray(body) ? body : []

    for (const { id, display_order } of methods) {
      await pool
        .request()
        .input('id',           sql.UniqueIdentifier, id)
        .input('orgId',        sql.UniqueIdentifier, user.organizationId)
        .input('displayOrder', sql.Int, display_order)
        .query(`
          UPDATE org_payment_methods
          SET display_order = @displayOrder, updated_at = GETDATE()
          WHERE id = @id AND organization_id = @orgId
        `)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[POST /api/payment-methods/reorder]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
