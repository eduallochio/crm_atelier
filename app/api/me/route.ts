import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { organizations, orgServiceOrders, orgPayables, orgReceivables, orgClients } from '@/lib/db/schema'
import { eq, and, count, isNotNull, lt, sql as drizzleSql } from 'drizzle-orm'

export async function GET() {
  try {
    const user = await requireAuth()

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const currentMonth = today.getMonth() + 1

    const [
      orgRows,
      [overdueOrdersRow],
      [overduePayablesRow],
      [overdueReceivablesRow],
      [birthdayRow],
    ] = await Promise.all([
      // Organization name + logo
      db
        .select({ name: organizations.name, logoUrl: organizations.logoUrl })
        .from(organizations)
        .where(eq(organizations.id, user.organizationId))
        .limit(1),

      // Overdue service orders (open + past dataPrevista)
      db
        .select({ cnt: count() })
        .from(orgServiceOrders)
        .where(
          and(
            eq(orgServiceOrders.organizationId, user.organizationId),
            drizzleSql`${orgServiceOrders.status} IN ('pendente', 'em_andamento')`,
            isNotNull(orgServiceOrders.dataPrevista),
            lt(orgServiceOrders.dataPrevista, today.toISOString().slice(0, 10))
          )
        ),

      // Overdue payables (pendente + past dataVencimento)
      db
        .select({ cnt: count() })
        .from(orgPayables)
        .where(
          and(
            eq(orgPayables.organizationId, user.organizationId),
            eq(orgPayables.status, 'pendente'),
            lt(orgPayables.dataVencimento, today.toISOString().slice(0, 10))
          )
        ),

      // Overdue receivables (pendente + past dataVencimento)
      db
        .select({ cnt: count() })
        .from(orgReceivables)
        .where(
          and(
            eq(orgReceivables.organizationId, user.organizationId),
            eq(orgReceivables.status, 'pendente'),
            lt(orgReceivables.dataVencimento, today.toISOString().slice(0, 10))
          )
        ),

      // Birthdays this month
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

    const org = orgRows[0]
    const overdueOrders      = Number(overdueOrdersRow?.cnt ?? 0)
    const overduePayables    = Number(overduePayablesRow?.cnt ?? 0)
    const overdueReceivables = Number(overdueReceivablesRow?.cnt ?? 0)
    const birthdays          = Number(birthdayRow?.cnt ?? 0)

    const response = NextResponse.json({
      name: user.name,
      email: user.email,
      organizationName: org?.name ?? 'Meu Atelier',
      logoUrl: org?.logoUrl ?? null,
      badges: {
        '/clientes': birthdays,
      },
      alerts: {
        '/ordens-servico':     overdueOrders,
        '/financeiro':         overduePayables + overdueReceivables,
        '/financeiro/pagar':   overduePayables,
        '/financeiro/receber': overdueReceivables,
      },
    })

    // Cache privado por 60s — evita 5 queries ao banco por navegação
    response.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=30')
    return response
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[GET /api/me]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
