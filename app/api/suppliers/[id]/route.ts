import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgSuppliers } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { id } = await params

    const [row] = await db
      .update(orgSuppliers)
      .set({
        nome:        body.nome,
        contato:     body.contato    || null,
        telefone:    body.telefone   || null,
        email:       body.email      || null,
        cnpj:        body.cnpj || body.cpf_cnpj || null,
        endereco:    body.endereco   || null,
        observacoes: body.observacoes || null,
        ativo:       body.ativo !== false,
        updatedAt:   new Date(),
      })
      .where(
        and(
          eq(orgSuppliers.id, id),
          eq(orgSuppliers.organizationId, user.organizationId)
        )
      )
      .returning()

    if (!row) {
      return NextResponse.json({ error: 'Fornecedor não encontrado' }, { status: 404 })
    }

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
    })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[PUT /api/suppliers/:id]', error); console.error('[PUT /api/suppliers/:id]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// Soft delete — marks as inactive
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const [row] = await db
      .update(orgSuppliers)
      .set({ ativo: false, updatedAt: new Date() })
      .where(
        and(
          eq(orgSuppliers.id, id),
          eq(orgSuppliers.organizationId, user.organizationId)
        )
      )
      .returning({ id: orgSuppliers.id })

    if (!row) {
      return NextResponse.json({ error: 'Fornecedor não encontrado' }, { status: 404 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[DELETE /api/suppliers/:id]', error); console.error('[DELETE /api/suppliers/:id]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
