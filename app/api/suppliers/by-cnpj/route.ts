import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgSuppliers } from '@/lib/db/schema'
import { eq, and, sql as drizzleSql } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'

/** GET /api/suppliers/by-cnpj?cnpj=12345678000190 → supplier or null */
export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const cnpj = searchParams.get('cnpj')?.replace(/\D/g, '') // strip punctuation

    if (!cnpj) {
      return NextResponse.json(null)
    }

    const [row] = await db
      .select()
      .from(orgSuppliers)
      .where(
        and(
          eq(orgSuppliers.organizationId, user.organizationId),
          eq(orgSuppliers.ativo, true),
          drizzleSql`regexp_replace(${orgSuppliers.cnpj}, '[^0-9]', '', 'g') = ${cnpj}`
        )
      )
      .limit(1)

    return NextResponse.json(row ?? null)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[GET /api/suppliers/by-cnpj]', error); console.error('[GET /api/suppliers/by-cnpj]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
