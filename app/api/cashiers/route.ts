import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgCashiers } from '@/lib/db/schema'
import { eq, asc, sql } from 'drizzle-orm'
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
      is_default:      r.isDefault,
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

    // Primeiro caixa da organização nasce como padrão automaticamente —
    // sem isso, o lançamento automático de OS não tem onde cair
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orgCashiers)
      .where(eq(orgCashiers.organizationId, user.organizationId))
    const isFirstCashier = count === 0
    const wantsDefault = body.is_default === true || isFirstCashier

    const row = await db.transaction(async (tx) => {
      if (wantsDefault) {
        await tx
          .update(orgCashiers)
          .set({ isDefault: false })
          .where(eq(orgCashiers.organizationId, user.organizationId))
      }

      try {
        const [inserted] = await tx
          .insert(orgCashiers)
          .values({
            organizationId: user.organizationId,
            nome:      body.nome,
            descricao: body.descricao ?? null,
            chavePix:  body.chave_pix || null,
            ativo:     body.ativo !== false,
            isDefault: wantsDefault,
          })
          .returning()

        return inserted
      } catch (insertError) {
        // Duas criações de caixa em paralelo (ex.: duplo clique) podem ambas
        // passar pelo UPDATE acima antes de qualquer INSERT completar — a
        // unique constraint no banco (idx_cashiers_one_default_per_org) pega
        // essa corrida; aqui só insere sem padrão em vez de devolver 500
        if ((insertError as { code?: string }).code === '23505') {
          const [inserted] = await tx
            .insert(orgCashiers)
            .values({
              organizationId: user.organizationId,
              nome:      body.nome,
              descricao: body.descricao ?? null,
              chavePix:  body.chave_pix || null,
              ativo:     body.ativo !== false,
              isDefault: false,
            })
            .returning()
          return inserted
        }
        throw insertError
      }
    })

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
    }, { status: 201 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[POST /api/cashiers]', error); console.error('[POST /api/cashiers]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
