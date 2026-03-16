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
      .query(`SELECT * FROM organizations WHERE id = @orgId`)

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
    }

    const org = result.recordset[0]
    return NextResponse.json({ ...org, organization_id: org.id })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[GET /api/settings/organization]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const pool = await getPool()

    const result = await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .input('name', sql.NVarChar, body.name)
      .input('email', sql.NVarChar, body.email || null)
      .input('phone', sql.NVarChar, body.phone || null)
      .input('cnpj', sql.NVarChar, body.cnpj || null)
      .input('address', sql.NVarChar, body.address || null)
      .input('city', sql.NVarChar, body.city || null)
      .input('state', sql.NVarChar, body.state || null)
      .input('zipCode', sql.NVarChar, body.zip_code || null)
      .input('website', sql.NVarChar, body.website || null)
      .input('logoUrl', sql.NVarChar, body.logo_url || null)
      .input('instagram', sql.NVarChar, body.instagram || null)
      .input('facebook', sql.NVarChar, body.facebook || null)
      .input('twitter', sql.NVarChar, body.twitter || null)
      .input('tiktok', sql.NVarChar, body.tiktok || null)
      .input('kwai', sql.NVarChar, body.kwai || null)
      .query(`
        UPDATE organizations
        SET
          name = @name,
          email = @email,
          phone = @phone,
          cnpj = @cnpj,
          address = @address,
          city = @city,
          state = @state,
          zip_code = @zipCode,
          website = @website,
          logo_url = @logoUrl,
          instagram = @instagram,
          facebook = @facebook,
          twitter = @twitter,
          tiktok = @tiktok,
          kwai = @kwai,
          updated_at = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = @orgId
      `)

    const org = result.recordset[0]
    return NextResponse.json({ ...org, organization_id: org.id })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[PUT /api/settings/organization]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
