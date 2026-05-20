import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { plans } from '@/lib/db/schema'
import { eq, asc } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'

export interface PublicPlan {
  id: string
  slug: string
  name: string
  description: string | null
  price: number
  price_annual: number | null
  annual_note: string | null
  badge: string | null
  is_featured: boolean
  cta_text: string
  cta_url: string
  sort_order: number
  features: { text: string; included: boolean }[]
}

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(plans)
      .where(eq(plans.isActive, true))
      .orderBy(asc(plans.sortOrder))

    const result: PublicPlan[] = rows.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
      price: parseFloat(p.price),
      price_annual: p.priceAnnual ? parseFloat(p.priceAnnual) : null,
      annual_note: p.annualNote,
      badge: p.badge,
      is_featured: p.isFeatured,
      cta_text: p.ctaText ?? 'Criar conta',
      cta_url: p.ctaUrl ?? '/cadastro',
      sort_order: p.sortOrder,
      features: Array.isArray(p.featuresJson) ? (p.featuresJson as { text: string; included: boolean }[]) : [],
    }))

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    })
  } catch (error) {
    logServerError('[/api/plans] GET:', error); console.error('[/api/plans] GET:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
