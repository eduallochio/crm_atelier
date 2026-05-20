import { db } from '@/lib/db'
import { adminErrorLogs } from '@/lib/db/schema'

/**
 * Loga um erro de servidor na tabela admin_error_logs.
 * Silencioso — nunca lança exceção para não quebrar a resposta original.
 */
export async function logServerError(
  context: string,
  error: unknown,
  extra?: Record<string, unknown>
) {
  try {
    const err = error instanceof Error ? error : new Error(String(error))
    // Ignora erros de negócio esperados
    if (err.message === 'UNAUTHORIZED' || err.message === 'FORBIDDEN') return

    await db.insert(adminErrorLogs).values({
      message:   `[${context}] ${err.message}`.slice(0, 2000),
      stack:     err.stack?.slice(0, 5000) ?? null,
      errorType: 'server',
      severity:  'error',
      extra:     extra ?? null,
    })
  } catch {
    // nunca propaga
  }
}
