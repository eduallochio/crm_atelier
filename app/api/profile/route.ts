import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getPool, sql } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const user = await requireAuth()
    const pool = await getPool()

    const result = await pool
      .request()
      .input('userId', sql.UniqueIdentifier, user.id)
      .query(`
        SELECT id, email, full_name, role, is_owner, created_at
        FROM users
        WHERE id = @userId
      `)

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    return NextResponse.json(result.recordset[0])
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[GET /api/profile]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const pool = await getPool()

    // Se vier senha nova, verificar a senha atual primeiro
    if (body.new_password) {
      const currentResult = await pool
        .request()
        .input('userId', sql.UniqueIdentifier, user.id)
        .query(`SELECT password_hash FROM users WHERE id = @userId`)

      const currentHash = currentResult.recordset[0]?.password_hash
      if (!currentHash) {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
      }

      const valid = await bcrypt.compare(body.current_password || '', currentHash)
      if (!valid) {
        return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 })
      }

      const newHash = await bcrypt.hash(body.new_password, 12)

      const result = await pool
        .request()
        .input('userId', sql.UniqueIdentifier, user.id)
        .input('fullName', sql.NVarChar, body.full_name || user.name)
        .input('passwordHash', sql.NVarChar, newHash)
        .query(`
          UPDATE users
          SET full_name = @fullName, password_hash = @passwordHash
          OUTPUT INSERTED.id, INSERTED.email, INSERTED.full_name, INSERTED.role, INSERTED.created_at
          WHERE id = @userId
        `)

      return NextResponse.json(result.recordset[0])
    }

    // Apenas atualizar nome
    const result = await pool
      .request()
      .input('userId', sql.UniqueIdentifier, user.id)
      .input('fullName', sql.NVarChar, body.full_name || user.name)
      .query(`
        UPDATE users
        SET full_name = @fullName
        OUTPUT INSERTED.id, INSERTED.email, INSERTED.full_name, INSERTED.role, INSERTED.created_at
        WHERE id = @userId
      `)

    return NextResponse.json(result.recordset[0])
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[PUT /api/profile]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
