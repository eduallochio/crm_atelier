import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgSuppliers } from '@/lib/db/schema'
import { eq, asc } from 'drizzle-orm'

export async function GET() {
  try {
    const user = await requireAuth()

    const rows = await db
      .select()
      .from(orgSuppliers)
      .where(eq(orgSuppliers.organizationId, user.organizationId))
      .orderBy(asc(orgSuppliers.nome))

    return NextResponse.json(rows)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[GET /api/suppliers]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const [row] = await db
      .insert(orgSuppliers)
      .values({
        organizationId: user.organizationId,
        nome:           body.nome,
        contato:        body.contato    || null,
        telefone:       body.telefone   || null,
        email:          body.email      || null,
        cnpj:           body.cnpj || body.cpf_cnpj || null,
        endereco:       body.endereco   || null,
        observacoes:    body.observacoes || null,
        ativo:          body.ativo !== false,
      })
      .returning()

    return NextResponse.json(row, { status: 201 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[POST /api/suppliers]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
