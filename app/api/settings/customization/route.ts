import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getPool, sql } from '@/lib/db'

export async function GET() {
  try {
    const user = await requireAuth()
    const pool = await getPool()

    const result = await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(`SELECT * FROM customization_settings WHERE organization_id = @orgId`)

    if (result.recordset.length > 0) {
      return NextResponse.json(result.recordset[0])
    }

    // Auto-create com valores padrão
    const created = await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(`
        INSERT INTO customization_settings (organization_id, primary_color, secondary_color)
        OUTPUT INSERTED.*
        VALUES (@orgId, '#3b82f6', '#10b981')
      `)

    return NextResponse.json(created.recordset[0])
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[GET /api/settings/customization]', error)
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
      .input('primaryColor', sql.NVarChar, body.primary_color || '#3b82f6')
      .input('secondaryColor', sql.NVarChar, body.secondary_color || '#10b981')
      .input('logoUrl', sql.NVarChar, body.logo_url || null)
      .input('atelierName', sql.NVarChar, body.atelier_name || null)
      .query(`
        UPDATE customization_settings
        SET
          primary_color = @primaryColor,
          secondary_color = @secondaryColor,
          logo_url = @logoUrl,
          atelier_name = @atelierName,
          updated_at = GETDATE()
        WHERE organization_id = @orgId

        IF @@ROWCOUNT = 0
          INSERT INTO customization_settings (organization_id, primary_color, secondary_color, logo_url, atelier_name)
          VALUES (@orgId, @primaryColor, @secondaryColor, @logoUrl, @atelierName)
      `)

    const result = await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(`SELECT * FROM customization_settings WHERE organization_id = @orgId`)

    return NextResponse.json(result.recordset[0])
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[PUT /api/settings/customization]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
