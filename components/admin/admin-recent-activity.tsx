'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AdminLog {
  id: string
  action: string
  description: string
  admin_email: string | null
  resource_type: string | null
  created_at: string
}

const ACTION_COLORS: Record<string, string> = {
  CREATE:      'bg-emerald-500',
  UPDATE:      'bg-blue-500',
  DELETE:      'bg-red-500',
  SUSPEND:     'bg-amber-500',
  REACTIVATE:  'bg-teal-500',
  CANCEL:      'bg-rose-500',
  CHANGE_PLAN: 'bg-purple-500',
  LOGIN:       'bg-sky-500',
}

export function AdminRecentActivity() {
  const [logs, setLogs] = useState<AdminLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/logs?limit=8')
      .then((r) => r.json())
      .then((data) => setLogs(data.logs ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-gray-900 dark:text-white">Atividade Recente</h3>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/logs">
            Ver tudo
            <ArrowRight className="w-3 h-3 ml-1" />
          </Link>
        </Button>
      </div>

      <div className="space-y-3">
        {loading ? (
          <p className="text-gray-500 text-center py-8 text-sm">Carregando...</p>
        ) : logs.length === 0 ? (
          <p className="text-gray-500 text-center py-8 text-sm">Nenhuma atividade recente</p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex items-start gap-3">
              <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${ACTION_COLORS[log.action] ?? 'bg-zinc-500'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 dark:text-white truncate">{log.description}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {format(new Date(log.created_at), "d MMM 'às' HH:mm", { locale: ptBR })}
                  {log.admin_email && <span className="ml-1 opacity-60">· {log.admin_email}</span>}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
