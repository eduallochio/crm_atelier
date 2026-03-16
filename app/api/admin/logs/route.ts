import { NextRequest, NextResponse } from 'next/server'
import { requireMaster } from '@/lib/auth/session'
import { getPool, sql } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    await requireMaster()
    const { searchParams } = new URL(request.url)

    const action       = searchParams.get('action') || ''
    const resourceType = searchParams.get('resource_type') || ''
    const since        = searchParams.get('since') || ''
    const search       = searchParams.get('search') || ''
    const limit        = Math.min(parseInt(searchParams.get('limit') || '100'), 500)

    const pool = await getPool()
    const req  = pool.request().input('limit', sql.Int, limit)

    let where = 'WHERE 1=1'
    if (action) {
      req.input('action', sql.NVarChar, action)
      where += ' AND action = @action'
    }
    if (resourceType) {
      req.input('resource_type', sql.NVarChar, resourceType)
      where += ' AND resource_type = @resource_type'
    }
    if (since) {
      req.input('since', sql.DateTime2, new Date(since))
      where += ' AND created_at >= @since'
    }
    if (search) {
      req.input('search', sql.NVarChar, `%${search}%`)
      where += ' AND (description LIKE @search OR admin_email LIKE @search)'
    }

    const result = await req.query(`
      SELECT TOP (@limit)
        id, action, resource_type, resource_id, description,
        admin_email, details_json, created_at
      FROM admin_logs
      ${where}
      ORDER BY created_at DESC
    `)

    const logs = result.recordset.map((r) => ({
      id:            r.id,
      action:        r.action,
      resource_type: r.resource_type,
      resource_id:   r.resource_id,
      description:   r.description,
      admin_email:   r.admin_email,
      details:       r.details_json ? JSON.parse(r.details_json) : null,
      created_at:    r.created_at,
    }))

    // Distinct actions para filtro
    const actionsResult = await pool.request().query(
      `SELECT DISTINCT action FROM admin_logs ORDER BY action ASC`
    )
    const availableActions = actionsResult.recordset.map((r) => r.action as string)

    return NextResponse.json({ logs, availableActions })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    // Tabela pode não existir ainda
    if ((error as Error).message?.includes('Invalid object name')) {
      return NextResponse.json({ logs: [], availableActions: [] })
    }
    console.error('[GET /api/admin/logs]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
