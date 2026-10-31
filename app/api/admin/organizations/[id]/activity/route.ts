import { NextResponse } from 'next/server'
import { requireMasterFast } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { adminLogs, orgDeletionLog } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

const RESOURCE_LABEL: Record<string, string> = {
  service_order: 'Ordem de serviço',
  client:        'Cliente',
  payable:       'Conta a pagar',
  receivable:    'Conta a receber',
  user:          'Usuário',
  service:       'Serviço',
  cashier:       'Caixa',
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireMasterFast()
    const { id } = await params

    try {
      const [adminRows, deletionRows] = await Promise.all([
        db
          .select()
          .from(adminLogs)
          .where(eq(adminLogs.resourceId, id))
          .orderBy(desc(adminLogs.createdAt))
          .limit(50),
        db
          .select()
          .from(orgDeletionLog)
          .where(eq(orgDeletionLog.organizationId, id))
          .orderBy(desc(orgDeletionLog.createdAt))
          .limit(50),
      ])

      const adminResult = adminRows.map((r) => ({
        id:            r.id,
        action:        r.action,
        resource_type: r.resourceType,
        resource_id:   r.resourceId,
        description:   r.description,
        admin_email:   r.adminEmail,
        details_json:  r.detailsJson,
        created_at:    r.createdAt,
      }))

      // Exclusões feitas pelos próprios usuários da organização — fonte
      // separada de admin_logs (que só cobre ações do painel master)
      const deletionResult = deletionRows.map((r) => {
        const label = RESOURCE_LABEL[r.resourceType] ?? r.resourceType
        const snapshot = r.snapshot as Record<string, unknown>
        // Cada tipo de recurso guarda um identificador amigável diferente no
        // snapshot (número da OS, nome do cliente/caixa, descrição da conta...)
        const identifier = snapshot?.numero != null
          ? `#${snapshot.numero}`
          : (snapshot?.nome ?? snapshot?.descricao ?? snapshot?.email ?? null)
        return {
          id:            r.id,
          action:        'deleted',
          resource_type: r.resourceType,
          resource_id:   r.resourceId,
          description:   identifier ? `${label} "${identifier}" excluído(a)` : `${label} excluído(a)`,
          admin_email:   r.userEmail,
          details_json:  snapshot,
          created_at:    r.createdAt,
        }
      })

      // Cada fonte já vem limitada a 50 — reaplica o limite depois do merge
      // pra garantir no máximo 50 linhas no total, não até 100
      const result = [...adminResult, ...deletionResult]
        .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
        .slice(0, 50)

      return NextResponse.json(result)
    } catch {
      return NextResponse.json([])
    }
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
