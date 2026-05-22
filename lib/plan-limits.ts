import { db } from '@/lib/db'
import { adminSystemSettings, organizations } from '@/lib/db/schema'
import { eq, inArray } from 'drizzle-orm'

// CNPJs com licença vitalícia — sem mensalidade, sem limites, plano enterprise permanente
const LIFETIME_CNPJS = new Set([
  '33065719000160', // empresa 1 — desenvolvimento
  '27791182000112', // empresa 2 — parceiro
])

export interface PlanLimits {
  max_clients_free:  number
  max_services_free: number
  max_orders_free:   number
  max_users_free:    number
  max_clients_pro:   number
  max_services_pro:  number
  max_orders_pro:    number
  max_users_pro:     number
}

const DEFAULTS: PlanLimits = {
  max_clients_free:  50,
  max_services_free: 20,
  max_orders_free:   100,
  max_users_free:    2,
  max_clients_pro:   999999, // ilimitado
  max_services_pro:  999999,
  max_orders_pro:    999999,
  max_users_pro:     3,
}

let cached: { limits: PlanLimits; at: number } | null = null
const CACHE_TTL_MS = 60_000

export async function getPlanLimits(): Promise<PlanLimits> {
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.limits

  try {
    const rows = await db
      .select({ key: adminSystemSettings.key, value: adminSystemSettings.value })
      .from(adminSystemSettings)
      .where(
        inArray(adminSystemSettings.key, [
          'max_clients_free',
          'max_services_free',
          'max_orders_free',
          'max_users_free',
          'max_clients_pro',
          'max_services_pro',
          'max_orders_pro',
          'max_users_pro',
        ])
      )

    const limits: PlanLimits = { ...DEFAULTS }
    for (const row of rows) {
      const val = parseInt(row.value)
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

/**
 * Verifica se uma organização tem licença vitalícia.
 * Checa tanto o campo lifetime_license quanto a lista de CNPJs hardcoded.
 * Licenças vitalícias têm acesso enterprise ilimitado sem mensalidade.
 */
export async function hasLifetimeLicense(organizationId: string): Promise<boolean> {
  try {
    const [org] = await db
      .select({ lifetimeLicense: organizations.lifetimeLicense, cnpj: organizations.cnpj })
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1)

    if (!org) return false
    if (org.lifetimeLicense) return true

    const cnpjDigits = org.cnpj?.replace(/\D/g, '') ?? ''
    return LIFETIME_CNPJS.has(cnpjDigits)
  } catch {
    return false
  }
}

/**
 * Retorna o plano efetivo da organização considerando licença vitalícia.
 * Licenças vitalícias sempre retornam 'enterprise' independente do plano cadastrado.
 */
export async function getEffectivePlan(organizationId: string, rawPlan: string): Promise<string> {
  if (await hasLifetimeLicense(organizationId)) return 'enterprise'
  return rawPlan
}

/** Retorna uma resposta de erro 403 padronizada para limite atingido. */
export function limitExceededResponse(resource: string, limit: number) {
  return {
    error: `Limite do plano Free atingido: máximo de ${limit} ${resource}. Faça upgrade para o plano Pro para continuar.`,
  }
}
