'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { OrganizationTable } from '@/components/admin/organization-table'
import { BulkActionsModal } from '@/components/admin/bulk-actions-modal'

interface Organization {
  id: string
  name: string
  plan: 'free' | 'pro' | 'enterprise'
  state: 'active' | 'trial' | 'cancelled' | 'suspended'
  created_at: string
  users_count: number
  clients_count: number
  mrr: number
}

export default function OrganizationsPage() {
  const supabase = createClient()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [planFilter, setPlanFilter] = useState<string>('all')
  const [stateFilter, setStateFilter] = useState<string>('all')
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([])

  const fetchOrganizations = useCallback(async () => {
    try {
      const { data: orgs, error } = await supabase
        .from('organizations')
        .select(`
          id,
          name,
          plan,
          state,
          created_at
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Buscar contagens para cada organização
      const orgsWithCounts = await Promise.all(
        (orgs || []).map(async (org) => {
          // Contar usuários
          const { count: usersCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', org.id)

          // Contar clientes
          const { count: clientsCount } = await supabase
            .from('org_clients')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', org.id)

          // Calcular MRR
          const mrr = org.plan === 'pro' ? 59.90 : org.plan === 'enterprise' ? 299.90 : 0

          return {
            ...org,
            users_count: usersCount || 0,
            clients_count: clientsCount || 0,
            mrr,
          }
        })
      )

      setOrganizations(orgsWithCounts)
    } catch (error) {
      console.error('Erro ao buscar organizações:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchOrganizations()
  }, [fetchOrganizations])

  // Filtrar organizações
  const filteredOrganizations = organizations.filter((org) => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPlan = planFilter === 'all' || org.plan === planFilter
    const matchesState = stateFilter === 'all' || org.state === stateFilter
    return matchesSearch && matchesPlan && matchesState
  })

  const handleSendEmail = async (subject: string, message: string) => {
    // TODO: Implementar integração com serviço de email
    console.log('Enviando email para:', selectedOrgs)
    console.log('Assunto:', subject)
    console.log('Mensagem:', message)
    alert(`Email enviado para ${selectedOrgs.length} organização(ões)!`)
    setSelectedOrgs([])
  }

  const handleExport = () => {
    const selectedOrgData = organizations.filter((org) => selectedOrgs.includes(org.id))
    
    // Criar CSV
    const headers = ['ID', 'Nome', 'Plano', 'Status', 'Usuários', 'Clientes', 'MRR', 'Cadastro']
    const rows = selectedOrgData.map((org) => [
      org.id,
      org.name,
      org.plan,
      org.state,
      org.users_count.toString(),
      org.clients_count.toString(),
      org.mrr.toString(),
      new Date(org.created_at).toLocaleDateString('pt-BR'),
    ])

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `organizacoes_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    
    setSelectedOrgs([])
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Organizações</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gerencie todas as organizações da plataforma
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nova Organização
        </Button>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Busca */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filtro por Plano */}
          <div>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="all">Todos os planos</option>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          {/* Filtro por Status */}
          <div>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="all">Todos os status</option>
              <option value="active">Ativo</option>
              <option value="trial">Trial</option>
              <option value="cancelled">Cancelado</option>
              <option value="suspended">Suspenso</option>
            </select>
          </div>
        </div>

        {/* Ações em Massa */}
        {selectedOrgs.length > 0 && (
          <div className="mt-4">
            <BulkActionsModal
              selectedCount={selectedOrgs.length}
              onClose={() => setSelectedOrgs([])}
              onSendEmail={handleSendEmail}
              onExport={handleExport}
            />
          </div>
        )}
      </div>

      {/* Tabela */}
      <OrganizationTable
        organizations={filteredOrganizations}
        loading={loading}
        selectedOrgs={selectedOrgs}
        onSelectOrgs={setSelectedOrgs}
        onRefresh={fetchOrganizations}
      />
    </div>
  )
}
