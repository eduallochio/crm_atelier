import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgCashiers } from '@/lib/db/schema'
import { eq, and, ne } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const [row] = await db
      .select()
      .from(orgCashiers)
      .where(and(eq(orgCashiers.id, id), eq(orgCashiers.organizationId, user.organizationId)))

    if (!row) {
      return NextResponse.json({ error: 'Caixa não encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      id:              row.id,
      organization_id: row.organizationId,
      nome:            row.nome,
      descricao:       row.descricao,
      chave_pix:       row.chavePix ?? null,
      ativo:           row.ativo,
      is_default:      row.isDefault,
      created_at:      row.createdAt,
      updated_at:      row.updatedAt,
    })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[GET /api/cashiers/:id]', error); console.error('[GET /api/cashiers/:id]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { id } = await params

    // Se está tentando desmarcar o único caixa padrão, impede — sempre precisa
    // sobrar exatamente um, senão o lançamento automático de OS fica sem destino
    if (body.is_default === false) {
      const [current] = await db
        .select({ isDefault: orgCashiers.isDefault })
        .from(orgCashiers)
        .where(and(eq(orgCashiers.id, id), eq(orgCashiers.organizationId, user.organizationId)))
      if (current?.isDefault) {
        return NextResponse.json({ error: 'Defina outro caixa como padrão antes de desmarcar este.' }, { status: 400 })
      }
    }

    const row = await db.transaction(async (tx) => {
      if (body.is_default === true) {
        await tx
          .update(orgCashiers)
          .set({ isDefault: false })
          .where(and(eq(orgCashiers.organizationId, user.organizationId), ne(orgCashiers.id, id)))
      }

      const [updated] = await tx
        .update(orgCashiers)
        .set({
          nome:      body.nome,
          descricao: body.descricao ?? null,
          chavePix:  body.chave_pix !== undefined ? (body.chave_pix || null) : undefined,
          ativo:     body.ativo !== false,
          ...(body.is_default !== undefined ? { isDefault: body.is_default } : {}),
          updatedAt: new Date(),
        })
        .where(and(eq(orgCashiers.id, id), eq(orgCashiers.organizationId, user.organizationId)))
        .returning()

      return updated
    })

    if (!row) {
      return NextResponse.json({ error: 'Caixa não encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      id:              row.id,
      organization_id: row.organizationId,
      nome:            row.nome,
      descricao:       row.descricao,
      chave_pix:       row.chavePix ?? null,
      ativo:           row.ativo,
      is_default:      row.isDefault,
      created_at:      row.createdAt,
      updated_at:      row.updatedAt,
    })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[PUT /api/cashiers/:id]', error); console.error('[PUT /api/cashiers/:id]', error)
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

    const row = await db.transaction(async (tx) => {
      const [deleted] = await tx
        .delete(orgCashiers)
        .where(and(eq(orgCashiers.id, id), eq(orgCashiers.organizationId, user.organizationId)))
        .returning({ id: orgCashiers.id, isDefault: orgCashiers.isDefault })

      if (deleted?.isDefault) {
        const [next] = await tx
          .select({ id: orgCashiers.id })
          .from(orgCashiers)
          .where(and(eq(orgCashiers.organizationId, user.organizationId), eq(orgCashiers.ativo, true)))
          .limit(1)
        if (next) {
          await tx.update(orgCashiers).set({ isDefault: true }).where(eq(orgCashiers.id, next.id))
        }
      }

      return deleted
    })

    if (!row) {
      return NextResponse.json({ error: 'Caixa não encontrado' }, { status: 404 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[DELETE /api/cashiers/:id]', error); console.error('[DELETE /api/cashiers/:id]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
