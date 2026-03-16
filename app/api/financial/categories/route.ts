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
        SELECT * FROM org_financial_categories
        WHERE organization_id = @orgId
        ORDER BY tipo ASC, nome ASC
      `)

    return NextResponse.json(result.recordset)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[GET /api/financial/categories]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const pool = await getPool()

    const result = await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .input('nome', sql.NVarChar, body.nome)
      .input('tipo', sql.NVarChar, body.tipo)
      .input('cor', sql.NVarChar, body.cor || null)
      .input('descricao', sql.NVarChar, body.descricao || null)
      .input('ativo', sql.Bit, body.ativo !== false ? 1 : 0)
      .query(`
        INSERT INTO org_financial_categories (organization_id, nome, tipo, cor, descricao, ativo)
        OUTPUT INSERTED.*
        VALUES (@orgId, @nome, @tipo, @cor, @descricao, @ativo)
      `)

    return NextResponse.json(result.recordset[0], { status: 201 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[POST /api/financial/categories]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
