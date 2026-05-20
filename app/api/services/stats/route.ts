import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { orgServices, orgServiceOrderItems } from '@/lib/db/schema'
import { eq, inArray, sql as drizzleSql } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth/session'

export async function GET() {
  try {
    const user = await requireAuth()

    const services = await db
      .select({
        id:       orgServices.id,
        nome:     orgServices.nome,
        preco:    orgServices.preco,
        ativo:    orgServices.ativo,
        categoria: orgServices.categoria,
      })
      .from(orgServices)
      .where(eq(orgServices.organizationId, user.organizationId))

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

    const serviceIds = services.map(s => s.id)

    const usageRows = await db
      .select({
        serviceId:    orgServiceOrderItems.serviceId,
        serviceNome:  orgServiceOrderItems.serviceNome,
        totalQty:     drizzleSql<number>`sum(${orgServiceOrderItems.quantidade})`,
        totalRevenue: drizzleSql<number>`sum(${orgServiceOrderItems.valorTotal})`,
      })
      .from(orgServiceOrderItems)
      .where(inArray(orgServiceOrderItems.serviceId, serviceIds))
      .groupBy(orgServiceOrderItems.serviceId, orgServiceOrderItems.serviceNome)

    const usageMap = new Map<string, { nome: string; count: number; revenue: number }>()
    for (const row of usageRows) {
      if (row.serviceId) {
        usageMap.set(row.serviceId, {
          nome:    row.serviceNome,
          count:   Number(row.totalQty) || 0,
          revenue: Number(row.totalRevenue) || 0,
        })
      }
    }

    const totalServices = services.length
    const activeServices = services.filter(s => s.ativo).length
    const inactiveServices = totalServices - activeServices
    const averagePrice = services.reduce((sum, s) => sum + (Number(s.preco) || 0), 0) / totalServices

    let mostUsedService: { id: string; nome: string; count: number; revenue: number } | null = null
    let maxCount = 0
    usageMap.forEach((usage, serviceId) => {
      if (usage.count > maxCount) {
        maxCount = usage.count
        mostUsedService = { id: serviceId, ...usage }
      }
    })

    const neverUsedCount = services.filter(s => !usageMap.has(s.id)).length
    const categories = new Set(services.map(s => s.categoria).filter(Boolean))

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
