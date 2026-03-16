'use client'

import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  Activity, 
  User, 
  Users,
  FileText, 
  CreditCard, 
  Settings,
  TrendingUp,
  UserPlus,
  Trash2
} from 'lucide-react'

interface ActivityLog {
  id: string
  action: string
  resource_type: string
  resource_id?: string
  description: string
  admin_id?: string
  admin_email?: string
  created_at: string
}

interface ActivityTabProps {
  organizationId: string
  organizationName: string
}

export function ActivityTab({ organizationId }: ActivityTabProps) {
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  const fetchActivities = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/organizations/${organizationId}/activity`)
      if (!res.ok) throw new Error('Erro ao buscar atividades')
      const data = await res.json()
      setActivities(data)
    } catch (error) {
      console.error('Erro ao buscar atividades:', error)
      setActivities([])
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  const getActionIcon = (action: string) => {
    if (action.includes('user')) return <User className="w-4 h-4" />
    if (action.includes('subscription') || action.includes('plan')) return <CreditCard className="w-4 h-4" />
    if (action.includes('client')) return <Users className="w-4 h-4" />
    if (action.includes('order')) return <FileText className="w-4 h-4" />
    if (action.includes('upgrade')) return <TrendingUp className="w-4 h-4" />
    if (action.includes('created')) return <UserPlus className="w-4 h-4" />
    if (action.includes('deleted')) return <Trash2 className="w-4 h-4" />
    if (action.includes('settings')) return <Settings className="w-4 h-4" />
    return <Activity className="w-4 h-4" />
  }

  const getActionColor = (action: string) => {
    if (action.includes('created') || action.includes('upgrade')) {
      return 'bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400'
    }
    if (action.includes('deleted') || action.includes('cancelled')) {
      return 'bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400'
    }
    if (action.includes('updated') || action.includes('modified')) {
      return 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
    }
    return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-12 text-center">
        <p className="text-gray-600 dark:text-gray-400">Carregando atividades...</p>
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-12 text-center">
        <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Nenhuma atividade registrada
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Não há atividades registradas para esta organização.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Timeline de Atividades */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Timeline de Atividades
        </h3>

        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={activity.id} className="flex gap-4">
              {/* Linha vertical e ícone */}
              <div className="flex flex-col items-center">
                <div className={`p-2 rounded-full ${getActionColor(activity.action)}`}>
                  {getActionIcon(activity.action)}
                </div>
                {index < activities.length - 1 && (
                  <div className="h-full w-px bg-gray-200 dark:bg-gray-700 my-2" />
                )}
              </div>

              {/* Conteúdo */}
              <div className="flex-1 pb-6">
                <div className="flex items-start justify-between mb-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {format(new Date(activity.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <span className="inline-flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {activity.admin_email}
                  </span>
                  {activity.resource_type && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full text-xs">
                      {activity.resource_type}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Estatísticas */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Resumo de Atividades
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {activities.length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total de Eventos</p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {activities.filter(a => a.action.includes('user')).length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Ações de Usuários</p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {activities.filter(a => a.action.includes('subscription') || a.action.includes('plan')).length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Mudanças de Plano</p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {[...new Set(activities.map(a => a.admin_id).filter(Boolean))].length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Admins Envolvidos</p>
          </div>
        </div>
      </div>
    </div>
  )
}
