import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { promoLeads } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  try {
    const { email, whatsapp, instagram } = await req.json()
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 })
    }
    if (!whatsapp || typeof whatsapp !== 'string' || whatsapp.trim().length < 8) {
      return NextResponse.json({ error: 'WhatsApp inválido' }, { status: 400 })
    }

    const normalized = email.toLowerCase().trim()

    const existing = await db
      .select({ id: promoLeads.id })
      .from(promoLeads)
      .where(eq(promoLeads.email, normalized))
      .limit(1)

    if (existing.length > 0) {
      return NextResponse.json({ ok: true, duplicate: true })
    }

    await db.insert(promoLeads).values({
      email: normalized,
      whatsapp: whatsapp.trim(),
      instagram: instagram?.trim() || null,
      source: 'promo_page',
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
