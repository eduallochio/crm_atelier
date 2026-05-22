import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { orgServices } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth/session'
import { logServerError } from '@/lib/log-error'

type OrgService = typeof orgServices.$inferSelect

function mapService(s: OrgService) {
  return {
    id:                   s.id,
    organization_id:      s.organizationId,
    nome:                 s.nome,
    descricao:            s.descricao,
    preco:                Number(s.preco ?? 0),
    categoria:            s.categoria,
    tempo_estimado:       s.tempoEstimado,
    tempo_minimo:         s.tempoMinimo,
    tempo_maximo:         s.tempoMaximo,
    observacoes_tecnicas: s.observacoesTecnicas,
    nivel_dificuldade:    s.nivelDificuldade,
    custo_materiais:      Number(s.custoMateriais ?? 0),
    ativo:                s.ativo,
    created_at:           s.createdAt,
    materiais_produtos:   s.materiaisJson
      ? (Array.isArray(s.materiaisJson) ? s.materiaisJson : [])
      : (s.materiais ? JSON.parse(s.materiais as string) : []),
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
        materiaisJson:       materiais_produtos.length > 0 ? materiais_produtos : null,
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

    return NextResponse.json(mapService(updated))
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[PUT /api/services/:id]', error); console.error('[PUT /api/services/:id]', error)
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

    return NextResponse.json(mapService(updated))
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[PATCH /api/services/:id]', error); console.error('[PATCH /api/services/:id]', error)
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
    logServerError('[DELETE /api/services/:id]', error); console.error('[DELETE /api/services/:id]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
