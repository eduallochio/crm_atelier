'use client'

import { format, addMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  Users, 
  FileText,
  AlertTriangle,
  ArrowUpCircle,
  ArrowDownCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PlanBadge } from '@/components/admin/subscription-badge'

interface SubscriptionTabProps {
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

export function SubscriptionTab({ organization }: SubscriptionTabProps) {
  // Calcular próxima renovação
  const nextRenewal = addMonths(new Date(), 1)

  // Limites por plano
  const planLimits = {
    free: { users: 3, clients: 50, orders: 100 },
    pro: { users: Infinity, clients: Infinity, orders: Infinity },
    enterprise: { users: Infinity, clients: Infinity, orders: Infinity },
  }

  const limits = planLimits[organization.plan]

  // Calcular percentuais
  const usersPercent = limits.users === Infinity 
    ? 30 
    : Math.min((organization.users_count / limits.users) * 100, 100)
  
  const clientsPercent = limits.clients === Infinity 
    ? 45 
    : Math.min((organization.clients_count / limits.clients) * 100, 100)

  return (
    <div className="space-y-6">
      {/* Plano Atual */}
      <div className="bg-linear-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
              Plano Atual
              <PlanBadge plan={organization.plan} />
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {organization.state === 'trial' && 'Trial ativo - '}
              {organization.plan === 'free' 
                ? 'Plano gratuito com recursos limitados'
                : organization.plan === 'pro'
                ? 'Plano profissional com recursos completos'
                : 'Plano empresarial com suporte prioritário'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {organization.mrr > 0 ? `R$ ${organization.mrr.toFixed(2)}` : 'Grátis'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">por mês</p>
          </div>
        </div>

        <div className="flex gap-3">
          {organization.plan === 'free' && (
            <Button className="gap-2">
              <ArrowUpCircle className="w-4 h-4" />
              Fazer Upgrade
            </Button>
          )}
          {organization.plan === 'enterprise' && (
            <Button variant="outline" className="gap-2">
              <ArrowDownCircle className="w-4 h-4" />
              Fazer Downgrade
            </Button>
          )}
          {organization.plan === 'pro' && (
            <>
              <Button className="gap-2">
                <ArrowUpCircle className="w-4 h-4" />
                Upgrade para Enterprise
              </Button>
              <Button variant="outline" className="gap-2">
                <ArrowDownCircle className="w-4 h-4" />
                Downgrade para Free
              </Button>
            </>
          )}
          {organization.state !== 'cancelled' && (
            <Button variant="destructive">Cancelar Assinatura</Button>
          )}
          {organization.state === 'trial' && (
            <Button variant="outline">Estender Trial</Button>
          )}
        </div>
      </div>

      {/* Detalhes da Cobrança */}
      {organization.plan !== 'free' && (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Detalhes da Cobrança
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Próxima Renovação</p>
              <p className="text-base font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {format(nextRenewal, 'dd/MM/yyyy', { locale: ptBR })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Método de Pagamento</p>
              <p className="text-base font-medium text-gray-900 dark:text-white">
                Cartão de Crédito •••• 4242
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Valor da Renovação</p>
              <p className="text-base font-medium text-gray-900 dark:text-white">
                R$ {organization.mrr.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Uso de Recursos */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Uso de Recursos
        </h3>
        <div className="space-y-6">
          {/* Usuários */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Usuários
                </span>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {organization.users_count} / {limits.users === Infinity ? 'Ilimitado' : limits.users}
              </span>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${
                  usersPercent >= 90 
                    ? 'bg-red-600 dark:bg-red-400' 
                    : usersPercent >= 70 
                    ? 'bg-yellow-600 dark:bg-yellow-400'
                    : 'bg-blue-600 dark:bg-blue-400'
                }`}
                style={{ width: `${usersPercent}%` }}
              />
            </div>
            {usersPercent >= 90 && limits.users !== Infinity && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Limite quase atingido. Considere fazer upgrade.
              </p>
            )}
          </div>

          {/* Clientes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Clientes
                </span>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {organization.clients_count} / {limits.clients === Infinity ? 'Ilimitado' : limits.clients}
              </span>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${
                  clientsPercent >= 90 
                    ? 'bg-red-600 dark:bg-red-400' 
                    : clientsPercent >= 70 
                    ? 'bg-yellow-600 dark:bg-yellow-400'
                    : 'bg-green-600 dark:bg-green-400'
                }`}
                style={{ width: `${clientsPercent}%` }}
              />
            </div>
            {clientsPercent >= 90 && limits.clients !== Infinity && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Limite quase atingido. Considere fazer upgrade.
              </p>
            )}
          </div>

          {/* Ordens de Serviço (simulado) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Ordens de Serviço (este mês)
                </span>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                45 / {limits.orders === Infinity ? 'Ilimitado' : limits.orders}
              </span>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-600 dark:bg-purple-400"
                style={{ width: limits.orders === Infinity ? '45%' : '45%' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Histórico de Mudanças */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Histórico de Mudanças de Plano
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-950 rounded-lg">
                <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Plano {organization.plan} ativado
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {format(new Date(organization.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
            <PlanBadge plan={organization.plan} />
          </div>
        </div>
      </div>
    </div>
  )
}
