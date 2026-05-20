/**
 * Drizzle ORM client — CRM Atelier
 *
 * IMPORTANTE: prepare: false é obrigatório para funcionar com pgBouncer do Supabase.
 * Sem isso as queries falham em produção no Vercel.
 *
 * DATABASE_URL deve apontar para a connection string direta (porta 5432),
 * não via pgBouncer (porta 6543).
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
    prepare: false, // obrigatório para Supabase pgBouncer (transaction mode)
  })
}

const queryClient =
  process.env.NODE_ENV === 'production'
    ? createQueryClient()
    : (global._drizzleClient ?? (global._drizzleClient = createQueryClient()))

export const db = drizzle(queryClient, { schema })

// Re-exporta o schema para facilitar imports
export * from './schema'
