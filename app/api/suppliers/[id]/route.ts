import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getPool, sql } from '@/lib/db'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { id } = await params
    const pool = await getPool()

    const result = await pool
      .request()
      .input('id', sql.UniqueIdentifier, id)
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
        UPDATE org_suppliers
        SET
          nome = @nome,
          contato = @contato,
          telefone = @telefone,
          email = @email,
          cnpj = @cnpj,
          endereco = @endereco,
          observacoes = @observacoes,
          ativo = @ativo,
          updated_at = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = @id AND organization_id = @orgId
      `)

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: 'Fornecedor não encontrado' }, { status: 404 })
    }

    return NextResponse.json(result.recordset[0])
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[PUT /api/suppliers/:id]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// Soft delete — marca como inativo
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const pool = await getPool()

    const result = await pool
      .request()
      .input('id', sql.UniqueIdentifier, id)
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(`
        UPDATE org_suppliers
        SET ativo = 0, updated_at = GETDATE()
        OUTPUT INSERTED.id
        WHERE id = @id AND organization_id = @orgId
      `)

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: 'Fornecedor não encontrado' }, { status: 404 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[DELETE /api/suppliers/:id]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
