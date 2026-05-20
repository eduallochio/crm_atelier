import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { orgServices } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth/session'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { id } = await params

    const preco = parseFloat(String(body.preco).replace(/[^\d,]/g, '').replace(',', '.')) || 0

    const materiais_produtos: Array<{ preco_custo?: number; quantidade: number }> = body.materiais_produtos ?? []
    const custoMateriais = materiais_produtos.length > 0
      ? String(materiais_produtos.reduce((acc, m) => acc + (m.preco_custo ?? 0) * m.quantidade, 0))
      : null
    const materiaisJson = materiais_produtos.length > 0
      ? JSON.stringify(materiais_produtos)
      : null

    const [updated] = await db
      .update(orgServices)
      .set({
        nome:                body.nome,
        descricao:           body.descricao || null,
        preco:               String(preco),
        categoria:           body.categoria || null,
        tempoEstimado:       body.tempo_estimado || null,
        custoMateriais:      custoMateriais,
        materiais:           materiaisJson,
        observacoesTecnicas: body.observacoes_tecnicas || null,
        nivelDificuldade:    body.nivel_dificuldade || null,
        tempoMinimo:         body.tempo_minimo || null,
        tempoMaximo:         body.tempo_maximo || null,
        ativo:               body.ativo !== false,
      })
      .where(and(eq(orgServices.id, id), eq(orgServices.organizationId, user.organizationId)))
      .returning()

    if (!updated) {
      return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      ...updated,
      materiais_produtos: updated.materiais ? JSON.parse(updated.materiais) : [],
    })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[PUT /api/services/:id]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// PATCH: toggle ativo status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { id } = await params

    const [updated] = await db
      .update(orgServices)
      .set({ ativo: !!body.ativo })
      .where(and(eq(orgServices.id, id), eq(orgServices.organizationId, user.organizationId)))
      .returning()

    if (!updated) {
      return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[PATCH /api/services/:id]', error)
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
      .delete(orgServices)
      .where(and(eq(orgServices.id, id), eq(orgServices.organizationId, user.organizationId)))
      .returning({ id: orgServices.id })

    if (!deleted) {
      return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[DELETE /api/services/:id]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
