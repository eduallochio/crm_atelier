import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getPool, sql } from '@/lib/db'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await requireAuth()

    if (!user.isOwner) {
      return NextResponse.json({ error: 'Apenas o proprietário pode alterar permissões' }, { status: 403 })
    }

    const { role } = await req.json()
    const validRoles = ['admin', 'member']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Cargo inválido' }, { status: 400 })
    }

    const pool = await getPool()

    // Não permite alterar o próprio cargo nem o do owner
    const check = await pool
      .request()
      .input('id', sql.UniqueIdentifier, id)
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(`SELECT id, is_owner FROM users WHERE id = @id AND organization_id = @orgId`)

    if (check.recordset.length === 0) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }
    if (check.recordset[0].is_owner) {
      return NextResponse.json({ error: 'Não é possível alterar o cargo do proprietário' }, { status: 403 })
    }

    await pool
      .request()
      .input('id', sql.UniqueIdentifier, id)
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .input('role', sql.NVarChar, role)
      .query(`UPDATE users SET role = @role WHERE id = @id AND organization_id = @orgId`)

    return NextResponse.json({ success: true })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[PUT /api/users/[id]]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await requireAuth()

    if (!user.isOwner) {
      return NextResponse.json({ error: 'Apenas o proprietário pode remover usuários' }, { status: 403 })
    }

    if (id === user.id) {
      return NextResponse.json({ error: 'Você não pode remover a si mesmo' }, { status: 400 })
    }

    const pool = await getPool()

    const check = await pool
      .request()
      .input('id', sql.UniqueIdentifier, id)
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(`SELECT id, is_owner FROM users WHERE id = @id AND organization_id = @orgId`)

    if (check.recordset.length === 0) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }
    if (check.recordset[0].is_owner) {
      return NextResponse.json({ error: 'Não é possível remover o proprietário' }, { status: 403 })
    }

    await pool
      .request()
      .input('id', sql.UniqueIdentifier, id)
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(`DELETE FROM users WHERE id = @id AND organization_id = @orgId`)

    return NextResponse.json({ success: true })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[DELETE /api/users/[id]]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
