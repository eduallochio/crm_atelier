'use client'

import { useEffect, useState, useCallback } from 'react'
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Database, Activity, HardDrive, FolderOpen, Table2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface TableStat { name: string; total_mb: number; table_mb: number; index_mb: number; rows: number }
interface BucketStat { name: string; size_mb: number; files: number }

interface HealthData {
  status: 'ok' | 'warning' | 'error'
  error?: string
  alerts?: { level: 'warning' | 'critical'; message: string }[]
  db: { status: string; response_ms: number; version: string; size_mb?: number; size_pct?: number; limit_mb?: number }
  storage: { used_mb?: number; used_pct?: number; limit_mb?: number; file_count?: number; buckets?: BucketStat[]; top_tables?: TableStat[]; total_mb?: number }
  supabase_limits?: { db_mb: number; storage_mb: number; mau: number; egress_gb: number }
  stats: { total_orgs: number; total_users: number; active_orgs: number; new_today: number }
  tables?: TableStat[]
  recent_logs: { action: string; description: string; admin_email: string | null; createdAt: string }[]
  checked_at: string
}

function fmtMb(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`
  if (mb >= 1)    return `${mb.toFixed(1)} MB`
  return `${(mb * 1024).toFixed(0)} KB`
}

function ProgressBar({ pct, label, used, limit }: { pct: number; label: string; used: string; limit: string }) {
  const color = pct > 85 ? 'bg-red-500' : pct > 60 ? 'bg-yellow-500' : 'bg-emerald-500'
  const textColor = pct > 85 ? 'text-red-500' : pct > 60 ? 'text-yellow-500' : 'text-emerald-500'
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{used} / {limit}</span>
          <span className={`text-xs font-bold tabular-nums ${textColor}`}>{pct.toFixed(1)}%</span>
        </div>
      </div>
      <div className="h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  )
}

function DbPing({ ms }: { ms: number }) {
  const color = ms < 100 ? 'text-emerald-500' : ms < 300 ? 'text-yellow-500' : 'text-red-500'
  return <span className={`font-mono font-bold ${color}`}>{ms}ms</span>
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-gray-400">
          <RefreshCw className="w-5 h-5 animate-spin" />
          Verificando sistema...
        </div>
      </div>
    )
  }

  const statusOk = data?.status === 'ok'
  const statusWarn = data?.status === 'warning'

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Saúde do Sistema</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Monitoramento do banco Supabase e storage
            {data?.checked_at && (
              <span className="ml-2 opacity-60">
                · {format(new Date(data.checked_at), "HH:mm:ss 'de' dd/MM", { locale: ptBR })}
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
        statusOk   ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40'
        : statusWarn ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/40'
                    : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40'
      }`}>
        {statusOk
          ? <CheckCircle className="w-8 h-8 text-emerald-500 flex-shrink-0" />
          : statusWarn
            ? <AlertTriangle className="w-8 h-8 text-yellow-500 flex-shrink-0" />
            : <XCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
        }
        <div className="flex-1">
          <p className="font-bold text-gray-900 dark:text-white text-lg">
            {statusOk ? 'Sistema operacional' : statusWarn ? 'Atenção necessária' : 'Problema detectado'}
          </p>
          {data?.error && <p className="text-sm text-red-600 mt-0.5">{data.error}</p>}
        </div>
      </div>

      {/* Alertas */}
      {data?.alerts && data.alerts.length > 0 && (
        <div className="space-y-2">
          {data.alerts.map((alert, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-medium ${
              alert.level === 'critical'
                ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400'
                : 'bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-950/30 dark:border-yellow-800 dark:text-yellow-400'
            }`}>
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {alert.message}
            </div>
          ))}
        </div>
      )}

      {data && (
        <>
          {/* Limites Supabase Free */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center gap-2 mb-5">
              <Database className="w-5 h-5 text-blue-500" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Limites do Plano Supabase Free</h2>
            </div>
            <div className="space-y-5">
              <ProgressBar
                label="Banco de Dados"
                pct={data.db.size_pct ?? 0}
                used={fmtMb(data.db.size_mb ?? 0)}
                limit={fmtMb(data.db.limit_mb ?? 500)}
              />
              <ProgressBar
                label="Storage (Arquivos)"
                pct={data.storage.used_pct ?? 0}
                used={fmtMb(data.storage.used_mb ?? 0)}
                limit={fmtMb(data.storage.limit_mb ?? 1024)}
              />
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs">Banco</p>
                <p className="font-bold text-gray-900 dark:text-white">{fmtMb(data.db.size_mb ?? 0)}</p>
                <p className="text-xs text-gray-400">de {fmtMb(data.db.limit_mb ?? 500)}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Storage</p>
                <p className="font-bold text-gray-900 dark:text-white">{fmtMb(data.storage.used_mb ?? 0)}</p>
                <p className="text-xs text-gray-400">de 1 GB · {data.storage.file_count ?? 0} arquivos</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Latência DB</p>
                <DbPing ms={data.db.response_ms} />
              </div>
              <div>
                <p className="text-gray-500 text-xs">MAU</p>
                <p className="font-bold text-gray-900 dark:text-white">{data.stats.total_users.toLocaleString('pt-BR')}</p>
                <p className="text-xs text-gray-400">de 50.000</p>
              </div>
            </div>
          </div>

          {/* Stats da plataforma */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Organizações',    value: data.stats.total_orgs,  color: 'text-blue-600'   },
              { label: 'Orgs Ativas',     value: data.stats.active_orgs, color: 'text-emerald-600'},
              { label: 'Total Usuários',  value: data.stats.total_users, color: 'text-purple-600' },
              { label: 'Novas Hoje',      value: data.stats.new_today,   color: 'text-amber-600'  },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 text-center">
                <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString('pt-BR')}</p>
                <p className="text-xs text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Storage por bucket */}
          {(data.storage.buckets?.length ?? 0) > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center gap-2 mb-4">
                <FolderOpen className="w-5 h-5 text-amber-500" />
                <h2 className="font-semibold text-gray-900 dark:text-white">Storage por Bucket</h2>
              </div>
              <div className="space-y-3">
                {(data.storage.buckets ?? []).map((b) => (
                  <div key={b.name} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                    <div>
                      <p className="text-sm font-mono text-gray-700 dark:text-gray-300">{b.name}</p>
                      <p className="text-xs text-gray-400">{b.files} arquivo{b.files !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{fmtMb(b.size_mb)}</p>
                      <p className="text-xs text-gray-400">{((b.size_mb / (data.storage.limit_mb ?? 1024)) * 100).toFixed(1)}% do limite</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Maiores tabelas */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Table2 className="w-5 h-5 text-indigo-500" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Maiores Tabelas em Disco</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100 dark:border-gray-800">
                    <th className="pb-2 font-medium">Tabela</th>
                    <th className="pb-2 font-medium text-right">Linhas</th>
                    <th className="pb-2 font-medium text-right">Dados</th>
                    <th className="pb-2 font-medium text-right">Índices</th>
                    <th className="pb-2 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                  {(data.tables ?? []).slice(0, 15).map((t) => (
                    <tr key={t.name} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="py-2 font-mono text-xs text-gray-600 dark:text-gray-400">{t.name}</td>
                      <td className="py-2 text-right text-gray-700 dark:text-gray-300 tabular-nums">{t.rows.toLocaleString('pt-BR')}</td>
                      <td className="py-2 text-right text-gray-700 dark:text-gray-300 tabular-nums">{fmtMb(t.table_mb)}</td>
                      <td className="py-2 text-right text-gray-500 tabular-nums">{fmtMb(t.index_mb)}</td>
                      <td className="py-2 text-right font-bold text-gray-900 dark:text-white tabular-nums">{fmtMb(t.total_mb)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Últimas ações */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
              <Activity className="w-4 h-4 text-gray-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Últimas Ações Admin</h3>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-800/60">
              {data.recent_logs.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Nenhuma ação registrada</p>
              ) : (
                data.recent_logs.map((log, i) => (
                  <div key={i} className="flex items-start gap-3 px-6 py-3">
                    <span className="text-xs font-mono text-gray-400 w-20 shrink-0 mt-0.5 truncate">{log.action}</span>
                    <p className="flex-1 text-sm text-gray-700 dark:text-gray-300">{log.description}</p>
                    <div className="text-right text-xs text-gray-400 shrink-0">
                      {log.createdAt ? <p>{format(new Date(log.createdAt), "d MMM HH:mm", { locale: ptBR })}</p> : <p>—</p>}
                      {log.admin_email && <p className="opacity-60 truncate max-w-[120px]">{log.admin_email}</p>}
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
