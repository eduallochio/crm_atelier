import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgClients, orgServiceOrders } from '@/lib/db/schema'
import { eq, and, count, gte, isNotNull, ne, sql as drizzleSql } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'

export async function GET() {
  try {
    const user = await requireAuth()

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const currentMonth = now.getMonth() + 1

    const [
      [totalRow],
      [newThisMonthRow],
      [withPhoneRow],
      [withActiveOrdersRow],
      [birthdayRow],
    ] = await Promise.all([
      // Total clients
      db
        .select({ cnt: count() })
        .from(orgClients)
        .where(eq(orgClients.organizationId, user.organizationId)),

      // New this month
      db
        .select({ cnt: count() })
        .from(orgClients)
        .where(
          and(
            eq(orgClients.organizationId, user.organizationId),
            gte(orgClients.createdAt, startOfMonth)
          )
        ),

      // With phone
      db
        .select({ cnt: count() })
        .from(orgClients)
        .where(
          and(
            eq(orgClients.organizationId, user.organizationId),
            isNotNull(orgClients.telefone),
            ne(orgClients.telefone, '')
          )
        ),

      // With active orders (distinct client_id)
      db
        .select({ cnt: drizzleSql<number>`COUNT(DISTINCT ${orgServiceOrders.clientId})` })
        .from(orgServiceOrders)
        .where(
          and(
            eq(orgServiceOrders.organizationId, user.organizationId),
            drizzleSql`${orgServiceOrders.status} IN ('pendente', 'em_andamento')`
          )
        ),

      // Birthday this month
      db
        .select({ cnt: count() })
        .from(orgClients)
        .where(
          and(
            eq(orgClients.organizationId, user.organizationId),
            isNotNull(orgClients.dataNascimento),
            drizzleSql`EXTRACT(MONTH FROM ${orgClients.dataNascimento}) = ${currentMonth}`
          )
        ),
    ])

    return NextResponse.json({
      totalClients: Number(totalRow?.cnt ?? 0),
      newThisMonth: Number(newThisMonthRow?.cnt ?? 0),
      withPhone: Number(withPhoneRow?.cnt ?? 0),
      withActiveOrders: Number(withActiveOrdersRow?.cnt ?? 0),
      birthdayThisMonth: Number(birthdayRow?.cnt ?? 0),
    })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[GET /api/clients/stats]', error); console.error('[GET /api/clients/stats]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
