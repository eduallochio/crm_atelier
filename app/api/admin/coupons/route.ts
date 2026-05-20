import { NextRequest, NextResponse } from 'next/server'
import { requireMaster } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { coupons } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET() {
  try {
    await requireMaster()

    const rows = await db
      .select()
      .from(coupons)
      .orderBy(desc(coupons.createdAt))

    const result = rows.map((c) => ({
      id: c.id,
      code: c.code,
      description: c.description,
      discount_type: c.discountType,
      discount_value: parseFloat(c.discountValue),
      max_uses: c.maxUses,
      uses_count: c.usesCount,
      expires_at: c.expiresAt,
      is_active: c.isActive,
      applicable_plans: c.applicablePlans,
      created_at: c.createdAt,
    }))

    return NextResponse.json(result)
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

    // Check duplicate code
    const existing = await db
      .select({ id: coupons.id })
      .from(coupons)
      .where(eq(coupons.code, code.toUpperCase()))
      .limit(1)

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Código de cupom já existe' }, { status: 409 })
    }

    const inserted = await db.insert(coupons).values({
      code: code.toUpperCase(),
      description: description || null,
      discountType: discount_type,
      discountValue: String(Number(discount_value)),
      maxUses: max_uses != null ? Number(max_uses) : null,
      expiresAt: expires_at ? new Date(expires_at) : null,
      applicablePlans: applicable_plans ?? null,
    }).returning()

    const c = inserted[0]
    return NextResponse.json({
      id: c.id,
      code: c.code,
      description: c.description,
      discount_type: c.discountType,
      discount_value: parseFloat(c.discountValue),
      max_uses: c.maxUses,
      uses_count: c.usesCount,
      expires_at: c.expiresAt,
      is_active: c.isActive,
      applicable_plans: c.applicablePlans,
      created_at: c.createdAt,
    }, { status: 201 })
  } catch (error) {
    const msg = (error as Error).message
    if (msg === 'UNAUTHORIZED' || msg === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    console.error('[POST /api/admin/coupons]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
