import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getPool, sql } from '@/lib/db'

export async function GET() {
  try {
    const user = await requireAuth()
    const pool = await getPool()
    const orgResult = await pool.request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query('SELECT [plan] FROM organizations WHERE id = @orgId')
    const plan = orgResult.recordset[0]?.plan
    if (plan === 'free') {
      return NextResponse.json({ error: 'Recurso disponível apenas no plano pago' }, { status: 403 })
    }

    const result = await pool.request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(`
        SELECT id, nome, descricao, categoria, unidade,
               quantidade_atual, quantidade_minima, preco_custo,
               codigo_barras, ativo, created_at, updated_at
        FROM org_products
        WHERE organization_id = @orgId
        ORDER BY nome
      `)
    return NextResponse.json(result.recordset)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    console.error('[GET /api/inventory/products]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const pool = await getPool()
    const orgResult = await pool.request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query('SELECT [plan] FROM organizations WHERE id = @orgId')
    if (orgResult.recordset[0]?.plan === 'free') {
      return NextResponse.json({ error: 'Recurso disponível apenas no plano pago' }, { status: 403 })
    }
    const body = await request.json()
    const {
      nome,
      descricao,
      categoria,
      unidade = 'un',
      quantidade_atual = 0,
      quantidade_minima = 0,
      preco_custo,
      codigo_barras,
    } = body
    if (!nome) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })

    const result = await pool.request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .input('nome', sql.NVarChar(255), nome)
      .input('descricao', sql.NVarChar(sql.MAX), descricao || null)
      .input('categoria', sql.NVarChar(100), categoria || null)
      .input('unidade', sql.NVarChar(20), unidade)
      .input('quantidade_atual', sql.Decimal(10, 3), Number(quantidade_atual))
      .input('quantidade_minima', sql.Decimal(10, 3), Number(quantidade_minima))
      .input('preco_custo', sql.Decimal(10, 2), preco_custo ? Number(preco_custo) : null)
      .input('codigo_barras', sql.NVarChar(100), codigo_barras || null)
      .query(`
        INSERT INTO org_products
          (organization_id, nome, descricao, categoria, unidade, quantidade_atual, quantidade_minima, preco_custo, codigo_barras)
        OUTPUT INSERTED.*
        VALUES (@orgId, @nome, @descricao, @categoria, @unidade, @quantidade_atual, @quantidade_minima, @preco_custo, @codigo_barras)
      `)
    return NextResponse.json(result.recordset[0], { status: 201 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    console.error('[POST /api/inventory/products]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
