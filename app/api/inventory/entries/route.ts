import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getPool, sql } from '@/lib/db'

export async function GET() {
  try {
    const user = await requireAuth()
    const pool = await getPool()
    const orgRes = await pool.request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query('SELECT [plan] FROM organizations WHERE id = @orgId')
    if (orgRes.recordset[0]?.plan === 'free') {
      return NextResponse.json({ error: 'Recurso disponível apenas no plano pago' }, { status: 403 })
    }
    const entries = await pool.request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(`
        SELECT e.*, s.nome as fornecedor_nome
        FROM org_stock_entries e
        LEFT JOIN org_suppliers s ON s.id = e.supplier_id
        WHERE e.organization_id = @orgId
        ORDER BY e.created_at DESC
      `)

    let items: Record<string, unknown>[] = []
    if (entries.recordset.length > 0) {
      const itemsResult = await pool.request()
        .input('orgId', sql.UniqueIdentifier, user.organizationId)
        .query(`
          SELECT i.* FROM org_stock_entry_items i
          INNER JOIN org_stock_entries e ON e.id = i.entry_id
          WHERE e.organization_id = @orgId
        `)
      items = itemsResult.recordset
    }

    const entriesWithItems = entries.recordset.map(e => ({
      ...e,
      itens: items.filter(i => i.entry_id === e.id),
    }))
    return NextResponse.json(entriesWithItems)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    console.error('[GET /api/inventory/entries]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const pool = await getPool()
    const orgRes = await pool.request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query('SELECT [plan] FROM organizations WHERE id = @orgId')
    if (orgRes.recordset[0]?.plan === 'free') {
      return NextResponse.json({ error: 'Recurso disponível apenas no plano pago' }, { status: 403 })
    }

    const body = await request.json()
    const {
      tipo = 'manual',
      supplier_id,
      numero_nota,
      serie_nota,
      chave_acesso,
      emitente_cnpj,
      emitente_nome,
      data_emissao,
      valor_total,
      observacoes,
      itens = [],
    } = body

    if (!itens.length) return NextResponse.json({ error: 'Ao menos um item é obrigatório' }, { status: 400 })

    const entryResult = await pool.request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .input('supplier_id', sql.UniqueIdentifier, supplier_id || null)
      .input('tipo', sql.NVarChar(10), tipo)
      .input('numero_nota', sql.NVarChar(50), numero_nota || null)
      .input('serie_nota', sql.NVarChar(10), serie_nota || null)
      .input('chave_acesso', sql.NVarChar(44), chave_acesso || null)
      .input('emitente_cnpj', sql.NVarChar(20), emitente_cnpj || null)
      .input('emitente_nome', sql.NVarChar(255), emitente_nome || null)
      .input('data_emissao', sql.DateTime2, data_emissao ? new Date(data_emissao) : null)
      .input('valor_total', sql.Decimal(10, 2), valor_total ? Number(valor_total) : null)
      .input('observacoes', sql.NVarChar(sql.MAX), observacoes || null)
      .query(`
        INSERT INTO org_stock_entries
          (organization_id, supplier_id, tipo, numero_nota, serie_nota, chave_acesso, emitente_cnpj, emitente_nome, data_emissao, valor_total, observacoes)
        OUTPUT INSERTED.*
        VALUES (@orgId, @supplier_id, @tipo, @numero_nota, @serie_nota, @chave_acesso, @emitente_cnpj, @emitente_nome, @data_emissao, @valor_total, @observacoes)
      `)
    const entry = entryResult.recordset[0]

    for (const item of itens) {
      await pool.request()
        .input('entry_id', sql.UniqueIdentifier, entry.id)
        .input('product_id', sql.UniqueIdentifier, item.product_id || null)
        .input('produto_nome', sql.NVarChar(255), item.produto_nome)
        .input('quantidade', sql.Decimal(10, 3), Number(item.quantidade))
        .input('unidade', sql.NVarChar(20), item.unidade || 'un')
        .input('preco_unitario', sql.Decimal(10, 2), item.preco_unitario ? Number(item.preco_unitario) : null)
        .input('preco_total', sql.Decimal(10, 2), item.preco_total ? Number(item.preco_total) : null)
        .query(`
          INSERT INTO org_stock_entry_items
            (entry_id, product_id, produto_nome, quantidade, unidade, preco_unitario, preco_total)
          VALUES
            (@entry_id, @product_id, @produto_nome, @quantidade, @unidade, @preco_unitario, @preco_total)
        `)
    }

    const itemsResult = await pool.request()
      .input('entry_id', sql.UniqueIdentifier, entry.id)
      .query('SELECT * FROM org_stock_entry_items WHERE entry_id = @entry_id')

    return NextResponse.json({ ...entry, itens: itemsResult.recordset }, { status: 201 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    console.error('[POST /api/inventory/entries]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
