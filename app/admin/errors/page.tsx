'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  AlertTriangle, CheckCircle2, Trash2, RefreshCw,
  ChevronDown, ChevronRight, Bug, Filter,
  ChevronsUpDown, Square, CheckSquare,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type ErrorLog = {
  id: string
  organization_id: string | null
  user_id: string | null
  message: string
  stack: string | null
  component_stack: string | null
  error_type: string
  severity: string
  url: string | null
  user_agent: string | null
  extra: Record<string, unknown> | null
  resolved: boolean
  resolved_at: string | null
  resolution_note: string | null
  created_at: string
}

const severityColors: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400',
  error:    'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400',
  warning:  'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-400',
  server:   'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400',
}

const typeLabels: Record<string, string> = {
  boundary:          'Boundary',
  runtime:           'Runtime',
  unhandled_promise: 'Promise',
  server:            'Servidor',
}

export default function AdminErrorsPage() {
  const qc = useQueryClient()
  const [filter, setFilter]       = useState<'all' | 'open' | 'resolved'>('open')
  const [expanded, setExpanded]   = useState<Set<string>>(new Set())
  const [selected, setSelected]   = useState<Set<string>>(new Set())

  const { data: errors = [], isLoading, isError, error: queryError, refetch } = useQuery<ErrorLog[]>({
    queryKey: ['admin-errors', filter],
    queryFn: async () => {
      const param = filter === 'open' ? '?resolved=false' : filter === 'resolved' ? '?resolved=true' : ''
      const res = await fetch(`/api/admin/errors${param}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? `HTTP ${res.status}`)
      }
      return res.json()
    },
    refetchInterval: 30_000,
    retry: 1,
  })

  const resolve = useMutation({
    mutationFn: async ({ id, resolved }: { id: string; resolved: boolean }) => {
      const res = await fetch(`/api/admin/errors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolved }),
      })
      if (!res.ok) throw new Error('Falha')
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-errors'] }); toast.success('Atualizado') },
    onError: () => toast.error('Erro ao atualizar'),
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/errors/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Falha')
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-errors'] }); toast.success('Removido') },
    onError: () => toast.error('Erro ao remover'),
  })

  const clearResolved = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/errors', { method: 'DELETE' })
      if (!res.ok) throw new Error('Falha')
      return res.json()
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin-errors'] })
      toast.success(`${data.deleted} erro(s) removido(s)`)
    },
    onError: () => toast.error('Erro ao limpar'),
  })

  // Ações em lote
  const bulkDelete = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map(id =>
        fetch(`/api/admin/errors/${id}`, { method: 'DELETE' })
      ))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-errors'] })
      setSelected(new Set())
      toast.success('Erros removidos')
    },
    onError: () => toast.error('Erro ao remover'),
  })

  const bulkResolve = useMutation({
    mutationFn: async ({ ids, resolved }: { ids: string[]; resolved: boolean }) => {
      await Promise.all(ids.map(id =>
        fetch(`/api/admin/errors/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resolved }),
        })
      ))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-errors'] })
      setSelected(new Set())
      toast.success('Erros atualizados')
    },
    onError: () => toast.error('Erro ao atualizar'),
  })

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const allSelected  = errors.length > 0 && selected.size === errors.length
  const someSelected = selected.size > 0 && !allSelected

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(errors.map(e => e.id)))
    }
  }

  const expandAll  = () => setExpanded(new Set(errors.map(e => e.id)))
  const collapseAll = () => setExpanded(new Set())

  const openCount = errors.filter(e => !e.resolved).length
  const selectedIds = Array.from(selected)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Bug className="w-6 h-6 text-red-500" />
            Erros do Sistema
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Erros capturados automaticamente do frontend e servidor
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {errors.some(e => e.resolved) && (
            <Button
              variant="outline" size="sm"
              className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900"
              onClick={() => clearResolved.mutate()}
              disabled={clearResolved.isPending}
            >
              <Trash2 className="w-4 h-4" />
              Limpar resolvidos
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total',      value: errors.length,              color: 'text-gray-700 dark:text-gray-200' },
          { label: 'Em aberto',  value: openCount,                  color: 'text-red-600 dark:text-red-400'   },
          { label: 'Resolvidos', value: errors.length - openCount,  color: 'text-green-600 dark:text-green-400' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros + controles */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-gray-400" />
        {(['open', 'all', 'resolved'] as const).map(f => (
          <button
            key={f}
            onClick={() => { setFilter(f); setSelected(new Set()) }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {f === 'open' ? 'Em aberto' : f === 'resolved' ? 'Resolvidos' : 'Todos'}
          </button>
        ))}

        {errors.length > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={expandAll}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronsUpDown className="w-3.5 h-3.5" />
              Expandir todos
            </button>
            <button
              onClick={collapseAll}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Recolher todos
            </button>
          </div>
        )}
      </div>

      {/* Barra de ações em lote */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-2.5">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
            {selected.size} selecionado{selected.size > 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              size="sm" variant="outline"
              className="h-7 text-xs gap-1.5 text-green-600 border-green-300 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-950/30"
              onClick={() => bulkResolve.mutate({ ids: selectedIds, resolved: true })}
              disabled={bulkResolve.isPending}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Marcar resolvidos
            </Button>
            <Button
              size="sm" variant="outline"
              className="h-7 text-xs gap-1.5 text-red-600 border-red-300 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/30"
              onClick={() => bulkDelete.mutate(selectedIds)}
              disabled={bulkDelete.isPending}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Apagar selecionados
            </Button>
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" />
          Carregando...
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <AlertTriangle className="w-10 h-10 text-red-400" />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Erro ao carregar</p>
          <p className="text-xs text-gray-500">{(queryError as Error)?.message}</p>
          <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-md px-3 py-2 max-w-sm text-center">
            Se a mensagem for "relation does not exist", execute a migration SQL no Supabase Dashboard antes de usar esta página.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Tentar novamente</Button>
        </div>
      ) : errors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
          <CheckCircle2 className="w-10 h-10 text-green-400" />
          <p className="text-sm">Nenhum erro encontrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Cabeçalho de seleção */}
          <div className="flex items-center gap-3 px-4 py-2">
            <button onClick={toggleSelectAll} className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              {allSelected
                ? <CheckSquare className="w-4 h-4 text-blue-600" />
                : someSelected
                ? <CheckSquare className="w-4 h-4 text-blue-400" />
                : <Square className="w-4 h-4" />}
            </button>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {allSelected ? 'Desmarcar todos' : `Selecionar todos (${errors.length})`}
            </span>
          </div>

          {errors.map(err => {
            const isOpen  = expanded.has(err.id)
            const isSel   = selected.has(err.id)
            return (
              <div
                key={err.id}
                className={`bg-white dark:bg-gray-900 rounded-lg border transition-all ${
                  isSel
                    ? 'border-blue-400 dark:border-blue-600 ring-1 ring-blue-200 dark:ring-blue-900'
                    : err.resolved
                    ? 'border-gray-200 dark:border-gray-800 opacity-60'
                    : 'border-red-200 dark:border-red-900'
                }`}
              >
                <div className="flex items-start gap-3 p-4">
                  {/* Checkbox */}
                  <button onClick={() => toggleSelect(err.id)} className="mt-0.5 shrink-0 text-gray-400 hover:text-blue-500">
                    {isSel
                      ? <CheckSquare className="w-4 h-4 text-blue-600" />
                      : <Square className="w-4 h-4" />}
                  </button>

                  {/* Expand */}
                  <button onClick={() => toggleExpand(err.id)} className="mt-0.5 shrink-0">
                    {isOpen
                      ? <ChevronDown className="w-4 h-4 text-gray-400" />
                      : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${severityColors[err.severity] ?? severityColors.error}`}>
                        {err.severity.toUpperCase()}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium">
                        {typeLabels[err.error_type] ?? err.error_type}
                      </span>
                      {err.resolved && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400 font-medium">
                          Resolvido
                        </span>
                      )}
                      <span className="text-xs text-gray-400 ml-auto">
                        {err.created_at ? format(new Date(err.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '—'}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{err.message}</p>
                    {err.url && <p className="text-xs text-gray-400 truncate mt-0.5">{err.url}</p>}
                  </div>

                  {/* Ações individuais */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => resolve.mutate({ id: err.id, resolved: !err.resolved })}
                      title={err.resolved ? 'Reabrir' : 'Marcar resolvido'}
                      className={`p-1.5 rounded-md transition-colors ${
                        err.resolved
                          ? 'text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30'
                          : 'text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => remove.mutate(err.id)}
                      title="Apagar"
                      className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Detalhe expandido */}
                {isOpen && (
                  <div className="border-t border-gray-100 dark:border-gray-800 px-4 pb-4 pt-3 space-y-3">
                    {err.stack && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Stack Trace</p>
                        <pre className="text-[11px] text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-md p-3 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                          {err.stack}
                        </pre>
                      </div>
                    )}
                    {err.component_stack && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Component Stack</p>
                        <pre className="text-[11px] text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-md p-3 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
                          {err.component_stack}
                        </pre>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {err.organization_id && (
                        <div>
                          <span className="text-gray-400">Org ID: </span>
                          <span className="text-gray-700 dark:text-gray-300 font-mono">{err.organization_id}</span>
                        </div>
                      )}
                      {err.user_agent && (
                        <div className="col-span-2">
                          <span className="text-gray-400">User Agent: </span>
                          <span className="text-gray-700 dark:text-gray-300 break-all">{err.user_agent}</span>
                        </div>
                      )}
                    </div>
                    {err.resolution_note && (
                      <div className="bg-green-50 dark:bg-green-950/30 rounded-md px-3 py-2 text-xs text-green-700 dark:text-green-400">
                        <strong>Nota de resolução:</strong> {err.resolution_note}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
