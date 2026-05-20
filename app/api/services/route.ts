import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { orgServices, organizations } from '@/lib/db/schema'
import { eq, and, count } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth/session'
import { getPlanLimits, limitExceededResponse } from '@/lib/plan-limits'
import { logServerError } from '@/lib/log-error'

export async function GET() {
  try {
    const user = await requireAuth()

    const services = await db
      .select()
      .from(orgServices)
      .where(eq(orgServices.organizationId, user.organizationId))
      .orderBy(orgServices.createdAt)

    const mapped = services.map(s => ({
      ...s,
      materiais_produtos: s.materiais ? JSON.parse(s.materiais) : [],
    }))

    return NextResponse.json(mapped)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[GET /api/services]', error); console.error('[GET /api/services]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    // Verificar limite do plano
    const [orgRow, servicesCountRow, limits] = await Promise.all([
      db
        .select({ plan: organizations.plan })
        .from(organizations)
        .where(eq(organizations.id, user.organizationId))
        .then(r => r[0]),
      db
        .select({ count: count() })
        .from(orgServices)
        .where(eq(orgServices.organizationId, user.organizationId))
        .then(r => r[0]),
      getPlanLimits(),
    ])

    if (orgRow?.plan === 'free' && (servicesCountRow?.count ?? 0) >= limits.max_services_free) {
      return NextResponse.json(
        limitExceededResponse('serviços', limits.max_services_free),
        { status: 403 }
      )
    }

    const preco = parseFloat(String(body.preco).replace(/[^\d,]/g, '').replace(',', '.')) || 0

    const materiais_produtos: Array<{ preco_custo?: number; quantidade: number }> = body.materiais_produtos ?? []
    const custoMateriais = materiais_produtos.length > 0
      ? String(materiais_produtos.reduce((acc, m) => acc + (m.preco_custo ?? 0) * m.quantidade, 0))
      : null
    const materiaisJson = materiais_produtos.length > 0
      ? JSON.stringify(materiais_produtos)
      : null

    const [inserted] = await db
      .insert(orgServices)
      .values({
        organizationId:      user.organizationId,
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
      .returning()

    return NextResponse.json({
      ...inserted,
      materiais_produtos: inserted.materiais ? JSON.parse(inserted.materiais) : [],
    }, { status: 201 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[POST /api/services]', error); console.error('[POST /api/services]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
