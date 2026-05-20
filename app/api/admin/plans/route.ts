import { NextRequest, NextResponse } from 'next/server'
import { requireMaster } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { plans } from '@/lib/db/schema'
import { asc } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'

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

    const rows = await db
      .select()
      .from(plans)
      .orderBy(asc(plans.sortOrder))

    const result = rows.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
      price: parseFloat(p.price),
      price_annual: p.priceAnnual ? parseFloat(p.priceAnnual) : null,
      annual_note: p.annualNote,
      badge: p.badge,
      is_featured: p.isFeatured,
      is_active: p.isActive,
      features: Array.isArray(p.featuresJson) ? p.featuresJson : [],
      cta_text: p.ctaText,
      cta_url: p.ctaUrl,
      sort_order: p.sortOrder,
      created_at: p.createdAt,
      updated_at: p.updatedAt,
    }))

    return NextResponse.json(result)
  } catch (error) {
    const authErr = handleAuthError(error)
    if (authErr) return authErr
    logServerError('[admin/plans] GET:', error)
    console.error('[admin/plans] GET:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
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

    const inserted = await db.insert(plans).values({
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
    }).returning({ id: plans.id })

    return NextResponse.json({ id: inserted[0].id }, { status: 201 })
  } catch (error) {
    const authErr = handleAuthError(error)
    if (authErr) return authErr
    logServerError('[admin/plans] POST:', error)
    console.error('[admin/plans] POST:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
