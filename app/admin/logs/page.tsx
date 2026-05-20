'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, RefreshCw, FileText, Calendar, Eye, Download } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface AdminLog {
  id: string
  action: string
  resource_type: string | null
  resource_id: string | null
  description: string
  admin_email: string | null
  details: Record<string, unknown> | null
  created_at: string
}

const ACTION_COLORS: Record<string, string> = {
  CREATE:      'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  UPDATE:      'bg-blue-500/20 text-blue-400 border-blue-500/30',
  DELETE:      'bg-red-500/20 text-red-400 border-red-500/30',
  SUSPEND:     'bg-amber-500/20 text-amber-400 border-amber-500/30',
  REACTIVATE:  'bg-teal-500/20 text-teal-400 border-teal-500/30',
  CANCEL:      'bg-rose-500/20 text-rose-400 border-rose-500/30',
  CHANGE_PLAN: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  LOGIN:       'bg-sky-500/20 text-sky-400 border-sky-500/30',
}

const ACTION_LABELS: Record<string, string> = {
  CREATE:      'Criação',
  UPDATE:      'Atualização',
  DELETE:      'Exclusão',
  SUSPEND:     'Suspensão',
  REACTIVATE:  'Reativação',
  CANCEL:      'Cancelamento',
  CHANGE_PLAN: 'Mudança de Plano',
  LOGIN:       'Login',
}

function ActionBadge({ action }: { action: string }) {
  const color = ACTION_COLORS[action] ?? 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
  const label = ACTION_LABELS[action] ?? action
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium ${color}`}>
      {label}
    </span>
  )
}

function LogDetailModal({ log, onClose }: { log: AdminLog; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl">
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Detalhes do Log</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white text-xl leading-none">×</button>
        </div>
        <div className="p-5 space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-zinc-500 mb-1">Ação</p>
              <ActionBadge action={log.action} />
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-1">Data/Hora</p>
              <p className="text-zinc-300 font-medium">
                {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
              </p>
            </div>
            {log.admin_email && (
              <div className="col-span-2">
                <p className="text-xs text-zinc-500 mb-1">Admin</p>
                <p className="text-zinc-300 font-medium">{log.admin_email}</p>
              </div>
            )}
            {log.resource_type && (
              <div>
                <p className="text-xs text-zinc-500 mb-1">Recurso</p>
                <p className="text-zinc-300">{log.resource_type}</p>
              </div>
            )}
            {log.resource_id && (
              <div>
                <p className="text-xs text-zinc-500 mb-1">ID</p>
                <p className="text-zinc-400 font-mono text-xs break-all">{log.resource_id}</p>
              </div>
            )}
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-1">Descrição</p>
            <p className="text-zinc-300">{log.description}</p>
          </div>
          {log.details && (
            <div>
              <p className="text-xs text-zinc-500 mb-1">Dados Adicionais</p>
              <pre className="bg-zinc-800 rounded-md p-3 text-xs text-zinc-300 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(log.details, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function exportLogJson(log: AdminLog) {
  const blob = new Blob([JSON.stringify(log, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `log-${log.id.slice(0, 8)}-${new Date(log.created_at).toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AdminLog[]>([])
  const [availableActions, setAvailableActions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterAction, setFilterAction] = useState('')
  const [since, setSince] = useState('')
  const [selectedLog, setSelectedLog] = useState<AdminLog | null>(null)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search)       params.set('search', search)
      if (filterAction) params.set('action', filterAction)
      if (since)        params.set('since', since)
      params.set('limit', '200')

      const res = await fetch('/api/admin/logs?' + params.toString())
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs ?? [])
        if (data.availableActions?.length) {
          setAvailableActions(data.availableActions)
        }
      }
    } finally {
      setLoading(false)
    }
  }, [search, filterAction, since])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Logs de Atividade</h1>
          <p className="text-zinc-400 text-sm mt-1">Histórico de ações realizadas no painel admin</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchLogs}
          disabled={loading}
          className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Buscar por descrição ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <Select value={filterAction || 'all'} onValueChange={(v) => setFilterAction(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-[180px] bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="Tipo de ação" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="all" className="text-zinc-300">Todas as ações</SelectItem>
                {availableActions.map((a) => (
                  <SelectItem key={a} value={a} className="text-zinc-300">
                    {ACTION_LABELS[a] ?? a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                type="date"
                value={since}
                onChange={(e) => setSince(e.target.value)}
                className="pl-9 w-[180px] bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            {(search || filterAction || since) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSearch(''); setFilterAction(''); setSince('') }}
                className="text-zinc-400 hover:text-white"
              >
                Limpar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-zinc-400" />
            {loading
              ? 'Carregando...'
              : `${logs.length} registro${logs.length !== 1 ? 's' : ''} encontrado${logs.length !== 1 ? 's' : ''}`
            }
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-zinc-500">
              <RefreshCw className="h-5 w-5 animate-spin mr-2" />
              Carregando logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-500 gap-3">
              <FileText className="h-10 w-10 opacity-30" />
              <p className="text-sm">Nenhum log encontrado</p>
              <p className="text-xs text-zinc-600">As ações realizadas no painel admin aparecerão aqui.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 text-xs uppercase tracking-wider">
                    <th className="text-left px-4 py-3 font-medium">Data/Hora</th>
                    <th className="text-left px-4 py-3 font-medium">Ação</th>
                    <th className="text-left px-4 py-3 font-medium">Descrição</th>
                    <th className="text-left px-4 py-3 font-medium">Recurso</th>
                    <th className="text-left px-4 py-3 font-medium">Admin</th>
                    <th className="px-4 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, idx) => (
                    <tr
                      key={log.id}
                      className={`border-b border-zinc-800/50 hover:bg-zinc-800/40 transition-colors ${idx % 2 === 0 ? '' : 'bg-zinc-800/20'}`}
                    >
                      <td className="px-4 py-3 text-zinc-400 whitespace-nowrap text-xs">
                        {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </td>
                      <td className="px-4 py-3">
                        <ActionBadge action={log.action} />
                      </td>
                      <td className="px-4 py-3 text-zinc-300 max-w-xs truncate">
                        {log.description}
                      </td>
                      <td className="px-4 py-3 text-zinc-500 text-xs">
                        {log.resource_type ? (
                          <span className="font-mono">
                            {log.resource_type}
                            {log.resource_id && (
                              <span className="text-zinc-600"> /{log.resource_id.slice(0, 8)}…</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-zinc-700">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-500 text-xs truncate max-w-[160px]">
                        {log.admin_email ?? <span className="text-zinc-700">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="p-1.5 rounded hover:bg-zinc-700 text-zinc-500 hover:text-zinc-200 transition-colors"
                            title="Ver detalhes"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => exportLogJson(log)}
                            className="p-1.5 rounded hover:bg-zinc-700 text-zinc-500 hover:text-zinc-200 transition-colors"
                            title="Exportar JSON"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedLog && (
        <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  )
}
