import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getPool, sql } from '@/lib/db'

async function checkPlanAndProduct(orgId: string, productId: string) {
  const pool = await getPool()
  const orgRes = await pool.request()
    .input('orgId', sql.UniqueIdentifier, orgId)
    .query('SELECT [plan] FROM organizations WHERE id = @orgId')
  if (orgRes.recordset[0]?.plan === 'free') throw new Error('FORBIDDEN')
  const prodRes = await pool.request()
    .input('id', sql.UniqueIdentifier, productId)
    .input('orgId', sql.UniqueIdentifier, orgId)
    .query('SELECT * FROM org_products WHERE id = @id AND organization_id = @orgId')
  if (!prodRes.recordset[0]) throw new Error('NOT_FOUND')
  return { pool, product: prodRes.recordset[0] }
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const { product } = await checkPlanAndProduct(user.organizationId, id)
    return NextResponse.json(product)
  } catch (error) {
    const msg = (error as Error).message
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    if (msg === 'FORBIDDEN') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    if (msg === 'NOT_FOUND') return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    console.error('[GET /api/inventory/products/[id]]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const { pool } = await checkPlanAndProduct(user.organizationId, id)
    const body = await request.json()
    const { nome, descricao, categoria, unidade, quantidade_minima, preco_custo, codigo_barras, ativo } = body
    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .input('nome', sql.NVarChar(255), nome)
      .input('descricao', sql.NVarChar(sql.MAX), descricao || null)
      .input('categoria', sql.NVarChar(100), categoria || null)
      .input('unidade', sql.NVarChar(20), unidade || 'un')
      .input('quantidade_minima', sql.Decimal(10, 3), Number(quantidade_minima ?? 0))
      .input('preco_custo', sql.Decimal(10, 2), preco_custo ? Number(preco_custo) : null)
      .input('codigo_barras', sql.NVarChar(100), codigo_barras || null)
      .input('ativo', sql.Bit, ativo !== false ? 1 : 0)
      .query(`
        UPDATE org_products
        SET nome = @nome, descricao = @descricao, categoria = @categoria, unidade = @unidade,
            quantidade_minima = @quantidade_minima, preco_custo = @preco_custo,
            codigo_barras = @codigo_barras, ativo = @ativo, updated_at = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = @id AND organization_id = @orgId
      `)
    return NextResponse.json(result.recordset[0])
  } catch (error) {
    const msg = (error as Error).message
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    if (msg === 'FORBIDDEN') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    if (msg === 'NOT_FOUND') return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    console.error('[PUT /api/inventory/products/[id]]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const { pool } = await checkPlanAndProduct(user.organizationId, id)
    await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query('UPDATE org_products SET ativo = 0, updated_at = GETDATE() WHERE id = @id AND organization_id = @orgId')
    return NextResponse.json({ success: true })
  } catch (error) {
    const msg = (error as Error).message
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    if (msg === 'FORBIDDEN') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    if (msg === 'NOT_FOUND') return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    console.error('[DELETE /api/inventory/products/[id]]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
