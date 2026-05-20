import { db } from '@/lib/db'
import { adminLogs } from '@/lib/db/schema'

interface LogParams {
  action: string
  resourceType?: string
  resourceId?: string
  description: string
  adminEmail?: string
  details?: Record<string, unknown>
}

/**
 * Registra uma ação admin na tabela admin_logs.
 * Nunca lança erro — falha silenciosamente para não interromper a operação principal.
 */
export async function logAdminAction(params: LogParams): Promise<void> {
  try {
    await db.insert(adminLogs).values({
      action: params.action,
      resourceType: params.resourceType ?? null,
      resourceId: params.resourceId ?? null,
      description: params.description,
      adminEmail: params.adminEmail ?? null,
      detailsJson: params.details ?? null,
    })
  } catch {
    // Falha silenciosa — logs nunca devem quebrar a operação principal
  }
}
