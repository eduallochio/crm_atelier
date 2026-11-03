import { db } from '@/lib/db'
import { adminSystemSettings, organizations } from '@/lib/db/schema'
import { eq, inArray } from 'drizzle-orm'

// CNPJs com licença vitalícia — referência histórica apenas. NUNCA remover estes
// valores (política do projeto — ver CLAUDE.md), mas também nunca usá-los para
// conceder a licença automaticamente: organizations.cnpj é um campo editável
// pelo próprio usuário, então usá-lo como prova de identidade permite que
// qualquer organização se auto-conceda a licença vitalícia (bug de segurança
// corrigido — ver auditoria de 2026-11-03). As duas organizações legítimas já
// têm lifetimeLicense = true setado diretamente no banco.
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
 * Checa exclusivamente o campo lifetimeLicense (setado manualmente no banco
 * por um admin) — nunca o CNPJ da organização, que é um campo editável pelo
 * próprio usuário e não pode ser usado como prova de identidade.
 * Licenças vitalícias têm acesso enterprise ilimitado sem mensalidade.
 */
export async function hasLifetimeLicense(organizationId: string): Promise<boolean> {
  try {
    const [org] = await db
      .select({ lifetimeLicense: organizations.lifetimeLicense })
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1)

    return org?.lifetimeLicense ?? false
  } catch {
    return false
  }
}

/** Retorna uma resposta de erro 403 padronizada para limite atingido. */
export function limitExceededResponse(resource: string, limit: number) {
  return {
    error: `Limite do plano Free atingido: máximo de ${limit} ${resource}. Faça upgrade para o plano Pro para continuar.`,
  }
}

/**
 * Bloqueia acesso de organizações no plano Free a módulos exclusivos do Pro+
 * (financeiro, caixa, estoque). Lança 'FORBIDDEN' — mesmo padrão já usado nas
 * rotas de estoque — para o catch de cada rota converter em 403.
 */
export async function requireProPlan(organizationId: string): Promise<void> {
  const [org] = await db
    .select({ plan: organizations.plan, lifetimeLicense: organizations.lifetimeLicense })
    .from(organizations)
    .where(eq(organizations.id, organizationId))
  // org.lifetimeLicense já é a mesma coluna que hasLifetimeLicense() consultaria
  // de novo — evita um segundo round-trip ao banco por request em rotas de
  // alto tráfego (financeiro/caixa)
  if (org?.plan === 'free' && !org?.lifetimeLicense) {
    throw new Error('FORBIDDEN')
  }
}
