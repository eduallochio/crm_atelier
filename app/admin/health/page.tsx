'use client'

import { useEffect, useState, useCallback } from 'react'
import { RefreshCw, CheckCircle, XCircle, Database, Activity, Clock, HardDrive } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface StorageFile { name: string; type: string; size_mb: number; used_mb: number }
interface TableSize  { name: string; total_mb: number; used_mb: number; rows: number }

interface HealthData {
  status: 'ok' | 'error'
  error?: string
  db: { status: string; response_ms: number; version: string }
  stats: { total_orgs: number; total_users: number; active_orgs: number; new_today: number }
  storage: { total_mb: number; used_mb: number; files: StorageFile[]; top_tables: TableSize[] }
  tables: { name: string; rows: number }[]
  recent_logs: { action: string; description: string; admin_email: string | null; created_at: string }[]
  checked_at: string
}

const STATUS_THRESHOLDS = { ok: 100, warn: 300 }

function DbPing({ ms }: { ms: number }) {
  const color = ms < STATUS_THRESHOLDS.ok ? 'text-green-500' : ms < STATUS_THRESHOLDS.warn ? 'text-yellow-500' : 'text-red-500'
  return <span className={`font-mono font-bold ${color}`}>{ms}ms</span>
}

function fmtMb(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`
  if (mb >= 1)    return `${mb.toFixed(2)} MB`
  return `${(mb * 1024).toFixed(0)} KB`
}

function StorageBar({ used, total, colorClass = 'bg-blue-500' }: { used: number; total: number; colorClass?: string }) {
  const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0
  const barColor = pct > 85 ? 'bg-red-500' : pct > 60 ? 'bg-yellow-500' : colorClass
  return (
    <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
      <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function AdminHealthPage() {
  const [data, setData] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchHealth = useCallback(async () => {
    setRefreshing(true)
    try {
      const res = await fetch('/api/admin/health')
      setData(await res.json())
    } catch {
      setData(null)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchHealth() }, [fetchHealth])

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Verificando sistema...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Saúde do Sistema</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Status do sistema em tempo real
            {data?.checked_at && (
              <span className="ml-2 opacity-60">
                · verificado {format(new Date(data.checked_at), "HH:mm:ss", { locale: ptBR })}
              </span>
            )}
          </p>
        </div>
        <Button variant="outline" onClick={fetchHealth} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Status geral */}
      <div className={`rounded-xl border-2 p-5 flex items-center gap-4 ${
        data?.status === 'ok'
          ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/40'
          : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40'
      }`}>
        {data?.status === 'ok'
          ? <CheckCircle className="w-8 h-8 text-green-500 flex-shrink-0" />
          : <XCircle className="w-8 h-8 text-red-500 flex-shrink-0" />}
        <div>
          <p className="font-bold text-gray-900 dark:text-white text-lg">
            {data?.status === 'ok' ? 'Sistema operacional' : 'Problema detectado'}
          </p>
          {data?.error && <p className="text-sm text-red-600 mt-0.5">{data.error}</p>}
        </div>
      </div>

      {data && (
        <>
          {/* DB + Stats + Tabelas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Banco */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-4 h-4 text-blue-500" />
                <span className="font-semibold text-sm">Banco de Dados</span>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className="text-green-500 font-medium">Conectado</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Latência</span>
                  <DbPing ms={data.db.response_ms} />
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-gray-500">Versão</span>
                  <span className="text-gray-700 dark:text-gray-300 text-xs text-right max-w-[160px] leading-tight">
                    {data.db.version.substring(0, 50)}...
                  </span>
                </div>
              </div>
            </div>

            {/* Plataforma */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-purple-500" />
                <span className="font-semibold text-sm">Plataforma</span>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total orgs</span>
                  <span className="font-bold text-gray-900 dark:text-white">{data.stats.total_orgs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Orgs ativas</span>
                  <span className="font-bold text-green-600">{data.stats.active_orgs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total usuários</span>
                  <span className="font-bold text-gray-900 dark:text-white">{data.stats.total_users}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Novas hoje</span>
                  <span className="font-bold text-blue-600">{data.stats.new_today}</span>
                </div>
              </div>
            </div>

            {/* Contagem de linhas */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-amber-500" />
                <span className="font-semibold text-sm">Registros por Tabela</span>
              </div>
              <div className="space-y-1.5">
                {data.tables.map((t) => (
                  <div key={t.name} className="flex justify-between text-sm">
                    <span className="text-gray-500 font-mono text-xs">{t.name}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{t.rows.toLocaleString('pt-BR')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Armazenamento */}
          {data.storage && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-gray-500" />
                Armazenamento
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Resumo do banco */}
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Arquivos do Banco</p>
                  <div className="space-y-4">
                    {data.storage.files.map((f) => (
                      <div key={f.name}>
                        <div className="flex justify-between items-center mb-1.5">
                          <div>
                            <span className="text-xs font-mono text-gray-700 dark:text-gray-300">{f.name}</span>
                            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                              f.type === 'ROWS' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                               : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                            }`}>{f.type === 'ROWS' ? 'dados' : 'log'}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold text-gray-900 dark:text-white">{fmtMb(f.used_mb)}</span>
                            <span className="text-xs text-gray-400 ml-1">/ {fmtMb(f.size_mb)}</span>
                          </div>
                        </div>
                        <StorageBar
                          used={f.used_mb}
                          total={f.size_mb}
                          colorClass={f.type === 'ROWS' ? 'bg-blue-500' : 'bg-violet-500'}
                        />
                      </div>
                    ))}

                    {/* Total alocado */}
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Total alocado (dados)</span>
                        <span className="font-bold text-gray-900 dark:text-white">{fmtMb(data.storage.total_mb)}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-gray-500">Espaço utilizado</span>
                        <span className="font-bold text-gray-900 dark:text-white">{fmtMb(data.storage.used_mb)}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-gray-500">Livre</span>
                        <span className="font-bold text-green-600">{fmtMb(data.storage.total_mb - data.storage.used_mb)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top tabelas por tamanho */}
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Maiores Tabelas em Disco</p>
                  <div className="space-y-3">
                    {data.storage.top_tables.map((t) => {
                      const maxMb = data.storage.top_tables[0]?.total_mb || 1
                      return (
                        <div key={t.name}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-mono text-gray-600 dark:text-gray-400">{t.name}</span>
                            <div className="text-right flex items-center gap-2">
                              <span className="text-xs text-gray-400">{t.rows.toLocaleString('pt-BR')} linhas</span>
                              <span className="text-xs font-bold text-gray-900 dark:text-white w-16 text-right">
                                {fmtMb(t.total_mb)}
                              </span>
                            </div>
                          </div>
                          <StorageBar used={t.total_mb} total={maxMb} colorClass="bg-indigo-500" />
                        </div>
                      )
                    })}
                    {data.storage.top_tables.length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-4">Sem dados de tamanho disponíveis</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recent activity */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-white">Últimas Ações do Sistema</h3>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-800/60">
              {data.recent_logs.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Nenhuma ação registrada</p>
              ) : (
                data.recent_logs.map((log, i) => (
                  <div key={i} className="flex items-start gap-3 px-5 py-3">
                    <span className="text-xs font-mono text-gray-400 w-12 shrink-0 mt-0.5">{log.action}</span>
                    <p className="flex-1 text-sm text-gray-700 dark:text-gray-300">{log.description}</p>
                    <div className="text-right text-xs text-gray-400 shrink-0">
                      <p>{format(new Date(log.created_at), "d MMM HH:mm", { locale: ptBR })}</p>
                      {log.admin_email && <p className="opacity-60">{log.admin_email}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
