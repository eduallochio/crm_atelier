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
      .input('tipo', sql.NVarChar, body.tipo)
      .input('cor', sql.NVarChar, body.cor || null)
      .input('descricao', sql.NVarChar, body.descricao || null)
      .input('ativo', sql.Bit, body.ativo !== false ? 1 : 0)
      .query(`
        UPDATE org_financial_categories
        SET nome = @nome, tipo = @tipo, cor = @cor, descricao = @descricao,
            ativo = @ativo, updated_at = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = @id AND organization_id = @orgId
      `)

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 })
    }

    return NextResponse.json(result.recordset[0])
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[PUT /api/financial/categories/:id]', error)
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
        DELETE FROM org_financial_categories
        OUTPUT DELETED.id
        WHERE id = @id AND organization_id = @orgId
      `)

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[DELETE /api/financial/categories/:id]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
