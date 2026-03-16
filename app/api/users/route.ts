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
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(`
        SELECT id, full_name, email, role, is_owner, created_at
        FROM users
        WHERE organization_id = @orgId
        ORDER BY is_owner DESC, created_at ASC
      `)

    return NextResponse.json(result.recordset)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[GET /api/users]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth()

    // Somente owner pode convidar usuários
    if (!user.isOwner) {
      return NextResponse.json({ error: 'Apenas o proprietário pode convidar usuários' }, { status: 403 })
    }

    const { full_name, email, password, role } = await req.json()

    if (!full_name?.trim() || !email?.trim() || !password?.trim()) {
      return NextResponse.json({ error: 'Nome, email e senha são obrigatórios' }, { status: 400 })
    }

    const validRoles = ['admin', 'member']
    const safeRole = validRoles.includes(role) ? role : 'member'

    const pool = await getPool()

    // Verificar se o email já existe
    const existing = await pool
      .request()
      .input('email', sql.NVarChar, email.toLowerCase().trim())
      .query(`SELECT id FROM users WHERE email = @email`)

    if (existing.recordset.length > 0) {
      return NextResponse.json({ error: 'Este email já está em uso' }, { status: 409 })
    }

    // Verificar limite do plano
    const planResult = await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(`SELECT [plan] FROM organizations WHERE id = @orgId`)

    const plan = planResult.recordset[0]?.plan ?? 'free'

    if (plan === 'free') {
      const countResult = await pool
        .request()
        .input('orgId', sql.UniqueIdentifier, user.organizationId)
        .query(`SELECT COUNT(*) AS cnt FROM users WHERE organization_id = @orgId`)

      if (countResult.recordset[0]?.cnt >= 1) {
        return NextResponse.json({
          error: 'O plano gratuito permite apenas 1 usuário. Faça upgrade para adicionar mais.',
        }, { status: 403 })
      }
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const insertResult = await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .input('fullName', sql.NVarChar, full_name.trim())
      .input('email', sql.NVarChar, email.toLowerCase().trim())
      .input('passwordHash', sql.NVarChar, passwordHash)
      .input('role', sql.NVarChar, safeRole)
      .query(`
        INSERT INTO users (organization_id, full_name, email, password_hash, role, is_owner)
        OUTPUT INSERTED.id, INSERTED.full_name, INSERTED.email, INSERTED.role, INSERTED.is_owner, INSERTED.created_at
        VALUES (@orgId, @fullName, @email, @passwordHash, @role, 0)
      `)

    return NextResponse.json(insertResult.recordset[0], { status: 201 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[POST /api/users]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
