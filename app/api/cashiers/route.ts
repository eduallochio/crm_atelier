import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgCashiers } from '@/lib/db/schema'
import { eq, asc } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'

export async function GET() {
  try {
    const user = await requireAuth()

    const rows = await db
      .select()
      .from(orgCashiers)
      .where(eq(orgCashiers.organizationId, user.organizationId))
      .orderBy(asc(orgCashiers.nome))

    return NextResponse.json(rows.map(r => ({
      id:              r.id,
      organization_id: r.organizationId,
      nome:            r.nome,
      descricao:       r.descricao,
      chave_pix:       r.chavePix ?? null,
      ativo:           r.ativo,
      created_at:      r.createdAt,
      updated_at:      r.updatedAt,
    })))
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[GET /api/cashiers]', error); console.error('[GET /api/cashiers]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const [row] = await db
      .insert(orgCashiers)
      .values({
        organizationId: user.organizationId,
        nome:      body.nome,
        descricao: body.descricao ?? null,
        chavePix:  body.chave_pix || null,
        ativo:     body.ativo !== false,
      })
      .returning()

    return NextResponse.json({
      id:              row.id,
      organization_id: row.organizationId,
      nome:            row.nome,
      descricao:       row.descricao,
      chave_pix:       row.chavePix ?? null,
      ativo:           row.ativo,
      created_at:      row.createdAt,
      updated_at:      row.updatedAt,
    }, { status: 201 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[POST /api/cashiers]', error); console.error('[POST /api/cashiers]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
