import { getPool } from '@/lib/db'

export interface PlanLimits {
  max_clients_free: number
  max_services_free: number
  max_orders_free: number
  max_users_free: number
}

const DEFAULTS: PlanLimits = {
  max_clients_free: 50,
  max_services_free: 20,
  max_orders_free: 100,
  max_users_free: 3,
}

let cached: { limits: PlanLimits; at: number } | null = null
const CACHE_TTL_MS = 60_000 // 1 minuto

/**
 * Retorna os limites do plano Free lidos do admin_system_settings.
 * Os valores são configuráveis pelo admin e ficam em cache por 1 minuto.
 */
export async function getPlanLimits(): Promise<PlanLimits> {
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.limits

  try {
    const pool = await getPool()
    const result = await pool.request().query(`
      SELECT [key], value FROM admin_system_settings
      WHERE [key] IN (
        'max_clients_free','max_services_free','max_orders_free','max_users_free'
      )
    `)

    const limits: PlanLimits = { ...DEFAULTS }
    for (const row of result.recordset) {
      const val = parseInt(row.value as string)
      if (!isNaN(val) && val > 0) {
        limits[row.key as keyof PlanLimits] = val
      }
    }

    cached = { limits, at: Date.now() }
    return limits
  } catch {
    return DEFAULTS
  }
}

/** Retorna uma resposta de erro 403 padronizada para limite atingido. */
export function limitExceededResponse(resource: string, limit: number) {
  return {
    error: `Limite do plano Free atingido: máximo de ${limit} ${resource}. Faça upgrade para o plano Pro para continuar.`,
  }
}
