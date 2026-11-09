import { NextResponse } from 'next/server'
import { requireAuth, assertPermission } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgClients, usageMetrics, orgDeletionLog } from '@/lib/db/schema'
import { eq, and, sql as drizzleSql } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    assertPermission(user, 'clientes')
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
    if ((error as Error).message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    logServerError('[PUT /api/clients/:id]', error); console.error('[PUT /api/clients/:id]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let organizationId: string | undefined
  try {
    const user = await requireAuth()
    assertPermission(user, 'clientes')
    organizationId = user.organizationId
    const { id } = await params

    // DELETE ... RETURNING é atômico — evita a corrida de um SELECT de
    // verificação separado (duas exclusões concorrentes nunca gravam log
    // duplicado/fantasma, porque só quem realmente apagou a linha recebe
    // o retorno). Snapshot pro log vem do próprio retorno do delete.
    const [deleted] = await db
      .delete(orgClients)
      .where(and(eq(orgClients.id, id), eq(orgClients.organizationId, user.organizationId)))
      .returning()

    if (!deleted) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }

    // Snapshot — ordens de serviço do cliente ficam com client_id nulo
    // (onDelete: set null), sem rastro de quem era, daí o log aqui
    await db.insert(orgDeletionLog).values({
      organizationId: user.organizationId,
      userId:         user.id,
      userEmail:      user.email,
      resourceType:   'client',
      resourceId:     deleted.id,
      snapshot: {
        nome:      deleted.nome,
        telefone:  deleted.telefone,
        email:     deleted.email,
        createdAt: deleted.createdAt,
      },
    })

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
    if ((error as Error).message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    logServerError('[DELETE /api/clients/:id]', error, undefined, organizationId); console.error('[DELETE /api/clients/:id]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
