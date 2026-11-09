import { NextResponse } from 'next/server'
import { requireAuth, assertPermission } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { customizationSettings } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'

export async function GET() {
  try {
    const user = await requireAuth()
    assertPermission(user, 'configuracoes')

    const result = await db
      .select()
      .from(customizationSettings)
      .where(eq(customizationSettings.organizationId, user.organizationId))
      .limit(1)

    if (result.length > 0) {
      return NextResponse.json(result[0])
    }

    // Auto-create com valores padrão
    const created = await db
      .insert(customizationSettings)
      .values({
        organizationId: user.organizationId,
        primaryColor:   '#3b82f6',
        secondaryColor: '#10b981',
      })
      .returning()

    return NextResponse.json(created[0])
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    if ((error as Error).message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    logServerError('[GET /api/settings/customization]', error); console.error('[GET /api/settings/customization]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireAuth()
    assertPermission(user, 'configuracoes')
    const body = await request.json()

    await db
      .insert(customizationSettings)
      .values({
        organizationId: user.organizationId,
        primaryColor:   body.primary_color   || '#3b82f6',
        secondaryColor: body.secondary_color || '#10b981',
        logoUrl:        body.logo_url        || null,
        atelierName:    body.atelier_name    || null,
      })
      .onConflictDoUpdate({
        target: customizationSettings.organizationId,
        set: {
          primaryColor:   body.primary_color   || '#3b82f6',
          secondaryColor: body.secondary_color || '#10b981',
          logoUrl:        body.logo_url        || null,
          atelierName:    body.atelier_name    || null,
          updatedAt:      new Date(),
        },
      })

    const result = await db
      .select()
      .from(customizationSettings)
      .where(eq(customizationSettings.organizationId, user.organizationId))
      .limit(1)

    return NextResponse.json(result[0])
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    if ((error as Error).message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    logServerError('[PUT /api/settings/customization]', error); console.error('[PUT /api/settings/customization]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
