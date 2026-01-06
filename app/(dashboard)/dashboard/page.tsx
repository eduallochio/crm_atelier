import { Header } from '@/components/layouts/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { Users, FileText, DollarSign, TrendingUp } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Buscar dados do perfil e organização
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, organization:organizations(*)')
    .eq('id', user?.id)
    .single()

  // Buscar métricas
  const { data: metrics } = await supabase
    .from('usage_metrics')
    .select('*')
    .eq('organization_id', profile?.organization_id)
    .single()

  const stats = [
    {
      name: 'Clientes Cadastrados',
      value: metrics?.clients_count || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      name: 'Ordens de Serviço',
      value: metrics?.orders_count || 0,
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      name: 'Usuários',
      value: metrics?.users_count || 0,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      name: 'Receita do Mês',
      value: 'R$ 0,00',
      icon: DollarSign,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
  ]

  return (
    <div>
      <Header 
        title={`Bem-vindo, ${profile?.full_name || 'Usuário'}!`}
        description="Visão geral do seu ateliê"
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.name}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Plano Info */}
        {profile?.organization?.plan === 'free' && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">Plano Gratuito</CardTitle>
            </CardHeader>
            <CardContent className="text-blue-800 text-sm space-y-2">
              <p>
                Você está usando {metrics?.clients_count || 0} de 50 clientes disponíveis.
              </p>
              <p className="text-xs">
                Faça upgrade para o plano Enterprise para clientes ilimitados e mais recursos.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-sm text-center py-8">
              Nenhuma atividade ainda. Comece cadastrando seus primeiros clientes!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
