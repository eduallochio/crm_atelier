'use client'

import { useEffect, useState } from 'react'
import { Bell, Search, Settings } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface AdminLog {
  id: string
  action: string
  description: string
  admin_email: string | null
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

export function AdminHeader() {
  const [logs, setLogs] = useState<AdminLog[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (open && logs.length === 0) {
      fetch('/api/admin/logs?limit=8')
        .then((r) => r.json())
        .then((data) => setLogs(data.logs ?? []))
        .catch(() => {})
    }
  }, [open, logs.length])

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="h-16 px-6 flex items-center justify-between">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Buscar organizações..."
              className="pl-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2 ml-4">
          {/* Notifications */}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <span className="font-semibold text-sm text-gray-900 dark:text-white">Atividade Recente</span>
                <Button variant="ghost" size="sm" asChild className="text-xs h-auto py-1">
                  <Link href="/admin/logs" onClick={() => setOpen(false)}>Ver tudo</Link>
                </Button>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-800/60 max-h-96 overflow-y-auto">
                {logs.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">Nenhum evento recente</p>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                      <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${ACTION_COLORS[log.action] ?? 'bg-zinc-400'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug">{log.description}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {format(new Date(log.created_at), "d MMM 'às' HH:mm", { locale: ptBR })}
                          {log.admin_email && <span className="ml-1 opacity-70">· {log.admin_email}</span>}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Settings */}
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/settings">
              <Settings className="w-5 h-5" />
            </Link>
          </Button>

          {/* User Avatar */}
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">AD</span>
          </div>
        </div>
      </div>
    </header>
  )
}
