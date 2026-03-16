import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getPool, sql } from '@/lib/db'
import { getPlanLimits, limitExceededResponse } from '@/lib/plan-limits'

export async function GET() {
  try {
    const user = await requireAuth()
    const pool = await getPool()

    const result = await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(`
        SELECT * FROM org_services
        WHERE organization_id = @orgId
        ORDER BY created_at DESC
      `)

    const services = result.recordset.map(s => ({
      ...s,
      materiais_produtos: s.materiais_json ? JSON.parse(s.materiais_json) : [],
    }))

    return NextResponse.json(services)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[GET /api/services]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const pool = await getPool()

    // Verificar limite do plano
    const [limitResult, limits] = await Promise.all([
      pool.request()
        .input('orgId', sql.UniqueIdentifier, user.organizationId)
        .query(`
          SELECT o.[plan],
            (SELECT COUNT(*) FROM org_services WHERE organization_id = @orgId) AS services_count
          FROM organizations o WHERE o.id = @orgId
        `),
      getPlanLimits(),
    ])

    const planRow = limitResult.recordset[0]
    if (planRow?.plan === 'free' && planRow?.services_count >= limits.max_services_free) {
      return NextResponse.json(
        limitExceededResponse('serviços', limits.max_services_free),
        { status: 403 }
      )
    }

    const preco = parseFloat(String(body.preco).replace(/[^\d,]/g, '').replace(',', '.')) || 0

    // custo_materiais calculado automaticamente a partir dos materiais_produtos
    const materiais_produtos: Array<{ preco_custo?: number; quantidade: number }> = body.materiais_produtos ?? []
    const custoMateriais = materiais_produtos.length > 0
      ? materiais_produtos.reduce((acc, m) => acc + (m.preco_custo ?? 0) * m.quantidade, 0)
      : null
    const materiaisJson = materiais_produtos.length > 0
      ? JSON.stringify(materiais_produtos)
      : null

    const result = await pool
      .request()
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
        INSERT INTO org_services (
          organization_id, nome, descricao, preco, categoria, tempo_estimado,
          custo_materiais, materiais_json, observacoes_tecnicas, nivel_dificuldade,
          tempo_minimo, tempo_maximo, ativo
        )
        OUTPUT INSERTED.*
        VALUES (
          @orgId, @nome, @descricao, @preco, @categoria, @tempoEstimado,
          @custoMateriais, @materiaisJson, @observacoesTecnicas,
          NULLIF(@nivelDificuldade, ''),
          @tempoMinimo, @tempoMaximo, @ativo
        )
      `)

    const row = result.recordset[0]
    return NextResponse.json({
      ...row,
      materiais_produtos: row.materiais_json ? JSON.parse(row.materiais_json) : [],
    }, { status: 201 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[POST /api/services]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
