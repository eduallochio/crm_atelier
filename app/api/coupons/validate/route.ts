import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { coupons } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'

const PLAN_PRICES: Record<string, Record<string, number>> = {
  pro: { MONTHLY: 47.90, YEARLY: 479.00 },
}

// POST /api/coupons/validate
// Body: { code: string, plan: string, cycle?: 'MONTHLY' | 'YEARLY' }
export async function POST(req: NextRequest) {
  try {
    await requireAuth()

    const body = await req.json()
    const { code, plan = 'pro', cycle = 'MONTHLY' } = body

    if (!code) {
      return NextResponse.json({ error: 'Código do cupom é obrigatório' }, { status: 400 })
    }

    const [coupon] = await db
      .select()
      .from(coupons)
      .where(eq(coupons.code, String(code).toUpperCase().trim()))
      .limit(1)

    if (!coupon) {
      return NextResponse.json({ valid: false, error: 'Cupom não encontrado' }, { status: 404 })
    }

    if (!coupon.isActive) {
      return NextResponse.json({ valid: false, error: 'Cupom inativo' })
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json({ valid: false, error: 'Cupom expirado' })
    }

    if (coupon.maxUses != null && (coupon.usesCount ?? 0) >= coupon.maxUses) {
      return NextResponse.json({ valid: false, error: 'Cupom esgotado' })
    }

    const applicable = coupon.applicablePlans as string[] | null
    if (applicable && applicable.length > 0 && !applicable.includes(plan)) {
      return NextResponse.json({ valid: false, error: `Cupom não aplicável ao plano ${plan}` })
    }

    const basePrice = PLAN_PRICES[plan]?.[cycle] ?? 0
    const discountValue = parseFloat(coupon.discountValue)

    let finalPrice: number
    let discountAmount: number

    if (coupon.discountType === 'percentage') {
      discountAmount = Math.round(basePrice * (discountValue / 100) * 100) / 100
      finalPrice     = Math.max(0, basePrice - discountAmount)
    } else {
      discountAmount = Math.min(discountValue, basePrice)
      finalPrice     = Math.max(0, basePrice - discountAmount)
    }

    return NextResponse.json({
      valid:          true,
      code:           coupon.code,
      description:    coupon.description,
      discount_type:  coupon.discountType,
      discount_value: discountValue,
      discount_amount: discountAmount,
      base_price:     basePrice,
      final_price:    finalPrice,
    })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[POST /api/coupons/validate]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
