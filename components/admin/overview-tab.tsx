'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  Calendar, 
  TrendingUp, 
  Activity, 
  FileText,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'

interface OverviewTabProps {
  organization: {
    id: string
    name: string
    plan: 'free' | 'pro' | 'enterprise'
    state: 'active' | 'trial' | 'cancelled' | 'suspended'
    created_at: string
    users_count: number
    clients_count: number
    mrr: number
  }
}

export function OverviewTab({ organization }: OverviewTabProps) {
  // Calcular dias desde criação
  const daysSinceCreation = Math.floor(
    (new Date().getTime() - new Date(organization.created_at).getTime()) / (1000 * 60 * 60 * 24)
  )

  // Calcular próxima renovação (simulado)
  const nextRenewal = new Date()
  nextRenewal.setMonth(nextRenewal.getMonth() + 1)

  return (
    <div className="space-y-6">
      {/* Informações Gerais */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Informações Gerais
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Nome da Organização</p>
            <p className="text-base font-medium text-gray-900 dark:text-white">
              {organization.name}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">ID da Organização</p>
            <p className="text-base font-mono text-gray-900 dark:text-white">
              {organization.id}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Plano Atual</p>
            <p className="text-base font-medium text-gray-900 dark:text-white capitalize">
              {organization.plan}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
            <p className="text-base font-medium text-gray-900 dark:text-white capitalize">
              {organization.state === 'active' ? 'Ativo' : 
               organization.state === 'trial' ? 'Trial' : 
               organization.state === 'cancelled' ? 'Cancelado' : 'Suspenso'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Data de Cadastro</p>
            <p className="text-base font-medium text-gray-900 dark:text-white">
              {format(new Date(organization.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Tempo de Conta</p>
            <p className="text-base font-medium text-gray-900 dark:text-white">
              {daysSinceCreation} dias
            </p>
          </div>
        </div>
      </div>

      {/* Status da Assinatura */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Status da Assinatura
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Receita Mensal</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {organization.mrr > 0 ? `R$ ${organization.mrr.toFixed(2)}` : 'Grátis'}
            </p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Próxima Renovação</p>
            <p className="text-base font-medium text-gray-900 dark:text-white">
              {organization.plan !== 'free' 
                ? format(nextRenewal, 'dd/MM/yyyy', { locale: ptBR })
                : 'N/A'}
            </p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Método de Pagamento</p>
            <p className="text-base font-medium text-gray-900 dark:text-white">
              {organization.plan !== 'free' ? 'Cartão de Crédito' : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Resumo de Uso */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Resumo de Uso
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Usuários</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {organization.users_count}
                {organization.plan === 'free' ? ' / 3' : ' / Ilimitado'}
              </p>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 dark:bg-blue-400"
                style={{ 
                  width: organization.plan === 'free' 
                    ? `${Math.min((organization.users_count / 3) * 100, 100)}%`
                    : '50%'
                }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Clientes</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {organization.clients_count}
                {organization.plan === 'free' ? ' / 50' : ' / Ilimitado'}
              </p>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-600 dark:bg-green-400"
                style={{ 
                  width: organization.plan === 'free' 
                    ? `${Math.min((organization.clients_count / 50) * 100, 100)}%`
                    : '30%'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Timeline de Eventos */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Eventos Recentes
        </h3>
        <div className="space-y-4">
          {/* Evento: Criação */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="p-2 bg-green-100 dark:bg-green-950 rounded-full">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="h-full w-px bg-gray-200 dark:bg-gray-700 my-2" />
            </div>
            <div className="flex-1 pb-4">
              <p className="font-medium text-gray-900 dark:text-white">
                Organização Criada
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {format(new Date(organization.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>

          {/* Evento: Plano Atual */}
          {organization.plan !== 'free' && (
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-950 rounded-full">
                  <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="h-full w-px bg-gray-200 dark:bg-gray-700 my-2" />
              </div>
              <div className="flex-1 pb-4">
                <p className="font-medium text-gray-900 dark:text-white">
                  Upgrade para {organization.plan}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Estimado há {Math.floor(daysSinceCreation / 2)} dias
                </p>
              </div>
            </div>
          )}

          {/* Evento: Status */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`p-2 rounded-full ${
                organization.state === 'active' ? 'bg-green-100 dark:bg-green-950' :
                organization.state === 'trial' ? 'bg-yellow-100 dark:bg-yellow-950' :
                'bg-red-100 dark:bg-red-950'
              }`}>
                {organization.state === 'active' ? (
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                ) : organization.state === 'trial' ? (
                  <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                )}
              </div>
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white">
                Status Atual: {
                  organization.state === 'active' ? 'Ativo' :
                  organization.state === 'trial' ? 'Em Trial' :
                  organization.state === 'cancelled' ? 'Cancelado' : 'Suspenso'
                }
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Atualizado recentemente
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
