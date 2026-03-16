import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getPool, sql } from '@/lib/db'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const pool = await getPool()

    const orgRes = await pool.request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query('SELECT [plan] FROM organizations WHERE id = @orgId')
    if (orgRes.recordset[0]?.plan === 'free') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const entryRes = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(`
        SELECT e.*, s.nome as fornecedor_nome
        FROM org_stock_entries e
        LEFT JOIN org_suppliers s ON s.id = e.supplier_id
        WHERE e.id = @id AND e.organization_id = @orgId
      `)
    const entry = entryRes.recordset[0]
    if (!entry) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

    const itemsRes = await pool.request()
      .input('entry_id', sql.UniqueIdentifier, id)
      .query('SELECT * FROM org_stock_entry_items WHERE entry_id = @entry_id')

    return NextResponse.json({ ...entry, itens: itemsRes.recordset })
  } catch (error) {
    const msg = (error as Error).message
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    console.error('[GET /api/inventory/entries/[id]]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
