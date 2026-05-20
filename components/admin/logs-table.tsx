'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, Download } from 'lucide-react'

export interface AdminLogRow {
  id: string
  action: string
  resource_type: string | null
  resource_id: string | null
  description: string
  admin_email: string | null
  details: Record<string, unknown> | null
  created_at: string | Date | null
}

interface LogsTableProps {
  logs: AdminLogRow[]
}

const actionVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  create:          'default',
  update:          'secondary',
  delete:          'destructive',
  plan_change:     'secondary',
  state_change:    'outline',
  login:           'outline',
  logout:          'outline',
  export:          'secondary',
}

function LogDetailModal({ log, onClose }: { log: AdminLogRow; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="text-base font-semibold">Detalhes do Log</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">×</button>
        </div>
        <div className="p-5 space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Ação</p>
              <Badge variant={actionVariant[log.action] ?? 'secondary'}>{log.action}</Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Data</p>
              <p className="font-medium">{log.created_at ? new Date(log.created_at).toLocaleString('pt-BR') : '—'}</p>
            </div>
            {log.admin_email && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Admin</p>
                <p className="font-medium">{log.admin_email}</p>
              </div>
            )}
            {log.resource_type && (
              <div>
                <p className="text-xs text-muted-foreground">Recurso</p>
                <p className="font-medium">{log.resource_type}</p>
              </div>
            )}
            {log.resource_id && (
              <div>
                <p className="text-xs text-muted-foreground">ID do Recurso</p>
                <p className="font-mono text-xs break-all">{log.resource_id}</p>
              </div>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Descrição</p>
            <p>{log.description}</p>
          </div>
          {log.details && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Dados Adicionais</p>
              <pre className="bg-muted rounded-md p-3 text-xs overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(log.details, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function LogsTable({ logs }: LogsTableProps) {
  const [selectedLog, setSelectedLog] = useState<AdminLogRow | null>(null)

  function exportLog(log: AdminLogRow) {
    const content = JSON.stringify(log, null, 2)
    const blob = new Blob([content], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `log-${log.id.slice(0, 8)}-${new Date(log.created_at ?? '').toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Histórico de Ações</h3>
            <p className="text-sm text-muted-foreground">
              {logs.length > 0 ? `${logs.length} registros encontrados` : 'Nenhum registro encontrado'}
            </p>
          </div>
        </div>

        {logs.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium">Data/Hora</th>
                    <th className="text-left p-4 text-sm font-medium">Admin</th>
                    <th className="text-left p-4 text-sm font-medium">Ação</th>
                    <th className="text-left p-4 text-sm font-medium">Recurso</th>
                    <th className="text-left p-4 text-sm font-medium">Descrição</th>
                    <th className="text-right p-4 text-sm font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/50 transition-colors">
                      <td className="p-4 text-sm">
                        <div className="font-medium">
                          {log.created_at ? new Date(log.created_at).toLocaleDateString('pt-BR') : '—'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {log.created_at ? new Date(log.created_at).toLocaleTimeString('pt-BR') : ''}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {log.admin_email ?? '—'}
                      </td>
                      <td className="p-4">
                        <Badge variant={actionVariant[log.action] ?? 'secondary'}>{log.action}</Badge>
                      </td>
                      <td className="p-4 text-sm">
                        {log.resource_type && (
                          <div className="font-medium">{log.resource_type}</div>
                        )}
                        {log.resource_id && (
                          <div className="text-xs text-muted-foreground font-mono">
                            {log.resource_id.substring(0, 8)}…
                          </div>
                        )}
                      </td>
                      <td className="p-4 max-w-[240px]">
                        <p className="text-sm truncate" title={log.description}>{log.description}</p>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setSelectedLog(log)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => exportLog(log)}>
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-muted rounded-lg p-12 text-center">
            <p className="text-muted-foreground">Nenhum log encontrado com os filtros selecionados</p>
          </div>
        )}
      </Card>

      {selectedLog && (
        <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </>
  )
}
