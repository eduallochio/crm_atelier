'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreVertical, Eye, Download } from 'lucide-react'
import { AuditLog } from '@/types/audit'

interface LogsTableProps {
  logs: AuditLog[]
}

const actionConfig = {
  create: { label: 'Criação', variant: 'default' as const, color: 'bg-green-500' },
  update: { label: 'Atualização', variant: 'secondary' as const, color: 'bg-blue-500' },
  delete: { label: 'Exclusão', variant: 'destructive' as const, color: 'bg-red-500' },
  login: { label: 'Login', variant: 'outline' as const, color: 'bg-gray-500' },
  logout: { label: 'Logout', variant: 'outline' as const, color: 'bg-gray-500' },
  export: { label: 'Exportação', variant: 'secondary' as const, color: 'bg-purple-500' },
}

export function LogsTable({ logs }: LogsTableProps) {
  const hasData = logs.length > 0

  const handleViewDetails = (logId: string) => {
    // TODO: Implementar modal com detalhes completos
    console.log('Ver detalhes:', logId)
  }

  const handleExportLog = (logId: string) => {
    // TODO: Implementar exportação individual
    console.log('Exportar log:', logId)
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Histórico de Ações</h3>
          <p className="text-sm text-muted-foreground">
            {hasData ? `${logs.length} registros encontrados` : 'Nenhum registro encontrado'}
          </p>
        </div>
      </div>

      {hasData ? (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 text-sm font-medium">Data/Hora</th>
                  <th className="text-left p-4 text-sm font-medium">Admin</th>
                  <th className="text-left p-4 text-sm font-medium">Ação</th>
                  <th className="text-left p-4 text-sm font-medium">Recurso</th>
                  <th className="text-left p-4 text-sm font-medium">Detalhes</th>
                  <th className="text-left p-4 text-sm font-medium">IP</th>
                  <th className="text-right p-4 text-sm font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map((log) => {
                  const action = actionConfig[log.action]
                  return (
                    <tr key={log.id} className="hover:bg-muted/50 transition-colors">
                      <td className="p-4 text-sm">
                        <div className="font-medium">
                          {new Date(log.timestamp).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-sm">{log.admin.name}</div>
                        <div className="text-xs text-muted-foreground">{log.admin.email}</div>
                      </td>
                      <td className="p-4">
                        <Badge variant={action.variant}>{action.label}</Badge>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-sm">{log.resource}</div>
                        {log.resourceId && (
                          <div className="text-xs text-muted-foreground font-mono">
                            {log.resourceId.substring(0, 8)}...
                          </div>
                        )}
                      </td>
                      <td className="p-4 max-w-md">
                        <p className="text-sm truncate" title={log.details}>
                          {log.details}
                        </p>
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-mono">{log.ip}</div>
                      </td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(log.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExportLog(log.id)}>
                              <Download className="h-4 w-4 mr-2" />
                              Exportar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-muted rounded-lg p-12 text-center">
          <p className="text-muted-foreground">
            Nenhum log encontrado com os filtros selecionados
          </p>
        </div>
      )}
    </Card>
  )
}
