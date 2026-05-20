import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgClients, usageMetrics, organizations } from '@/lib/db/schema'
import { eq, desc, sql as drizzleSql } from 'drizzle-orm'
import { getPlanLimits, hasLifetimeLicense, limitExceededResponse } from '@/lib/plan-limits'
import { logServerError } from '@/lib/log-error'

export async function GET() {
  try {
    const user = await requireAuth()

    const clients = await db
      .select()
      .from(orgClients)
      .where(eq(orgClients.organizationId, user.organizationId))
      .orderBy(desc(orgClients.createdAt))

    return NextResponse.json(clients)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[GET /api/clients]', error); console.error('[GET /api/clients]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    // Verificar limite do plano (usa contador cumulativo — exclusões não resetam o limite)
    const [orgRows, limits, lifetime] = await Promise.all([
      db
        .select({ plan: organizations.plan, totalClientsEver: usageMetrics.totalClientsEver })
        .from(organizations)
        .leftJoin(usageMetrics, eq(usageMetrics.organizationId, organizations.id))
        .where(eq(organizations.id, user.organizationId))
        .limit(1),
      getPlanLimits(),
      hasLifetimeLicense(user.organizationId),
    ])

    const planRow = orgRows[0]
    if (!lifetime && planRow?.plan === 'free' && (planRow?.totalClientsEver ?? 0) >= limits.max_clients_free) {
      return NextResponse.json(
        limitExceededResponse('clientes', limits.max_clients_free),
        { status: 403 }
      )
    }

    const [newClient] = await db
      .insert(orgClients)
      .values({
        organizationId: user.organizationId,
        nome: body.nome,
        telefone: body.telefone || null,
        email: body.email || null,
        dataNascimento: body.data_nascimento || null,
        observacoes: body.observacoes || null,
        cep: body.cep || null,
        logradouro: body.logradouro || null,
        numero: body.numero || null,
        complemento: body.complemento || null,
        bairro: body.bairro || null,
        cidade: body.cidade || null,
        estado: body.estado || null,
      })
      .returning()

    // Atualizar métricas (incremento atômico)
    await db
      .update(usageMetrics)
      .set({
        clientsCount: drizzleSql`${usageMetrics.clientsCount} + 1`,
        totalClientsEver: drizzleSql`${usageMetrics.totalClientsEver} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(usageMetrics.organizationId, user.organizationId))

    return NextResponse.json(newClient, { status: 201 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[POST /api/clients]', error); console.error('[POST /api/clients]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
