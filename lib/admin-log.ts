import { getPool, sql } from '@/lib/db'

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
    const pool = await getPool()
    await pool
      .request()
      .input('action', sql.NVarChar, params.action)
      .input('resource_type', sql.NVarChar, params.resourceType ?? null)
      .input('resource_id', sql.NVarChar, params.resourceId ?? null)
      .input('description', sql.NVarChar, params.description)
      .input('admin_email', sql.NVarChar, params.adminEmail ?? null)
      .input('details_json', sql.NVarChar, params.details ? JSON.stringify(params.details) : null)
      .query(`
        INSERT INTO admin_logs (action, resource_type, resource_id, description, admin_email, details_json)
        VALUES (@action, @resource_type, @resource_id, @description, @admin_email, @details_json)
      `)
  } catch {
    // Falha silenciosa — logs nunca devem quebrar a operação principal
  }
}
