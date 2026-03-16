import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getPool, sql } from '@/lib/db'

export async function GET() {
  try {
    const user = await requireAuth()
    const pool = await getPool()

    const result = await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(`
        SELECT monthly_revenue_goal
        FROM org_system_preferences
        WHERE organization_id = @orgId
      `)

    const goal = result.recordset[0]?.monthly_revenue_goal ?? 0
    return NextResponse.json({ monthly_revenue_goal: Number(goal) })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[GET /api/settings/goals]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const user = await requireAuth()
    const { monthly_revenue_goal } = await req.json()

    if (typeof monthly_revenue_goal !== 'number' || monthly_revenue_goal < 0) {
      return NextResponse.json({ error: 'Valor inválido' }, { status: 400 })
    }

    const pool = await getPool()

    await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .input('goal', sql.Decimal(10, 2), monthly_revenue_goal)
      .query(`
        UPDATE org_system_preferences SET monthly_revenue_goal = @goal WHERE organization_id = @orgId
        IF @@ROWCOUNT = 0
          INSERT INTO org_system_preferences (organization_id, monthly_revenue_goal)
          VALUES (@orgId, @goal)
      `)

    return NextResponse.json({ monthly_revenue_goal })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[PUT /api/settings/goals]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
