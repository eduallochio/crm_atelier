import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgPayables, orgSuppliers } from '@/lib/db/schema'
import { eq, desc, sql as drizzleSql } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'

export async function GET() {
  try {
    const user = await requireAuth()

    const rows = await db
      .select({
        id:             orgPayables.id,
        organizationId: orgPayables.organizationId,
        supplierId:     orgPayables.supplierId,
        categoryId:     orgPayables.categoryId,
        descricao:      orgPayables.descricao,
        valor:          orgPayables.valor,
        dataVencimento: orgPayables.dataVencimento,
        dataPagamento:  orgPayables.dataPagamento,
        categoria:      orgPayables.categoria,
        formaPagamento: orgPayables.formaPagamento,
        observacoes:    orgPayables.observacoes,
        createdAt:      orgPayables.createdAt,
        updatedAt:      orgPayables.updatedAt,
        fornecedor:     orgSuppliers.nome,
        status: drizzleSql<string>`
          CASE
            WHEN ${orgPayables.status} = 'pendente'
              AND ${orgPayables.dataVencimento} < CURRENT_DATE
            THEN 'atrasado'
            ELSE ${orgPayables.status}
          END
        `,
      })
      .from(orgPayables)
      .leftJoin(orgSuppliers, eq(orgSuppliers.id, orgPayables.supplierId))
      .where(eq(orgPayables.organizationId, user.organizationId))
      .orderBy(desc(orgPayables.dataVencimento))

    return NextResponse.json(rows.map(r => ({
      id:              r.id,
      organization_id: r.organizationId,
      supplier_id:     r.supplierId,
      category_id:     r.categoryId,
      descricao:       r.descricao,
      valor:           r.valor,
      data_vencimento: r.dataVencimento,
      data_pagamento:  r.dataPagamento,
      categoria:       r.categoria,
      forma_pagamento: r.formaPagamento,
      observacoes:     r.observacoes,
      status:          r.status,
      fornecedor:      r.fornecedor,
      created_at:      r.createdAt,
      updated_at:      r.updatedAt,
    })))
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[GET /api/financial/payables]', error); console.error('[GET /api/financial/payables]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const valor = parseFloat(String(body.valor || 0).replace(',', '.'))
    const supplierId = body.supplier_id && body.supplier_id !== 'sem-fornecedor'
      ? body.supplier_id
      : null
    const categoryId = body.category_id || null

    const [row] = await db
      .insert(orgPayables)
      .values({
        organizationId: user.organizationId,
        supplierId,
        categoryId,
        descricao:      body.descricao,
        valor:          String(valor),
        dataVencimento: body.data_vencimento,
        dataPagamento:  body.data_pagamento || null,
        status:         body.status || 'pendente',
        categoria:      body.categoria || null,
        formaPagamento: body.forma_pagamento || null,
        observacoes:    body.observacoes || null,
      })
      .returning()

    return NextResponse.json({
      id:              row.id,
      organization_id: row.organizationId,
      supplier_id:     row.supplierId,
      category_id:     row.categoryId,
      descricao:       row.descricao,
      valor:           row.valor,
      data_vencimento: row.dataVencimento,
      data_pagamento:  row.dataPagamento,
      categoria:       row.categoria,
      forma_pagamento: row.formaPagamento,
      observacoes:     row.observacoes,
      status:          row.status,
      created_at:      row.createdAt,
      updated_at:      row.updatedAt,
    }, { status: 201 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[POST /api/financial/payables]', error); console.error('[POST /api/financial/payables]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
