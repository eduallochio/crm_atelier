import { NextRequest, NextResponse } from 'next/server'
import { requireMaster } from '@/lib/auth/session'
import { getPool, sql } from '@/lib/db'

export async function GET() {
  try {
    await requireMaster()
    const pool = await getPool()
    const result = await pool.request().query(`
      SELECT id, code, description, discount_type, discount_value,
             max_uses, uses_count, expires_at, is_active, applicable_plans, created_at
      FROM coupons
      ORDER BY created_at DESC
    `)
    return NextResponse.json(result.recordset)
  } catch (error) {
    const msg = (error as Error).message
    if (msg === 'UNAUTHORIZED' || msg === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    console.error('[GET /api/admin/coupons]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireMaster()
    const body = await req.json()
    const { code, description, discount_type, discount_value, max_uses, expires_at, applicable_plans } = body

    if (!code || !discount_type || discount_value == null) {
      return NextResponse.json({ error: 'Campos obrigatórios: code, discount_type, discount_value' }, { status: 400 })
    }

    const pool = await getPool()

    // Check duplicate code
    const exists = await pool.request()
      .input('code', sql.NVarChar, code.toUpperCase())
      .query('SELECT id FROM coupons WHERE code = @code')
    if (exists.recordset.length > 0) {
      return NextResponse.json({ error: 'Código de cupom já existe' }, { status: 409 })
    }

    const result = await pool.request()
      .input('code',             sql.NVarChar,    code.toUpperCase())
      .input('description',      sql.NVarChar,    description || null)
      .input('discount_type',    sql.NVarChar,    discount_type)
      .input('discount_value',   sql.Decimal(10, 2), Number(discount_value))
      .input('max_uses',         sql.Int,         max_uses != null ? Number(max_uses) : null)
      .input('expires_at',       sql.DateTime2,   expires_at ? new Date(expires_at) : null)
      .input('applicable_plans', sql.NVarChar,    applicable_plans ? JSON.stringify(applicable_plans) : null)
      .query(`
        INSERT INTO coupons (code, description, discount_type, discount_value, max_uses, expires_at, applicable_plans)
        OUTPUT INSERTED.*
        VALUES (@code, @description, @discount_type, @discount_value, @max_uses, @expires_at, @applicable_plans)
      `)

    return NextResponse.json(result.recordset[0], { status: 201 })
  } catch (error) {
    const msg = (error as Error).message
    if (msg === 'UNAUTHORIZED' || msg === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    console.error('[POST /api/admin/coupons]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
