import { NextResponse } from 'next/server'
import { requireAuth, assertPermission } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgStockEntries, orgStockEntryItems, organizations, orgProducts } from '@/lib/db/schema'
import { eq, desc, inArray, and } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'
import { hasLifetimeLicense } from '@/lib/plan-limits'

async function checkPlan(organizationId: string) {
  const [org] = await db
    .select({ plan: organizations.plan, lifetimeLicense: organizations.lifetimeLicense })
    .from(organizations)
    .where(eq(organizations.id, organizationId))
  if (org?.plan === 'free' && !org?.lifetimeLicense && !(await hasLifetimeLicense(organizationId))) {
    throw new Error('FORBIDDEN')
  }
}

export async function GET() {
  let organizationId: string | undefined
  try {
    const user = await requireAuth()
    assertPermission(user, 'estoque')
    organizationId = user.organizationId
    await checkPlan(user.organizationId)

    const entries = await db
      .select()
      .from(orgStockEntries)
      .where(eq(orgStockEntries.organizationId, user.organizationId))
      .orderBy(desc(orgStockEntries.createdAt))

    const items = entries.length > 0
      ? await db
          .select()
          .from(orgStockEntryItems)
          .where(
            eq(
              orgStockEntryItems.entryId,
              // fetch all items for this org's entries via subquery-free approach
              // We'll filter in JS since Drizzle doesn't easily support IN(subquery) without raw
              orgStockEntryItems.entryId
            )
          )
          .then(async () => {
            // Fetch items for all entry ids
            const entryIds = entries.map(e => e.id)
            if (!entryIds.length) return []
            // Use individual queries batched — Drizzle inList
            const { inArray } = await import('drizzle-orm')
            return db
              .select()
              .from(orgStockEntryItems)
              .where(inArray(orgStockEntryItems.entryId, entryIds))
          })
      : []

    const entriesWithItems = entries.map(e => ({
      ...e,
      itens: items.filter(i => i.entryId === e.id),
    }))

    return NextResponse.json(entriesWithItems.map(e => ({
      id:              e.id,
      organization_id: e.organizationId,
      supplier_id:     e.supplierId,
      tipo:            e.tipo,
      observacoes:     e.observacoes,
      created_at:      e.createdAt,
      itens: e.itens.map(i => ({
        id:              i.id,
        entry_id:        i.entryId,
        product_id:      i.productId,
        produto_nome:    i.produtoNome,
        quantidade:      Number(i.quantidade ?? 0),
        unidade:         i.unidade,
        preco_unitario:  i.precoUnitario != null ? Number(i.precoUnitario) : null,
        preco_total:     i.precoTotal != null ? Number(i.precoTotal) : null,
      })),
    })))
  } catch (error) {
    const msg = (error as Error).message
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    if (msg === 'FORBIDDEN') return NextResponse.json({ error: 'Recurso disponível apenas no plano pago' }, { status: 403 })
    logServerError('[GET /api/inventory/entries]', error, undefined, organizationId); console.error('[GET /api/inventory/entries]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  let organizationId: string | undefined
  try {
    const user = await requireAuth()
    assertPermission(user, 'estoque')
    organizationId = user.organizationId
    await checkPlan(user.organizationId)

    const body = await request.json()
    const {
      tipo = 'entrada',
      supplier_id: supplierId,
      observacoes,
      itens = [],
    } = body

    if (!itens.length) return NextResponse.json({ error: 'Ao menos um item é obrigatório' }, { status: 400 })

    // Valida que os produtos referenciados existem e pertencem a esta org —
    // sem esse filtro, um product_id de outra organização passaria e o
    // trigger do banco atualizaria estoque alheio (e a resposta abaixo
    // devolveria nome/saldo de produto de outro tenant)
    const productIdsToValidate = itens.map((i: { product_id?: string }) => i.product_id).filter(Boolean)
    if (productIdsToValidate.length) {
      const products = await db
        .select({ id: orgProducts.id })
        .from(orgProducts)
        .where(and(inArray(orgProducts.id, productIdsToValidate), eq(orgProducts.organizationId, user.organizationId)))
      if (products.length !== new Set(productIdsToValidate).size) {
        return NextResponse.json({ error: 'Um ou mais produtos não encontrados' }, { status: 400 })
      }
    }

    // Quantidade deve ser positiva — mesma classe de bug corrigida em exits:
    // um valor negativo faria a entrada diminuir o estoque em vez de aumentar,
    // enquanto é auditada como uma "entrada"
    for (const item of itens as { quantidade: number }[]) {
      if (!Number.isFinite(Number(item.quantidade)) || Number(item.quantidade) <= 0) {
        return NextResponse.json({ error: 'Quantidade deve ser maior que zero' }, { status: 400 })
      }
    }

    const { entry, insertedItems, updatedProducts } = await db.transaction(async (tx) => {
      const [entry] = await tx
        .insert(orgStockEntries)
        .values({
          organizationId: user.organizationId,
          supplierId: supplierId || null,
          tipo,
          observacoes: observacoes ?? null,
        })
        .returning()

      const insertedItems = await tx
        .insert(orgStockEntryItems)
        .values(
          itens.map((item: {
            product_id?: string
            produto_nome?: string
            quantidade: number
            unidade?: string
            preco_unitario?: number
            preco_total?: number
          }) => ({
            entryId: entry.id,
            // product_id pode chegar como string vazia do <select> sem seleção —
            // coluna é uuid, '' quebra o insert (Postgres rejeita como UUID inválido)
            productId: item.product_id || null,
            // produto_nome é NOT NULL sem default no banco — o formulário
            // sempre exige esse campo antes de submeter, mas usa fallback
            // seguro aqui também (API não deve confiar só na validação do client)
            produtoNome: item.produto_nome || '',
            quantidade: Number(item.quantidade),
            unidade: item.unidade || 'un',
            precoUnitario: item.preco_unitario != null ? String(item.preco_unitario) : null,
            precoTotal: item.preco_total != null ? String(item.preco_total) : null,
          }))
        )
        .returning()

      // O saldo do produto já é atualizado automaticamente por um trigger no
      // banco (update_product_quantity, AFTER INSERT em org_stock_entry_items)
      // — não soma aqui de novo, senão duplica o efeito. Já roda AFTER INSERT,
      // então o saldo abaixo já reflete o trigger
      const productIds = [...new Set(insertedItems.map(i => i.productId).filter((id): id is string => !!id))]
      const updatedProducts = productIds.length > 0
        ? await tx
            .select({ id: orgProducts.id, nome: orgProducts.nome, quantidadeAtual: orgProducts.quantidadeAtual })
            .from(orgProducts)
            .where(inArray(orgProducts.id, productIds))
        : []

      return { entry, insertedItems, updatedProducts }
    })

    return NextResponse.json({
      id:              entry.id,
      organization_id: entry.organizationId,
      supplier_id:     entry.supplierId,
      tipo:            entry.tipo,
      observacoes:     entry.observacoes,
      created_at:      entry.createdAt,
      itens: insertedItems.map(i => ({
        id:             i.id,
        entry_id:       i.entryId,
        product_id:     i.productId,
        produto_nome:   i.produtoNome,
        quantidade:     Number(i.quantidade ?? 0),
        unidade:        i.unidade,
        preco_unitario: i.precoUnitario != null ? Number(i.precoUnitario) : null,
        preco_total:    i.precoTotal != null ? Number(i.precoTotal) : null,
      })),
      // Saldo já atualizado (pelo trigger) de cada produto afetado — usado
      // pelo frontend para mostrar o novo saldo no toast de confirmação
      updated_products: updatedProducts.map(p => ({
        id: p.id,
        nome: p.nome,
        quantidade_atual: Number(p.quantidadeAtual ?? 0),
      })),
    }, { status: 201 })
  } catch (error) {
    const msg = (error as Error).message
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    if (msg === 'FORBIDDEN') return NextResponse.json({ error: 'Recurso disponível apenas no plano pago' }, { status: 403 })
    logServerError('[POST /api/inventory/entries]', error, undefined, organizationId); console.error('[POST /api/inventory/entries]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
