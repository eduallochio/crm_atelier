import { Header } from '@/components/layouts/header'
import { LogsTable } from '@/components/admin/logs-table'
import { LogsFilters } from '@/components/admin/logs-filters'
import { AuditLog } from '@/types/audit'

export default function AdminLogsPage() {
  // TODO: Substituir por hooks reais:
  // const { logs, filters, setFilters, isLoading } = useAuditLogs()

  const logs: AuditLog[] = []

  return (
    <div>
      <Header
        title="Logs de Auditoria"
        description="Histórico completo de ações no sistema"
      />

      <div className="p-6 space-y-6">
        {/* Filtros */}
        <LogsFilters />

        {/* Tabela de Logs */}
        <LogsTable logs={logs} />
      </div>
    </div>
  )
}
