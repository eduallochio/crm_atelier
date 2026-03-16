import { NextRequest, NextResponse } from 'next/server'
import { requireMaster } from '@/lib/auth/session'
import { getPool, sql } from '@/lib/db'
import { logAdminAction } from '@/lib/admin-log'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    await requireMaster()
    const pool = await getPool()

    const result = await pool.request().query(`
      SELECT id, full_name, email, created_at, is_master
      FROM users
      WHERE is_master = 1
      ORDER BY created_at ASC
    `)

    const admins = result.recordset.map((u) => ({
      id:        u.id as string,
      name:      (u.full_name as string) ?? u.email,
      email:     u.email as string,
      role:      'super_admin' as const,
      createdAt: u.created_at as string,
    }))

    return NextResponse.json(admins)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    console.error('[GET /api/admin/users]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireMaster()
    const { email, name, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 })
    }

    const pool = await getPool()

    // Verificar se já existe como master
    const existing = await pool.request()
      .input('email', sql.NVarChar, email)
      .query(`SELECT id, is_master FROM users WHERE email = @email`)

    if (existing.recordset.length > 0) {
      const user = existing.recordset[0]
      if (user.is_master) {
        return NextResponse.json({ error: 'Usuário já é admin' }, { status: 409 })
      }
      // Promover usuário existente
      await pool.request()
        .input('id', sql.UniqueIdentifier, user.id)
        .query(`UPDATE users SET is_master = 1 WHERE id = @id`)

      await logAdminAction({
        action: 'UPDATE',
        resourceType: 'admin_user',
        resourceId: user.id,
        description: `Usuário "${email}" promovido a admin`,
        adminEmail: admin.email,
      })

      return NextResponse.json({ id: user.id, promoted: true })
    }

    // Criar novo usuário master na org system-master
    const orgResult = await pool.request().query(
      `SELECT id FROM organizations WHERE slug = 'system-master'`
    )
    if (!orgResult.recordset.length) {
      return NextResponse.json({ error: 'Organização system-master não encontrada. Execute sql/02-master-user.sql' }, { status: 500 })
    }
    const orgId = orgResult.recordset[0].id

    const passwordHash = await bcrypt.hash(password, 12)

    const insertResult = await pool.request()
      .input('orgId',        sql.UniqueIdentifier, orgId)
      .input('email',        sql.NVarChar,         email)
      .input('fullName',     sql.NVarChar,         name ?? email)
      .input('passwordHash', sql.NVarChar,         passwordHash)
      .query(`
        INSERT INTO users (organization_id, email, full_name, password_hash, is_master, role)
        OUTPUT INSERTED.id
        VALUES (@orgId, @email, @fullName, @passwordHash, 1, 'owner')
      `)

    const newId = insertResult.recordset[0].id

    await logAdminAction({
      action: 'CREATE',
      resourceType: 'admin_user',
      resourceId: newId,
      description: `Novo admin "${email}" criado`,
      adminEmail: admin.email,
    })

    return NextResponse.json({ id: newId }, { status: 201 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    if ((error as Error).message?.includes('UNIQUE') || (error as Error).message?.includes('duplicate')) {
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 409 })
    }
    console.error('[POST /api/admin/users]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireMaster()
    const { id } = await request.json()

    if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

    const pool = await getPool()

    // Não permitir remover a si mesmo
    if (id === admin.id) {
      return NextResponse.json({ error: 'Você não pode remover seus próprios privilégios de admin' }, { status: 400 })
    }

    const userResult = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .query(`SELECT email FROM users WHERE id = @id AND is_master = 1`)

    if (!userResult.recordset.length) {
      return NextResponse.json({ error: 'Admin não encontrado' }, { status: 404 })
    }

    await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .query(`UPDATE users SET is_master = 0 WHERE id = @id`)

    await logAdminAction({
      action: 'UPDATE',
      resourceType: 'admin_user',
      resourceId: id,
      description: `Privilégios de admin removidos de "${userResult.recordset[0].email}"`,
      adminEmail: admin.email,
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    console.error('[DELETE /api/admin/users]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
