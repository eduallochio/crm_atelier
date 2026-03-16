import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getPool, sql } from '@/lib/db'

export async function GET() {
  try {
    const user = await requireAuth()
    const pool = await getPool()

    const servicesResult = await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(`
        SELECT id, nome, preco, ativo, categoria
        FROM org_services
        WHERE organization_id = @orgId
      `)

    const services = servicesResult.recordset
    if (services.length === 0) {
      return NextResponse.json({
        totalServices: 0,
        activeServices: 0,
        inactiveServices: 0,
        averagePrice: 0,
        mostUsedService: null,
        neverUsedCount: 0,
        categoriesCount: 0,
        serviceUsage: [],
      })
    }

    const serviceIds = services.map((s: Record<string, unknown>) => `'${s.id}'`).join(',')

    const usageResult = await pool
      .request()
      .query(`
        SELECT service_id, service_nome,
          SUM(quantidade) AS total_qty,
          SUM(valor_total) AS total_revenue
        FROM org_service_order_items
        WHERE service_id IN (${serviceIds})
        GROUP BY service_id, service_nome
      `)

    const usageMap = new Map<string, { nome: string; count: number; revenue: number }>()
    for (const row of usageResult.recordset) {
      usageMap.set(row.service_id, {
        nome: row.service_nome,
        count: row.total_qty,
        revenue: row.total_revenue,
      })
    }

    const totalServices = services.length
    const activeServices = services.filter((s: Record<string, unknown>) => s.ativo).length
    const inactiveServices = totalServices - activeServices
    const averagePrice = services.reduce((sum: number, s: Record<string, unknown>) => sum + ((s.preco as number) || 0), 0) / totalServices

    let mostUsedService: { id: string; nome: string; count: number; revenue: number } | null = null
    let maxCount = 0
    usageMap.forEach((usage, serviceId) => {
      if (usage.count > maxCount) {
        maxCount = usage.count
        mostUsedService = { id: serviceId, ...usage }
      }
    })

    const neverUsedCount = services.filter((s: Record<string, unknown>) => !usageMap.has(s.id as string)).length
    const categories = new Set(services.map((s: Record<string, unknown>) => s.categoria).filter(Boolean))

    const serviceUsage = Array.from(usageMap.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.count - a.count)

    return NextResponse.json({
      totalServices,
      activeServices,
      inactiveServices,
      averagePrice,
      mostUsedService,
      neverUsedCount,
      categoriesCount: categories.size,
      serviceUsage,
    })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[GET /api/services/stats]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
