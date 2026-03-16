import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getPool, sql } from '@/lib/db'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const pool = await getPool()

    const result = await pool
      .request()
      .input('sessaoId', sql.UniqueIdentifier, id)
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(`
        SELECT m.*
        FROM org_cashier_movements m
        WHERE m.sessao_id = @sessaoId AND m.organization_id = @orgId
        ORDER BY m.created_at DESC
      `)

    return NextResponse.json(result.recordset)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[GET /api/cashiers/sessions/:id/movements]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(
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
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .input('sessaoId', sql.UniqueIdentifier, id)
      .input('tipo', sql.NVarChar, body.tipo)
      .input('valor', sql.Decimal(10, 2), body.valor)
      .input('descricao', sql.NVarChar, body.descricao)
      .input('metodoPagamentoId', sql.UniqueIdentifier, body.metodo_pagamento_id || null)
      .input('referenciaId', sql.UniqueIdentifier, body.referencia_id || null)
      .input('referenciaTipo', sql.NVarChar, body.referencia_tipo || null)
      .input('usuarioId', sql.UniqueIdentifier, user.id || null)
      .input('observacoes', sql.NVarChar, body.observacoes || null)
      .query(`
        INSERT INTO org_cashier_movements (
          organization_id, sessao_id, tipo, valor, descricao,
          metodo_pagamento_id, referencia_id, referencia_tipo, usuario_id, observacoes
        )
        OUTPUT INSERTED.*
        VALUES (
          @orgId, @sessaoId, @tipo, @valor, @descricao,
          @metodoPagamentoId, @referenciaId, @referenciaTipo, @usuarioId, @observacoes
        )
      `)

    return NextResponse.json(result.recordset[0], { status: 201 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[POST /api/cashiers/sessions/:id/movements]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
