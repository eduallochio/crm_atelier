import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getPool, sql } from '@/lib/db'

const DEFAULTS = [
  { nome: 'Dinheiro',          tipo: 'dinheiro',       is_default: true,  display_order: 1, color: '#22c55e', icon: 'banknote'     },
  { nome: 'Pix',               tipo: 'pix',            is_default: true,  display_order: 2, color: '#8b5cf6', icon: 'qr-code'      },
  { nome: 'Cartão de Crédito', tipo: 'cartao_credito', is_default: false, display_order: 3, color: '#3b82f6', icon: 'credit-card'  },
  { nome: 'Cartão de Débito',  tipo: 'cartao_debito',  is_default: false, display_order: 4, color: '#f59e0b', icon: 'credit-card'  },
]

const SELECT_COLS = `
  id, organization_id,
  nome            AS name,
  ISNULL(tipo,'') AS code,
  ativo           AS enabled,
  CAST(ISNULL(is_default,0) AS BIT)  AS is_default,
  ISNULL(display_order,0)            AS display_order,
  icon, color,
  created_at,
  ISNULL(updated_at, created_at)     AS updated_at
`

async function seedDefaults(pool: Awaited<ReturnType<typeof getPool>>, orgId: string) {
  for (const d of DEFAULTS) {
    await pool
      .request()
      .input('orgId',        sql.UniqueIdentifier, orgId)
      .input('nome',         sql.NVarChar, d.nome)
      .input('tipo',         sql.NVarChar, d.tipo)
      .input('isDefault',    sql.Bit,      d.is_default ? 1 : 0)
      .input('displayOrder', sql.Int,      d.display_order)
      .input('color',        sql.NVarChar, d.color)
      .input('icon',         sql.NVarChar, d.icon)
      .query(`
        INSERT INTO org_payment_methods
          (organization_id, nome, tipo, ativo, is_default, display_order, color, icon)
        VALUES (@orgId, @nome, @tipo, 1, @isDefault, @displayOrder, @color, @icon)
      `)
  }
}

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    const pool = await getPool()
    const { searchParams } = new URL(request.url)
    const onlyEnabled = searchParams.get('enabled') === 'true'

    // Auto-semear se org ainda não tem nenhuma forma de pagamento
    const countResult = await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(`SELECT COUNT(*) AS cnt FROM org_payment_methods WHERE organization_id = @orgId`)

    if (countResult.recordset[0].cnt === 0) {
      await seedDefaults(pool, user.organizationId)
    }

    let query = `SELECT ${SELECT_COLS} FROM org_payment_methods WHERE organization_id = @orgId`
    if (onlyEnabled) query += ` AND ativo = 1`
    query += ` ORDER BY ISNULL(display_order,0) ASC, nome ASC`

    const result = await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(query)

    return NextResponse.json(result.recordset)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[GET /api/payment-methods]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const pool = await getPool()

    const maxOrderResult = await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(`
        SELECT ISNULL(MAX(display_order), 0) + 1 AS next_order
        FROM org_payment_methods
        WHERE organization_id = @orgId
      `)

    const nextOrder = maxOrderResult.recordset[0].next_order

    const result = await pool
      .request()
      .input('orgId',        sql.UniqueIdentifier, user.organizationId)
      .input('nome',         sql.NVarChar, body.name)
      .input('tipo',         sql.NVarChar, (body.code || '').toLowerCase().replace(/\s+/g, '_') || null)
      .input('ativo',        sql.Bit,      body.enabled !== false ? 1 : 0)
      .input('isDefault',    sql.Bit,      false)
      .input('displayOrder', sql.Int,      nextOrder)
      .input('icon',         sql.NVarChar, body.icon  || null)
      .input('color',        sql.NVarChar, body.color || null)
      .query(`
        INSERT INTO org_payment_methods
          (organization_id, nome, tipo, ativo, is_default, display_order, icon, color)
        OUTPUT
          INSERTED.id, INSERTED.organization_id,
          INSERTED.nome AS name,
          ISNULL(INSERTED.tipo,'') AS code,
          INSERTED.ativo AS enabled,
          CAST(ISNULL(INSERTED.is_default,0) AS BIT) AS is_default,
          ISNULL(INSERTED.display_order,0) AS display_order,
          INSERTED.icon, INSERTED.color,
          INSERTED.created_at,
          ISNULL(INSERTED.updated_at, INSERTED.created_at) AS updated_at
        VALUES (@orgId, @nome, @tipo, @ativo, @isDefault, @displayOrder, @icon, @color)
      `)

    return NextResponse.json(result.recordset[0], { status: 201 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[POST /api/payment-methods]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
