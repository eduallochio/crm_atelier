import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgSuppliers } from '@/lib/db/schema'
import { eq, asc } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'

export async function GET() {
  try {
    const user = await requireAuth()

    const rows = await db
      .select()
      .from(orgSuppliers)
      .where(eq(orgSuppliers.organizationId, user.organizationId))
      .orderBy(asc(orgSuppliers.nome))

    return NextResponse.json(rows.map(r => ({
      id:              r.id,
      organization_id: r.organizationId,
      nome:            r.nome,
      contato:         r.contato,
      telefone:        r.telefone,
      email:           r.email,
      cpf_cnpj:        r.cnpj,
      endereco:        r.endereco,
      observacoes:     r.observacoes,
      ativo:           r.ativo,
      created_at:      r.createdAt,
      updated_at:      r.updatedAt,
    })))
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[GET /api/suppliers]', error); console.error('[GET /api/suppliers]', error)
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

    return NextResponse.json({
      id:              row.id,
      organization_id: row.organizationId,
      nome:            row.nome,
      contato:         row.contato,
      telefone:        row.telefone,
      email:           row.email,
      cpf_cnpj:        row.cnpj,
      endereco:        row.endereco,
      observacoes:     row.observacoes,
      ativo:           row.ativo,
      created_at:      row.createdAt,
      updated_at:      row.updatedAt,
    }, { status: 201 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[POST /api/suppliers]', error); console.error('[POST /api/suppliers]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
