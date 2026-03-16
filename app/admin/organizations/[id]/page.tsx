'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2, Calendar, Users, TrendingUp, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PlanBadge, StateBadge } from '@/components/admin/subscription-badge'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OverviewTab } from '@/components/admin/overview-tab'
import { SubscriptionTab } from '@/components/admin/subscription-tab'
import { UsageTab } from '@/components/admin/usage-tab'
import { BillingTab } from '@/components/admin/billing-tab'
import { UsersTab } from '@/components/admin/users-tab'
import { ActivityTab } from '@/components/admin/activity-tab'
import { NotesTab } from '@/components/admin/notes-tab'

interface Organization {
  id: string
  name: string
  plan: 'free' | 'pro'
  state: 'active' | 'trial' | 'cancelled' | 'suspended'
  created_at: string
  users_count: number
  clients_count: number
  mrr: number
}

export default function OrganizationDetailPage() {
  const params = useParams()
  const orgId = params.id as string
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  async function changeState(action: 'suspend' | 'reactivate' | 'cancel') {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}/state`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao alterar estado')
      const labels = { suspend: 'Organização suspensa', reactivate: 'Organização reativada', cancel: 'Assinatura cancelada' }
      toast.success(labels[action])
      fetchOrganization()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setActionLoading(false)
    }
  }

  const fetchOrganization = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}`)
      if (!res.ok) throw new Error('Não encontrado')
      const org = await res.json()

      setOrganization(org)
    } catch (error) {
      console.error('Erro ao buscar organização:', error)
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => {
    fetchOrganization()
  }, [fetchOrganization])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-600 dark:text-gray-400">Carregando organização...</p>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-gray-600 dark:text-gray-400 mb-4">Organização não encontrada</p>
        <Button asChild>
          <Link href="/admin/organizations">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com Breadcrumb */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/admin/organizations">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Organizações
          </Link>
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-950 rounded-lg">
                <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {organization.name}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  ID: {organization.id}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <PlanBadge plan={organization.plan} />
              <StateBadge state={organization.state} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {organization.state === 'suspended' ? (
              <Button
                variant="outline"
                disabled={actionLoading}
                onClick={() => changeState('reactivate')}
                className="text-emerald-600 border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Reativar
              </Button>
            ) : organization.state !== 'cancelled' ? (
              <Button
                variant="outline"
                disabled={actionLoading}
                onClick={() => changeState('suspend')}
              >
                {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Suspender
              </Button>
            ) : null}
            {organization.state !== 'cancelled' && (
              <Button
                variant="destructive"
                disabled={actionLoading}
                onClick={() => { if (confirm(`Cancelar assinatura de "${organization.name}"?`)) changeState('cancel') }}
              >
                {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Cancelar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-950 rounded-lg">
              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Usuários</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {organization.users_count}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-950 rounded-lg">
              <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Clientes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {organization.clients_count}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-950 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">MRR</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {organization.mrr > 0 ? `R$ ${organization.mrr.toFixed(2)}` : 'Grátis'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-950 rounded-lg">
              <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Cadastro</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {new Date(organization.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-7 lg:w-auto">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="subscription">Assinatura</TabsTrigger>
          <TabsTrigger value="usage">Uso</TabsTrigger>
          <TabsTrigger value="billing">Faturamento</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="activity">Atividade</TabsTrigger>
          <TabsTrigger value="notes">Notas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab organization={organization} />
        </TabsContent>

        <TabsContent value="subscription">
          <SubscriptionTab organization={organization} onRefresh={fetchOrganization} />
        </TabsContent>

        <TabsContent value="usage">
          <UsageTab organization={organization} />
        </TabsContent>

        <TabsContent value="billing">
          <BillingTab organization={organization} />
        </TabsContent>

        <TabsContent value="users">
          <UsersTab organizationId={organization.id} />
        </TabsContent>

        <TabsContent value="activity">
          <ActivityTab organizationId={organization.id} organizationName={organization.name} />
        </TabsContent>

        <TabsContent value="notes">
          <NotesTab organizationId={organization.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
