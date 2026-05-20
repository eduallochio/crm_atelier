import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgPaymentMethods } from '@/lib/db/schema'
import { asc, eq, sql as drizzleSql } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'

const DEFAULTS = [
  { nome: 'Dinheiro',          tipo: 'dinheiro',       sortOrder: 1 },
  { nome: 'Pix',               tipo: 'pix',            sortOrder: 2 },
  { nome: 'Cartão de Crédito', tipo: 'cartao_credito', sortOrder: 3 },
  { nome: 'Cartão de Débito',  tipo: 'cartao_debito',  sortOrder: 4 },
]

async function seedDefaults(organizationId: string) {
  for (const d of DEFAULTS) {
    await db.insert(orgPaymentMethods).values({
      organizationId,
      nome:      d.nome,
      tipo:      d.tipo,
      ativo:     true,
      sortOrder: d.sortOrder,
    })
  }
}

function mapRow(row: typeof orgPaymentMethods.$inferSelect) {
  return {
    id:            row.id,
    organization_id: row.organizationId,
    name:          row.nome,
    code:          row.tipo ?? '',
    enabled:       row.ativo,
    display_order: row.sortOrder,
    created_at:    row.createdAt,
  }
}

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const onlyEnabled = searchParams.get('enabled') === 'true'

    // Auto-seed if org has no payment methods
    const countResult = await db
      .select({ cnt: drizzleSql<number>`count(*)` })
      .from(orgPaymentMethods)
      .where(eq(orgPaymentMethods.organizationId, user.organizationId))

    if (Number(countResult[0].cnt) === 0) {
      await seedDefaults(user.organizationId)
    }

    const rows = await db
      .select()
      .from(orgPaymentMethods)
      .where(
        onlyEnabled
          ? drizzleSql`${orgPaymentMethods.organizationId} = ${user.organizationId} AND ${orgPaymentMethods.ativo} = true`
          : eq(orgPaymentMethods.organizationId, user.organizationId)
      )
      .orderBy(asc(orgPaymentMethods.sortOrder), asc(orgPaymentMethods.nome))

    return NextResponse.json(rows.map(mapRow))
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[GET /api/payment-methods]', error); console.error('[GET /api/payment-methods]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const maxOrderResult = await db
      .select({ maxOrder: drizzleSql<number>`coalesce(max(${orgPaymentMethods.sortOrder}), 0)` })
      .from(orgPaymentMethods)
      .where(eq(orgPaymentMethods.organizationId, user.organizationId))

    const nextOrder = Number(maxOrderResult[0].maxOrder) + 1

    const inserted = await db
      .insert(orgPaymentMethods)
      .values({
        organizationId: user.organizationId,
        nome:           body.name,
        tipo:           (body.code || '').toLowerCase().replace(/\s+/g, '_') || null,
        ativo:          body.enabled !== false,
        sortOrder:      nextOrder,
      })
      .returning()

    return NextResponse.json(mapRow(inserted[0]), { status: 201 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[POST /api/payment-methods]', error); console.error('[POST /api/payment-methods]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
