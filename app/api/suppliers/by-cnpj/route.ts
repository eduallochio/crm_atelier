import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getPool, sql } from '@/lib/db'

/** GET /api/suppliers/by-cnpj?cnpj=12345678000190 → supplier ou null */
export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const cnpj = searchParams.get('cnpj')?.replace(/\D/g, '') // remove pontuação

    if (!cnpj) {
      return NextResponse.json(null)
    }

    const pool = await getPool()
    const result = await pool.request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .input('cnpj', sql.NVarChar(20), cnpj)
      .query(`
        SELECT TOP 1 * FROM org_suppliers
        WHERE organization_id = @orgId
          AND REPLACE(REPLACE(REPLACE(REPLACE(cnpj,'.',''),'/',''),'-',''),' ','') = @cnpj
          AND ativo = 1
      `)

    return NextResponse.json(result.recordset[0] ?? null)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[GET /api/suppliers/by-cnpj]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
