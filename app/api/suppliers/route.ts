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
        SELECT * FROM org_suppliers
        WHERE organization_id = @orgId
        ORDER BY nome ASC
      `)

    return NextResponse.json(result.recordset)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[GET /api/suppliers]', error)
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
      .input('contato', sql.NVarChar, body.contato || null)
      .input('telefone', sql.NVarChar, body.telefone || null)
      .input('email', sql.NVarChar, body.email || null)
      .input('cnpj', sql.NVarChar, body.cnpj || body.cpf_cnpj || null)
      .input('endereco', sql.NVarChar, body.endereco || null)
      .input('observacoes', sql.NVarChar, body.observacoes || null)
      .input('ativo', sql.Bit, body.ativo !== false ? 1 : 0)
      .query(`
        INSERT INTO org_suppliers (
          organization_id, nome, contato, telefone, email, cnpj, endereco, observacoes, ativo
        )
        OUTPUT INSERTED.*
        VALUES (
          @orgId, @nome, @contato, @telefone, @email, @cnpj, @endereco, @observacoes, @ativo
        )
      `)

    return NextResponse.json(result.recordset[0], { status: 201 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[POST /api/suppliers]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
