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

    const preco = parseFloat(String(body.preco).replace(/[^\d,]/g, '').replace(',', '.')) || 0

    const materiais_produtos: Array<{ preco_custo?: number; quantidade: number }> = body.materiais_produtos ?? []
    const custoMateriais = materiais_produtos.length > 0
      ? materiais_produtos.reduce((acc, m) => acc + (m.preco_custo ?? 0) * m.quantidade, 0)
      : null
    const materiaisJson = materiais_produtos.length > 0
      ? JSON.stringify(materiais_produtos)
      : null

    const result = await pool
      .request()
      .input('id', sql.UniqueIdentifier, id)
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .input('nome', sql.NVarChar, body.nome)
      .input('descricao', sql.NVarChar, body.descricao || null)
      .input('preco', sql.Decimal(10, 2), preco)
      .input('categoria', sql.NVarChar, body.categoria || null)
      .input('tempoEstimado', sql.NVarChar, body.tempo_estimado || null)
      .input('custoMateriais', sql.Decimal(10, 2), custoMateriais)
      .input('materiaisJson', sql.NVarChar(sql.MAX), materiaisJson)
      .input('observacoesTecnicas', sql.NVarChar, body.observacoes_tecnicas || null)
      .input('nivelDificuldade', sql.NVarChar, body.nivel_dificuldade || null)
      .input('tempoMinimo', sql.NVarChar, body.tempo_minimo || null)
      .input('tempoMaximo', sql.NVarChar, body.tempo_maximo || null)
      .input('ativo', sql.Bit, body.ativo !== false ? 1 : 0)
      .query(`
        UPDATE org_services
        SET
          nome = @nome,
          descricao = @descricao,
          preco = @preco,
          categoria = @categoria,
          tempo_estimado = @tempoEstimado,
          custo_materiais = @custoMateriais,
          materiais_json = @materiaisJson,
          observacoes_tecnicas = @observacoesTecnicas,
          nivel_dificuldade = NULLIF(@nivelDificuldade, ''),
          tempo_minimo = @tempoMinimo,
          tempo_maximo = @tempoMaximo,
          ativo = @ativo
        OUTPUT INSERTED.*
        WHERE id = @id AND organization_id = @orgId
      `)

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 })
    }

    const row = result.recordset[0]
    return NextResponse.json({
      ...row,
      materiais_produtos: row.materiais_json ? JSON.parse(row.materiais_json) : [],
    })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[PUT /api/services/:id]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// PATCH: toggle ativo status
export async function PATCH(
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
      .input('ativo', sql.Bit, body.ativo ? 1 : 0)
      .query(`
        UPDATE org_services
        SET ativo = @ativo
        OUTPUT INSERTED.*
        WHERE id = @id AND organization_id = @orgId
      `)

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 })
    }

    return NextResponse.json(result.recordset[0])
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[PATCH /api/services/:id]', error)
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
        DELETE FROM org_services
        OUTPUT DELETED.id
        WHERE id = @id AND organization_id = @orgId
      `)

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[DELETE /api/services/:id]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
