import { NextRequest, NextResponse } from 'next/server'
import { requireMaster } from '@/lib/auth/session'
import { getPool, sql } from '@/lib/db'

function handleAuthError(error: unknown) {
  const msg = (error as Error).message
  if (msg === 'UNAUTHORIZED' || msg === 'FORBIDDEN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }
  return null
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireMaster()
    const { id } = await params
    const body = await request.json()
    const {
      slug, name, description, price, price_annual, annual_note,
      badge, is_featured, is_active, features, cta_text, cta_url, sort_order,
    } = body

    const pool = await getPool()
    await pool
      .request()
      .input('id', sql.UniqueIdentifier, id)
      .input('slug', sql.NVarChar, slug)
      .input('name', sql.NVarChar, name)
      .input('description', sql.NVarChar, description || null)
      .input('price', sql.Decimal(10, 2), parseFloat(price) || 0)
      .input('price_annual', sql.Decimal(10, 2), price_annual ? parseFloat(price_annual) : null)
      .input('annual_note', sql.NVarChar, annual_note || null)
      .input('badge', sql.NVarChar, badge || null)
      .input('is_featured', sql.Bit, is_featured ? 1 : 0)
      .input('is_active', sql.Bit, is_active !== false ? 1 : 0)
      .input('features_json', sql.NVarChar, JSON.stringify(features ?? []))
      .input('cta_text', sql.NVarChar, cta_text || 'Criar conta')
      .input('cta_url', sql.NVarChar, cta_url || '/cadastro')
      .input('sort_order', sql.Int, parseInt(sort_order) || 0)
      .query(`
        UPDATE plans SET
          slug = @slug, name = @name, description = @description,
          price = @price, price_annual = @price_annual, annual_note = @annual_note,
          badge = @badge, is_featured = @is_featured, is_active = @is_active,
          features_json = @features_json, cta_text = @cta_text, cta_url = @cta_url,
          sort_order = @sort_order, updated_at = GETDATE()
        WHERE id = @id
      `)

    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleAuthError(error) ?? (console.error('[admin/plans/[id]] PUT:', error),
      NextResponse.json({ error: 'Erro interno' }, { status: 500 }))
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireMaster()
    const { id } = await params
    const pool = await getPool()

    await pool
      .request()
      .input('id', sql.UniqueIdentifier, id)
      .query('DELETE FROM plans WHERE id = @id')

    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleAuthError(error) ?? (console.error('[admin/plans/[id]] DELETE:', error),
      NextResponse.json({ error: 'Erro interno' }, { status: 500 }))
  }
}
