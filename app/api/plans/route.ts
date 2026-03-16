import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

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
    const pool = await getPool()
    const result = await pool.request().query(`
      SELECT id, slug, name, description, price, price_annual, annual_note,
             badge, is_featured, features_json, cta_text, cta_url, sort_order
      FROM plans
      WHERE is_active = 1
      ORDER BY sort_order ASC
    `)

    const plans: PublicPlan[] = result.recordset.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
      price: parseFloat(p.price),
      price_annual: p.price_annual ? parseFloat(p.price_annual) : null,
      annual_note: p.annual_note,
      badge: p.badge,
      is_featured: p.is_featured === true || p.is_featured === 1,
      cta_text: p.cta_text ?? 'Criar conta',
      cta_url: p.cta_url ?? '/cadastro',
      sort_order: p.sort_order,
      features: p.features_json ? JSON.parse(p.features_json) : [],
    }))

    return NextResponse.json(plans, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    })
  } catch (error) {
    console.error('[/api/plans] GET:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
