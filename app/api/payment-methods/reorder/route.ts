import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgPaymentMethods } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const methods: { id: string; display_order: number }[] = Array.isArray(body) ? body : []

    for (const { id, display_order } of methods) {
      await db
        .update(orgPaymentMethods)
        .set({ sortOrder: display_order })
        .where(
          and(
            eq(orgPaymentMethods.id, id),
            eq(orgPaymentMethods.organizationId, user.organizationId)
          )
        )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[POST /api/payment-methods/reorder]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
