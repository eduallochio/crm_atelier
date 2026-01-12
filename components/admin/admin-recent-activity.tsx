'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

interface Activity {
  id: string
  action: string
  organization_name?: string
  created_at: string
  type: 'success' | 'pending' | 'error'
}

interface AdminLog {
  id: string
  action: string
  resource_type: string
  created_at: string
}

export function AdminRecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    const fetchActivities = async () => {
      try {
        // Buscar últimas atividades
        const { data, error } = await supabase
          .from('admin_logs')
          .select('id, action, resource_type, created_at')
          .order('created_at', { ascending: false })
          .limit(5)

        if (error) throw error

        // Mapear dados para o formato esperado
        const mappedActivities: Activity[] = (data || []).map((log: AdminLog) => ({
          id: log.id,
          action: getActivityDescription(log.action, log.resource_type),
          created_at: log.created_at,
          type: getActivityType(log.action),
        }))

        setActivities(mappedActivities)
      } catch (error) {
        console.error('Erro ao buscar atividades:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [])

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-gray-900 dark:text-white">Atividade Recente</h3>
        <Button variant="ghost" size="sm">
          Ver tudo
        </Button>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {loading ? (
          <p className="text-gray-500 text-center py-8">Carregando atividades...</p>
        ) : activities.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Nenhuma atividade recente</p>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-4">
              {/* Icon */}
              <div className="mt-1">{getActivityIcon(activity.type)}</div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {activity.action}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {format(
                    new Date(activity.created_at),
                    "d 'de' MMMM 'às' HH:mm",
                    { locale: ptBR }
                  )}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <Button
        variant="outline"
        className="w-full mt-6"
        asChild
      >
        <a href="/admin/logs">Ver logs completos</a>
      </Button>
    </div>
  )
}

function getActivityDescription(action: string, resourceType: string): string {
  const descriptions: Record<string, string> = {
    create: `Nova ${resourceType} criada`,
    update: `${resourceType} atualizada`,
    delete: `${resourceType} deletada`,
    login: 'Admin fez login',
    export: `Dados de ${resourceType} exportados`,
    view: `${resourceType} visualizada`,
  }
  return descriptions[action] || action
}

function getActivityType(action: string): Activity['type'] {
  if (action === 'delete') return 'error'
  if (action === 'create' || action === 'update') return 'success'
  return 'pending'
}
