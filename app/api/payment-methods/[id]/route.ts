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
      .input('id',          sql.UniqueIdentifier, id)
      .input('orgId',       sql.UniqueIdentifier, user.organizationId)
      .input('nome',        sql.NVarChar, body.name)
      .input('tipo',        sql.NVarChar, body.code || null)
      .input('ativo',       sql.Bit,      body.enabled !== undefined ? (body.enabled ? 1 : 0) : 1)
      .input('isDefault',   sql.Bit,      body.is_default ?? false)
      .input('displayOrder',sql.Int,      body.display_order ?? 0)
      .input('icon',        sql.NVarChar, body.icon  || null)
      .input('color',       sql.NVarChar, body.color || null)
      .query(`
        UPDATE org_payment_methods
        SET
          nome          = ISNULL(@nome, nome),
          tipo          = @tipo,
          ativo         = @ativo,
          is_default    = @isDefault,
          display_order = @displayOrder,
          icon          = @icon,
          color         = @color,
          updated_at    = GETDATE()
        OUTPUT
          INSERTED.id, INSERTED.organization_id,
          INSERTED.nome AS name,
          ISNULL(INSERTED.tipo,'') AS code,
          INSERTED.ativo AS enabled,
          CAST(ISNULL(INSERTED.is_default,0) AS BIT) AS is_default,
          ISNULL(INSERTED.display_order,0) AS display_order,
          INSERTED.icon, INSERTED.color,
          INSERTED.created_at,
          ISNULL(INSERTED.updated_at, INSERTED.created_at) AS updated_at
        WHERE id = @id AND organization_id = @orgId
      `)

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    }

    return NextResponse.json(result.recordset[0])
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[PUT /api/payment-methods/:id]', error)
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

    await pool
      .request()
      .input('id',    sql.UniqueIdentifier, id)
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(`DELETE FROM org_payment_methods WHERE id = @id AND organization_id = @orgId`)

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[DELETE /api/payment-methods/:id]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
