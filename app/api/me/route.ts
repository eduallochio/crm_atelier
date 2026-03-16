import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getPool, sql } from '@/lib/db'

export async function GET() {
  try {
    const user = await requireAuth()
    const pool = await getPool()

    // Buscar dados da organização
    const orgResult = await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(`SELECT name, logo_url FROM organizations WHERE id = @orgId`)

    const org = orgResult.recordset[0]

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const currentMonth = today.getMonth() + 1

    // Ordens ATRASADAS (data_prevista < hoje, ainda abertas)
    const overdueOrdersResult = await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .input('today', sql.Date, today)
      .query(`
        SELECT COUNT(*) AS cnt
        FROM org_service_orders
        WHERE organization_id = @orgId
          AND status IN ('pendente', 'em_andamento')
          AND data_prevista IS NOT NULL
          AND CAST(data_prevista AS DATE) < @today
      `)

    // Contas a pagar vencidas (status pendente, vencimento < hoje)
    const overduePayablesResult = await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .input('today', sql.Date, today)
      .query(`
        SELECT COUNT(*) AS cnt
        FROM org_payables
        WHERE organization_id = @orgId
          AND status = 'pendente'
          AND CAST(data_vencimento AS DATE) < @today
      `)

    // Contas a receber vencidas (status pendente, vencimento < hoje)
    const overdueReceivablesResult = await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .input('today', sql.Date, today)
      .query(`
        SELECT COUNT(*) AS cnt
        FROM org_receivables
        WHERE organization_id = @orgId
          AND status = 'pendente'
          AND CAST(data_vencimento AS DATE) < @today
      `)

    // Aniversários do mês (informativo)
    const birthdayResult = await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .input('month', sql.Int, currentMonth)
      .query(`
        SELECT COUNT(*) AS cnt
        FROM org_clients
        WHERE organization_id = @orgId
          AND data_nascimento IS NOT NULL
          AND MONTH(data_nascimento) = @month
      `)

    const overdueOrders     = overdueOrdersResult.recordset[0]?.cnt || 0
    const overduePayables   = overduePayablesResult.recordset[0]?.cnt || 0
    const overdueReceivables = overdueReceivablesResult.recordset[0]?.cnt || 0
    const birthdays         = birthdayResult.recordset[0]?.cnt || 0

    return NextResponse.json({
      name: user.name,
      email: user.email,
      organizationName: org?.name || 'Meu Atelier',
      logoUrl: org?.logo_url || null,
      // Badges informativos (azul/indigo)
      badges: {
        '/clientes': birthdays,
      },
      // Alertas urgentes (vermelho)
      alerts: {
        '/ordens-servico':     overdueOrders,
        '/financeiro':         overduePayables + overdueReceivables,
        '/financeiro/pagar':   overduePayables,
        '/financeiro/receber': overdueReceivables,
      },
    })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[GET /api/me]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
