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

export async function GET() {
  try {
    await requireMaster()
    const pool = await getPool()
    const result = await pool.request().query(`
      SELECT id, slug, name, description, price, price_annual, annual_note,
             badge, is_featured, is_active, features_json, cta_text, cta_url, sort_order,
             created_at, updated_at
      FROM plans
      ORDER BY sort_order ASC
    `)

    const plans = result.recordset.map((p) => ({
      ...p,
      price: parseFloat(p.price),
      price_annual: p.price_annual ? parseFloat(p.price_annual) : null,
      is_featured: p.is_featured === true || p.is_featured === 1,
      is_active: p.is_active === true || p.is_active === 1,
      features: p.features_json ? JSON.parse(p.features_json) : [],
      features_json: undefined,
    }))

    return NextResponse.json(plans)
  } catch (error) {
    return handleAuthError(error) ?? (console.error('[admin/plans] GET:', error),
      NextResponse.json({ error: 'Erro interno' }, { status: 500 }))
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireMaster()
    const body = await request.json()
    const {
      slug, name, description, price, price_annual, annual_note,
      badge, is_featured, is_active, features, cta_text, cta_url, sort_order,
    } = body

    const pool = await getPool()
    const result = await pool
      .request()
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
        INSERT INTO plans
          (slug, name, description, price, price_annual, annual_note, badge,
           is_featured, is_active, features_json, cta_text, cta_url, sort_order)
        OUTPUT INSERTED.id
        VALUES
          (@slug, @name, @description, @price, @price_annual, @annual_note, @badge,
           @is_featured, @is_active, @features_json, @cta_text, @cta_url, @sort_order)
      `)

    return NextResponse.json({ id: result.recordset[0].id }, { status: 201 })
  } catch (error) {
    return handleAuthError(error) ?? (console.error('[admin/plans] POST:', error),
      NextResponse.json({ error: 'Erro interno' }, { status: 500 }))
  }
}
