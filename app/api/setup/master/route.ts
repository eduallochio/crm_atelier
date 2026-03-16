import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getPool, sql } from '@/lib/db'

const SYSTEM_ORG_ID = '00000000-0000-0000-0000-000000000001'

/**
 * POST /api/setup/master
 * Cria o usuário master do sistema.
 * Protegido por SETUP_SECRET definido em .env.local.
 *
 * Body: { secret: string, email: string, password: string, fullName?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { secret, email, password, fullName = 'Administrador Master' } = body

    // Verificação do secret de setup
    const setupSecret = process.env.SETUP_SECRET
    if (!setupSecret) {
      return NextResponse.json(
        { error: 'SETUP_SECRET não configurado no servidor.' },
        { status: 500 }
      )
    }
    if (secret !== setupSecret) {
      return NextResponse.json({ error: 'Secret inválido.' }, { status: 403 })
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: 'email e password são obrigatórios.' },
        { status: 400 }
      )
    }

    const pool = await getPool()

    // Garante que a coluna is_master existe (idempotente)
    await pool.request().query(`
      IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'is_master'
      )
      BEGIN
        ALTER TABLE users ADD is_master BIT NOT NULL DEFAULT 0;
      END
    `)

    // Garante que a organização master existe (idempotente)
    await pool.request()
      .input('orgId', sql.UniqueIdentifier, SYSTEM_ORG_ID)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM organizations WHERE id = @orgId)
        BEGIN
          INSERT INTO organizations (id, name, slug, [plan], subscription_status)
          VALUES (@orgId, 'Sistema Master', 'system-master', 'pro', 'active');
        END
      `)

    // Verifica se já existe um usuário master
    const existing = await pool.request()
      .input('email', sql.NVarChar, email)
      .query(`SELECT id FROM users WHERE email = @email`)

    if (existing.recordset.length > 0) {
      // Promove o usuário existente a master e atualiza a senha
      const passwordHash = await bcrypt.hash(password, 12)
      await pool.request()
        .input('email', sql.NVarChar, email)
        .input('passwordHash', sql.NVarChar, passwordHash)
        .query(`
          UPDATE users
          SET is_master = 1, [role] = 'owner', is_owner = 1, password_hash = @passwordHash
          WHERE email = @email
        `)

      return NextResponse.json({
        ok: true,
        message: `Usuário ${email} promovido a master com sucesso.`,
        action: 'promoted',
      })
    }

    // Cria novo usuário master
    const passwordHash = await bcrypt.hash(password, 12)

    await pool.request()
      .input('orgId', sql.UniqueIdentifier, SYSTEM_ORG_ID)
      .input('email', sql.NVarChar, email)
      .input('passwordHash', sql.NVarChar, passwordHash)
      .input('fullName', sql.NVarChar, fullName)
      .query(`
        INSERT INTO users (id, organization_id, email, password_hash, full_name, [role], is_owner, is_master)
        VALUES (NEWID(), @orgId, @email, @passwordHash, @fullName, 'owner', 1, 1)
      `)

    return NextResponse.json({
      ok: true,
      message: `Usuário master ${email} criado com sucesso.`,
      action: 'created',
    })
  } catch (error: any) {
    console.error('[POST /api/setup/master]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * GET /api/setup/master
 * Verifica se existe algum usuário master cadastrado.
 * Não requer autenticação — útil para o setup inicial.
 */
export async function GET() {
  try {
    const pool = await getPool()

    // Verifica se a coluna existe antes de consultar
    const colExists = await pool.request().query(`
      SELECT 1 AS col_exists FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'is_master'
    `)

    if (colExists.recordset.length === 0) {
      return NextResponse.json({ hasMaster: false, reason: 'Coluna is_master não existe ainda.' })
    }

    const result = await pool.request().query(`
      SELECT COUNT(*) AS master_count FROM users WHERE is_master = 1
    `)

    const count = Number(result.recordset[0].master_count)
    return NextResponse.json({ hasMaster: count > 0, count })
  } catch (error: any) {
    console.error('[GET /api/setup/master]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
