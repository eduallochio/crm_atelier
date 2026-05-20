import { NextRequest, NextResponse } from 'next/server'
import { requireMaster } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { plans } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'

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

    await db
      .update(plans)
      .set({
        slug,
        name,
        description: description || null,
        price: String(parseFloat(price) || 0),
        priceAnnual: price_annual ? String(parseFloat(price_annual)) : null,
        annualNote: annual_note || null,
        badge: badge || null,
        isFeatured: Boolean(is_featured),
        isActive: is_active !== false,
        featuresJson: features ?? [],
        ctaText: cta_text || 'Criar conta',
        ctaUrl: cta_url || '/cadastro',
        sortOrder: parseInt(sort_order) || 0,
        updatedAt: new Date(),
      })
      .where(eq(plans.id, id))

    return NextResponse.json({ ok: true })
  } catch (error) {
    const authErr = handleAuthError(error)
    if (authErr) return authErr
    logServerError('[admin/plans/[id]] PUT:', error)
    console.error('[admin/plans/[id]] PUT:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireMaster()
    const { id } = await params

    await db.delete(plans).where(eq(plans.id, id))

    return NextResponse.json({ ok: true })
  } catch (error) {
    const authErr = handleAuthError(error)
    if (authErr) return authErr
    logServerError('[admin/plans/[id]] DELETE:', error)
    console.error('[admin/plans/[id]] DELETE:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
