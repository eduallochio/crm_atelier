import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getPool, sql } from '@/lib/db'

const DEFAULTS = {
  date_format: 'dd/MM/yyyy',
  time_format: '24h',
  currency: 'BRL',
  timezone: 'America/Sao_Paulo',
  language: 'pt-BR',
  theme: 'light',
  compact_mode: false,
  show_tooltips: true,
  controla_estoque: false,
}

export async function GET() {
  try {
    const user = await requireAuth()
    const pool = await getPool()

    const result = await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(`SELECT * FROM org_system_preferences WHERE organization_id = @orgId`)

    if (result.recordset.length === 0) {
      return NextResponse.json({
        id: '',
        organization_id: user.organizationId,
        ...DEFAULTS,
        updated_at: new Date().toISOString(),
      })
    }

    return NextResponse.json(result.recordset[0])
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[GET /api/settings/system]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const pool = await getPool()

    await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .input('dateFormat', sql.NVarChar, body.date_format ?? 'dd/MM/yyyy')
      .input('timeFormat', sql.NVarChar, body.time_format ?? '24h')
      .input('currency', sql.NVarChar, body.currency ?? 'BRL')
      .input('timezone', sql.NVarChar, body.timezone ?? 'America/Sao_Paulo')
      .input('language', sql.NVarChar, body.language ?? 'pt-BR')
      .input('theme', sql.NVarChar, body.theme ?? 'light')
      .input('compactMode', sql.Bit, body.compact_mode ? 1 : 0)
      .input('showTooltips', sql.Bit, body.show_tooltips !== false ? 1 : 0)
      .input('controlaEstoque', sql.Bit, body.controla_estoque ? 1 : 0)
      .query(`
        UPDATE org_system_preferences
        SET
          date_format = @dateFormat,
          time_format = @timeFormat,
          currency = @currency,
          timezone = @timezone,
          [language] = @language,
          theme = @theme,
          compact_mode = @compactMode,
          show_tooltips = @showTooltips,
          controla_estoque = @controlaEstoque,
          updated_at = GETDATE()
        WHERE organization_id = @orgId

        IF @@ROWCOUNT = 0
          INSERT INTO org_system_preferences (
            organization_id, date_format, time_format, currency, timezone,
            [language], theme, compact_mode, show_tooltips, controla_estoque
          )
          VALUES (
            @orgId, @dateFormat, @timeFormat, @currency, @timezone,
            @language, @theme, @compactMode, @showTooltips, @controlaEstoque
          )
      `)

    const result = await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(`SELECT * FROM org_system_preferences WHERE organization_id = @orgId`)

    return NextResponse.json(result.recordset[0])
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[PUT /api/settings/system]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
