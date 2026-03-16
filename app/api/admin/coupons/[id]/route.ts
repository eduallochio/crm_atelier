import { NextRequest, NextResponse } from 'next/server'
import { requireMaster } from '@/lib/auth/session'
import { getPool, sql } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireMaster()
    const { id } = await params
    const body = await req.json()
    const { code, description, discount_type, discount_value, max_uses, expires_at, is_active, applicable_plans } = body

    const pool = await getPool()

    // Check duplicate code (excluding self)
    if (code) {
      const exists = await pool.request()
        .input('code', sql.NVarChar, code.toUpperCase())
        .input('id',   sql.UniqueIdentifier, id)
        .query('SELECT id FROM coupons WHERE code = @code AND id <> @id')
      if (exists.recordset.length > 0) {
        return NextResponse.json({ error: 'Código de cupom já existe' }, { status: 409 })
      }
    }

    const result = await pool.request()
      .input('id',               sql.UniqueIdentifier, id)
      .input('code',             sql.NVarChar,         code?.toUpperCase() ?? null)
      .input('description',      sql.NVarChar,         description ?? null)
      .input('discount_type',    sql.NVarChar,         discount_type ?? null)
      .input('discount_value',   sql.Decimal(10, 2),   discount_value != null ? Number(discount_value) : null)
      .input('max_uses',         sql.Int,              max_uses != null ? Number(max_uses) : null)
      .input('expires_at',       sql.DateTime2,        expires_at ? new Date(expires_at) : null)
      .input('is_active',        sql.Bit,              is_active != null ? (is_active ? 1 : 0) : null)
      .input('applicable_plans', sql.NVarChar,         applicable_plans != null ? JSON.stringify(applicable_plans) : null)
      .query(`
        UPDATE coupons SET
          code             = COALESCE(@code, code),
          description      = COALESCE(@description, description),
          discount_type    = COALESCE(@discount_type, discount_type),
          discount_value   = COALESCE(@discount_value, discount_value),
          max_uses         = CASE WHEN @max_uses IS NOT NULL THEN @max_uses ELSE max_uses END,
          expires_at       = CASE WHEN @expires_at IS NOT NULL THEN @expires_at ELSE expires_at END,
          is_active        = COALESCE(@is_active, is_active),
          applicable_plans = CASE WHEN @applicable_plans IS NOT NULL THEN @applicable_plans ELSE applicable_plans END
        OUTPUT INSERTED.*
        WHERE id = @id
      `)

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: 'Cupom não encontrado' }, { status: 404 })
    }

    return NextResponse.json(result.recordset[0])
  } catch (error) {
    const msg = (error as Error).message
    if (msg === 'UNAUTHORIZED' || msg === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    console.error('[PUT /api/admin/coupons/[id]]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireMaster()
    const { id } = await params
    const pool = await getPool()

    // Remove usages first
    await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .query('DELETE FROM coupon_usages WHERE coupon_id = @id')

    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .query('DELETE FROM coupons OUTPUT DELETED.id WHERE id = @id')

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: 'Cupom não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const msg = (error as Error).message
    if (msg === 'UNAUTHORIZED' || msg === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    console.error('[DELETE /api/admin/coupons/[id]]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
