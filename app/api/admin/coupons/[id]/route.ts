import { NextRequest, NextResponse } from 'next/server'
import { requireMaster } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { coupons, couponUsages } from '@/lib/db/schema'
import { eq, and, ne } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireMaster()
    const { id } = await params
    const body = await req.json()
    const { code, description, discount_type, discount_value, max_uses, expires_at, is_active, applicable_plans } = body

    // Check duplicate code (excluding self)
    if (code) {
      const existing = await db
        .select({ id: coupons.id })
        .from(coupons)
        .where(and(eq(coupons.code, code.toUpperCase()), ne(coupons.id, id)))
        .limit(1)

      if (existing.length > 0) {
        return NextResponse.json({ error: 'Código de cupom já existe' }, { status: 409 })
      }
    }

    // Build update values — only include fields that were provided
    const updateValues: Partial<typeof coupons.$inferInsert> = {}
    if (code !== undefined) updateValues.code = code.toUpperCase()
    if (description !== undefined) updateValues.description = description ?? null
    if (discount_type !== undefined) updateValues.discountType = discount_type
    if (discount_value != null) updateValues.discountValue = String(Number(discount_value))
    if (max_uses !== undefined) updateValues.maxUses = max_uses != null ? Number(max_uses) : null
    if (expires_at !== undefined) updateValues.expiresAt = expires_at ? new Date(expires_at) : null
    if (is_active !== undefined) updateValues.isActive = Boolean(is_active)
    if (applicable_plans !== undefined) updateValues.applicablePlans = applicable_plans ?? null

    const updated = await db
      .update(coupons)
      .set(updateValues)
      .where(eq(coupons.id, id))
      .returning()

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Cupom não encontrado' }, { status: 404 })
    }

    const c = updated[0]
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
    })
  } catch (error) {
    const msg = (error as Error).message
    if (msg === 'UNAUTHORIZED' || msg === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    logServerError('[PUT /api/admin/coupons/[id]]', error); console.error('[PUT /api/admin/coupons/[id]]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireMaster()
    const { id } = await params

    // Remove usages first
    await db.delete(couponUsages).where(eq(couponUsages.couponId, id))

    const deleted = await db
      .delete(coupons)
      .where(eq(coupons.id, id))
      .returning({ id: coupons.id })

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Cupom não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const msg = (error as Error).message
    if (msg === 'UNAUTHORIZED' || msg === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    logServerError('[DELETE /api/admin/coupons/[id]]', error); console.error('[DELETE /api/admin/coupons/[id]]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
