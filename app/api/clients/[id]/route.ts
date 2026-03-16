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
      .input('telefone', sql.NVarChar, body.telefone || null)
      .input('email', sql.NVarChar, body.email || null)
      .input('dataNasc', sql.NVarChar, body.data_nascimento || null)
      .input('observacoes', sql.NVarChar, body.observacoes || null)
      .input('cep', sql.NVarChar, body.cep || null)
      .input('logradouro', sql.NVarChar, body.logradouro || null)
      .input('numEnd', sql.NVarChar, body.numero || null)
      .input('complemento', sql.NVarChar, body.complemento || null)
      .input('bairro', sql.NVarChar, body.bairro || null)
      .input('cidade', sql.NVarChar, body.cidade || null)
      .input('estado', sql.NVarChar, body.estado || null)
      .query(`
        UPDATE org_clients
        SET
          nome = @nome,
          telefone = @telefone,
          email = @email,
          data_nascimento = CAST(NULLIF(@dataNasc, '') AS DATE),
          observacoes = @observacoes,
          cep = @cep,
          logradouro = @logradouro,
          numero = @numEnd,
          complemento = @complemento,
          bairro = @bairro,
          cidade = @cidade,
          estado = @estado
        OUTPUT INSERTED.*
        WHERE id = @id AND organization_id = @orgId
      `)

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }

    return NextResponse.json(result.recordset[0])
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[PUT /api/clients/:id]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

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
        DELETE FROM org_clients
        OUTPUT DELETED.id
        WHERE id = @id AND organization_id = @orgId
      `)

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }

    // Atualizar métricas
    await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(`
        UPDATE usage_metrics
        SET clients_count = CASE WHEN clients_count > 0 THEN clients_count - 1 ELSE 0 END,
            updated_at = GETDATE()
        WHERE organization_id = @orgId
      `)

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[DELETE /api/clients/:id]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
