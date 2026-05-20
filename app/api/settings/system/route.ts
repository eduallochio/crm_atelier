import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgSystemPreferences } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'

const DEFAULTS = {
  dateFormat:   'dd/MM/yyyy',
  timeFormat:   '24h',
  currency:     'BRL',
  timezone:     'America/Sao_Paulo',
  language:     'pt-BR',
  theme:        'light',
  compactMode:  false,
  showTooltips: true,
}

export async function GET() {
  try {
    const user = await requireAuth()

    const result = await db
      .select()
      .from(orgSystemPreferences)
      .where(eq(orgSystemPreferences.organizationId, user.organizationId))
      .limit(1)

    if (result.length === 0) {
      return NextResponse.json({
        id: '',
        organization_id: user.organizationId,
        ...DEFAULTS,
        controla_estoque: false,
        updated_at: new Date().toISOString(),
      })
    }

    const r = result[0]
    return NextResponse.json({
      id:               r.id,
      organization_id:  r.organizationId,
      date_format:      r.dateFormat,
      time_format:      r.timeFormat,
      currency:         r.currency,
      timezone:         r.timezone,
      language:         r.language,
      theme:            r.theme,
      compact_mode:     r.compactMode,
      show_tooltips:    r.showTooltips,
      controla_estoque: r.controlaEstoque,
      updated_at:       r.updatedAt,
    })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[GET /api/settings/system]', error); console.error('[GET /api/settings/system]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const values = {
      organizationId: user.organizationId,
      dateFormat:     body.date_format ?? 'dd/MM/yyyy',
      timeFormat:     body.time_format ?? '24h',
      currency:       body.currency    ?? 'BRL',
      timezone:       body.timezone    ?? 'America/Sao_Paulo',
      language:       body.language    ?? 'pt-BR',
      theme:          body.theme       ?? 'light',
      compactMode:    !!body.compact_mode,
      showTooltips:   body.show_tooltips !== false,
    }

    await db
      .insert(orgSystemPreferences)
      .values(values)
      .onConflictDoUpdate({
        target: orgSystemPreferences.organizationId,
        set: {
          dateFormat:   values.dateFormat,
          timeFormat:   values.timeFormat,
          currency:     values.currency,
          timezone:     values.timezone,
          language:     values.language,
          theme:        values.theme,
          compactMode:  values.compactMode,
          showTooltips: values.showTooltips,
          updatedAt:    new Date(),
        },
      })

    const result = await db
      .select()
      .from(orgSystemPreferences)
      .where(eq(orgSystemPreferences.organizationId, user.organizationId))
      .limit(1)

    const r = result[0]
    return NextResponse.json({
      id:               r.id,
      organization_id:  r.organizationId,
      date_format:      r.dateFormat,
      time_format:      r.timeFormat,
      currency:         r.currency,
      timezone:         r.timezone,
      language:         r.language,
      theme:            r.theme,
      compact_mode:     r.compactMode,
      show_tooltips:    r.showTooltips,
      controla_estoque: r.controlaEstoque,
      updated_at:       r.updatedAt,
    })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[PUT /api/settings/system]', error); console.error('[PUT /api/settings/system]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
