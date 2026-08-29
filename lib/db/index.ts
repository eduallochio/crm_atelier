/**
 * Drizzle ORM client — CRM Atelier
 *
 * IMPORTANTE: prepare: false é obrigatório para funcionar com o pooler do Supabase (Supavisor).
 * Sem isso as queries falham em produção no Vercel.
 *
 * DATABASE_URL em produção deve apontar para o Transaction pooler (porta 6543),
 * não para a conexão direta (porta 5432) — conexão direta esgota rápido
 * o limite de conexões simultâneas do Postgres sob carga serverless.
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Previne múltiplas conexões em hot-reload do Next.js dev
declare global {
  // eslint-disable-next-line no-var
  var _drizzleClient: ReturnType<typeof postgres> | undefined
}

function createQueryClient() {
  return postgres(process.env.DATABASE_URL!, {
    prepare: false,   // obrigatório para pgBouncer transaction mode (porta 6543)
    max: 5,           // permite que queries paralelas (Promise.all) usem conexões distintas em vez de competir por um único socket
    connect_timeout: 10,
    idle_timeout: 20,
  })
}

const queryClient =
  process.env.NODE_ENV === 'production'
    ? createQueryClient()
    : (global._drizzleClient ?? (global._drizzleClient = createQueryClient()))

export const db = drizzle(queryClient, { schema })

// Re-exporta o schema para facilitar imports
export * from './schema'
