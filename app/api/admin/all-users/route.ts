import { NextResponse } from 'next/server'
import { requireMaster } from '@/lib/auth/session'
import { getPool, sql } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    await requireMaster()
    const pool = await getPool()
    const result = await pool.request().query(`
      SELECT
        u.id, u.email, u.full_name, u.role, u.is_owner, u.is_master,
        u.created_at,
        o.name AS org_name, o.[plan] AS org_plan, o.state AS org_state, o.id AS org_id
      FROM users u
      JOIN organizations o ON o.id = u.organization_id
      ORDER BY u.created_at DESC
    `)
    return NextResponse.json(result.recordset)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    console.error('[GET /api/admin/all-users]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    await requireMaster()
    const body = await request.json()
    const { id, action, new_password } = body
    const pool = await getPool()

    if (action === 'reset_password') {
      if (!new_password || new_password.length < 6) {
        return NextResponse.json({ error: 'Senha deve ter ao menos 6 caracteres' }, { status: 400 })
      }
      const hash = await bcrypt.hash(new_password as string, 12)
      await pool.request()
        .input('id', sql.UniqueIdentifier, id)
        .input('hash', sql.NVarChar, hash)
        .query('UPDATE users SET password_hash = @hash WHERE id = @id')
      return NextResponse.json({ ok: true })
    }

    if (action === 'deactivate') {
      await pool.request()
        .input('id', sql.UniqueIdentifier, id)
        .query("UPDATE users SET role = 'deactivated' WHERE id = @id AND is_master = 0")
      return NextResponse.json({ ok: true })
    }

    if (action === 'reactivate') {
      await pool.request()
        .input('id', sql.UniqueIdentifier, id)
        .query("UPDATE users SET role = 'member' WHERE id = @id")
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    console.error('[PUT /api/admin/all-users]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
