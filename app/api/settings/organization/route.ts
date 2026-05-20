import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { organizations } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'

export async function GET() {
  try {
    const user = await requireAuth()

    const result = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, user.organizationId))
      .limit(1)

    if (result.length === 0) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
    }

    const org = result[0]
    return NextResponse.json({
      ...org,
      organization_id: org.id,
      // Mapeia camelCase Drizzle → snake_case esperado pelo form
      zip_code:  org.zipCode  ?? null,
      logo_url:  org.logoUrl  ?? null,
    })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[GET /api/settings/organization]', error); console.error('[GET /api/settings/organization]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const updated = await db
      .update(organizations)
      .set({
        name:      body.name,
        email:     body.email     || null,
        phone:     body.phone     || null,
        cnpj:      body.cnpj      || null,
        address:   body.address   || null,
        city:      body.city      || null,
        state:     body.state     || null,
        zipCode:   body.zip_code  || null,
        website:   body.website   || null,
        logoUrl:   body.logo_url  || null,
        instagram: body.instagram || null,
        facebook:  body.facebook  || null,
        twitter:   body.twitter   || null,
        tiktok:    body.tiktok    || null,
        kwai:      body.kwai      || null,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, user.organizationId))
      .returning()

    const org = updated[0]
    return NextResponse.json({
      ...org,
      organization_id: org.id,
      zip_code: org.zipCode  ?? null,
      logo_url: org.logoUrl  ?? null,
    })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[PUT /api/settings/organization]', error); console.error('[PUT /api/settings/organization]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
