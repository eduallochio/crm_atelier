import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getPool, sql } from '@/lib/db'

/** GET /api/orders/[id]/materials → lista materiais da OS */
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const pool = await getPool()

    const result = await pool.request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .input('orderId', sql.UniqueIdentifier, id)
      .query(`
        SELECT m.*, p.codigo_barras, p.categoria
        FROM org_order_materials m
        LEFT JOIN org_products p ON p.id = m.product_id
        WHERE m.organization_id = @orgId AND m.order_id = @orderId
        ORDER BY m.created_at ASC
      `)

    return NextResponse.json(result.recordset)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED')
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    console.error('[GET /api/orders/[id]/materials]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

/** PUT /api/orders/[id]/materials → substitui todos os materiais da OS (upsert completo) */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const body = await request.json()
    const materiais: Array<{
      product_id?: string | null
      produto_nome: string
      quantidade: number
      unidade?: string
    }> = body.materiais ?? []

    const pool = await getPool()

    // Verificar que a OS pertence à org
    const check = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query('SELECT id FROM org_service_orders WHERE id = @id AND organization_id = @orgId')
    if (!check.recordset[0])
      return NextResponse.json({ error: 'Ordem não encontrada' }, { status: 404 })

    // Transação: delete + reinsert atômico — evita estado parcial se um INSERT falhar
    const transaction = new sql.Transaction(pool)
    await transaction.begin()

    try {
      await new sql.Request(transaction)
        .input('orderId', sql.UniqueIdentifier, id)
        .query('DELETE FROM org_order_materials WHERE order_id = @orderId')

      for (const m of materiais) {
        if (!m.produto_nome || !m.quantidade || m.quantidade <= 0) continue
        await new sql.Request(transaction)
          .input('orgId', sql.UniqueIdentifier, user.organizationId)
          .input('orderId', sql.UniqueIdentifier, id)
          .input('productId', sql.UniqueIdentifier, m.product_id || null)
          .input('produtoNome', sql.NVarChar(255), m.produto_nome)
          .input('quantidade', sql.Decimal(10, 3), Number(m.quantidade))
          .input('unidade', sql.NVarChar(20), m.unidade || 'un')
          .query(`
            INSERT INTO org_order_materials
              (organization_id, order_id, product_id, produto_nome, quantidade, unidade)
            VALUES (@orgId, @orderId, @productId, @produtoNome, @quantidade, @unidade)
          `)
      }

      await transaction.commit()
    } catch (txError) {
      await transaction.rollback()
      throw txError
    }

    const result = await pool.request()
      .input('orderId', sql.UniqueIdentifier, id)
      .query('SELECT * FROM org_order_materials WHERE order_id = @orderId ORDER BY created_at ASC')

    return NextResponse.json(result.recordset)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED')
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    console.error('[PUT /api/orders/[id]/materials]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
