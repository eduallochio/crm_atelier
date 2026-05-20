import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgClients, usageMetrics } from '@/lib/db/schema'
import { eq, and, sql as drizzleSql } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { id } = await params

    const [updated] = await db
      .update(orgClients)
      .set({
        nome: body.nome,
        telefone: body.telefone || null,
        email: body.email || null,
        dataNascimento: body.data_nascimento || null,
        observacoes: body.observacoes || null,
        cep: body.cep || null,
        logradouro: body.logradouro || null,
        numero: body.numero || null,
        complemento: body.complemento || null,
        bairro: body.bairro || null,
        cidade: body.cidade || null,
        estado: body.estado || null,
      })
      .where(and(eq(orgClients.id, id), eq(orgClients.organizationId, user.organizationId)))
      .returning()

    if (!updated) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[PUT /api/clients/:id]', error); console.error('[PUT /api/clients/:id]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const [deleted] = await db
      .delete(orgClients)
      .where(and(eq(orgClients.id, id), eq(orgClients.organizationId, user.organizationId)))
      .returning({ id: orgClients.id })

    if (!deleted) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }

    // Atualizar métricas (decremento, mínimo 0)
    await db
      .update(usageMetrics)
      .set({
        clientsCount: drizzleSql`GREATEST(${usageMetrics.clientsCount} - 1, 0)`,
        updatedAt: new Date(),
      })
      .where(eq(usageMetrics.organizationId, user.organizationId))

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[DELETE /api/clients/:id]', error); console.error('[DELETE /api/clients/:id]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
