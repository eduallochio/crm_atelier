import { NextResponse } from 'next/server'
import { requireMaster } from '@/lib/auth/session'
import { getPool } from '@/lib/db'

export async function GET() {
  try {
    await requireMaster()
    const pool = await getPool()

    // Preços reais da tabela plans
    const plansResult = await pool
      .request()
      .query(`SELECT slug, price FROM plans WHERE is_active = 1`)
    const planPrices: Record<string, number> = { free: 0, pro: 0 }
    for (const p of plansResult.recordset) {
      planPrices[p.slug] = parseFloat(p.price) || 0
    }

    const result = await pool
      .request()
      .query(`
        SELECT
          o.id, o.name, o.[plan], o.state, o.created_at,
          (SELECT COUNT(*) FROM users u WHERE u.organization_id = o.id) AS users_count,
          (SELECT COUNT(*) FROM org_clients c WHERE c.organization_id = o.id) AS clients_count
        FROM organizations o
        ORDER BY o.created_at DESC
      `)

    const organizations = result.recordset.map((row: Record<string, unknown>) => ({
      ...row,
      mrr: planPrices[row.plan as string] ?? 0,
    }))

    return NextResponse.json(organizations)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[GET /api/admin/organizations]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
