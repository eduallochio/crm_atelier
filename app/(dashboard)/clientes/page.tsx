'use client'

import { useState } from 'react'
import { Plus, Search, Users, UserPlus, ShoppingBag, Phone, Filter, SortAsc, Cake, LayoutGrid, List } from 'lucide-react'
import { Header } from '@/components/layouts/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useClients } from '@/hooks/use-clients'
import { useClientStats } from '@/hooks/use-client-stats'
import { ClientsTable } from '@/components/dashboard/clients-table'
import { ClientsCards } from '@/components/dashboard/clients-cards'
import { ClientDialog } from '@/components/forms/client-dialog'
import { ClientOrdersDialog } from '@/components/dashboard/client-orders-dialog'
import type { Client } from '@/lib/validations/client'

export default function ClientesPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [ordersDialogOpen, setOrdersDialogOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPhone, setFilterPhone] = useState<'all' | 'with' | 'without'>('all')
  const [filterEmail, setFilterEmail] = useState<'all' | 'with' | 'without'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'recent' | 'oldest'>('recent')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  const { data: clients = [], isLoading } = useClients()
  const { data: stats } = useClientStats()

  const handleEdit = (client: Client) => {
    setSelectedClient(client)
    setDialogOpen(true)
  }

  const handleViewOrders = (client: Client) => {
    setSelectedClient(client)
    setOrdersDialogOpen(true)
  }

  const handleNewClient = () => {
    setSelectedClient(null)
    setDialogOpen(true)
  }

  // Filtrar clientes pela busca
  const filteredClients = clients.filter((client) => {
    const query = searchQuery.toLowerCase()
    const matchesSearch = (
      client.nome.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query) ||
      client.telefone?.toLowerCase().includes(query)
    )

    // Filtro de telefone
    const matchesPhone = 
      filterPhone === 'all' ? true :
      filterPhone === 'with' ? !!client.telefone :
      !client.telefone

    // Filtro de email
    const matchesEmail = 
      filterEmail === 'all' ? true :
      filterEmail === 'with' ? !!client.email :
      !client.email

    return matchesSearch && matchesPhone && matchesEmail
  }).sort((a, b) => {
    // Ordenação
    if (sortBy === 'name') {
      return a.nome.localeCompare(b.nome)
    } else if (sortBy === 'recent') {
      return new Date(b.data_cadastro).getTime() - new Date(a.data_cadastro).getTime()
    } else {
      return new Date(a.data_cadastro).getTime() - new Date(b.data_cadastro).getTime()
    }
  })

  return (
    <div>
      <Header
        title="Clientes"
        description="Gerencie seus clientes"
      />
      
      <div className="p-6 space-y-6">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Clientes</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats?.totalClients || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-50 dark:bg-green-950/50 rounded-lg">
                <UserPlus className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Novos Este Mês</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats?.newThisMonth || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-50 dark:bg-orange-950/50 rounded-lg">
                <ShoppingBag className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Com Ordens Abertas</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats?.withActiveOrders || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-50 dark:bg-purple-950/50 rounded-lg">
                <Phone className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Com Telefone</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats?.withPhone || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-pink-50 dark:bg-pink-950/50 rounded-lg">
                <Cake className="h-6 w-6 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aniversários Este Mês</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats?.birthdayThisMonth || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Ações */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome, email ou telefone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtros */}
            <div className="flex gap-2">
              <select
                value={filterPhone}
                onChange={(e) => setFilterPhone(e.target.value as any)}
                className="px-3 py-2 border border-border rounded-md text-sm bg-background text-foreground hover:bg-accent"
              >
                <option value="all">📞 Telefone: Todos</option>
                <option value="with">✅ Com Telefone</option>
                <option value="without">❌ Sem Telefone</option>
              </select>

              <select
                value={filterEmail}
                onChange={(e) => setFilterEmail(e.target.value as any)}
                className="px-3 py-2 border border-border rounded-md text-sm bg-background text-foreground hover:bg-accent"
              >
                <option value="all">✉️ Email: Todos</option>
                <option value="with">✅ Com Email</option>
                <option value="without">❌ Sem Email</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-border rounded-md text-sm bg-background text-foreground hover:bg-accent"
              >
                <option value="recent">🕐 Mais Recentes</option>
                <option value="oldest">🕑 Mais Antigos</option>
                <option value="name">🔤 A-Z</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            {/* Toggle View Mode */}
            <div className="flex gap-1 border rounded-md p-1">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                title="Visualização em lista"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                title="Visualização em cards"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>

            <Button onClick={handleNewClient}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          </div>
        </div>

        {/* Contador */}
        <div className="text-sm text-muted-foreground">
          {isLoading ? (
            <span>Carregando...</span>
          ) : (
            <span>
              {filteredClients.length} {filteredClients.length === 1 ? 'cliente' : 'clientes'}
              {searchQuery && ` encontrado(s)`}
            </span>
          )}
        </div>

        {/* Tabela/Cards de Clientes */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-4 text-muted-foreground">Carregando clientes...</p>
          </div>
        ) : viewMode === 'list' ? (
          <ClientsTable clients={filteredClients} onEdit={handleEdit} onViewOrders={handleViewOrders} />
        ) : (
          <ClientsCards clients={filteredClients} onEdit={handleEdit} onViewOrders={handleViewOrders} />
        )}
      </div>

      {/* Dialog de Criar/Editar Cliente */}
      <ClientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        client={selectedClient}
      />

      {/* Dialog de Histórico de Ordens */}
      <ClientOrdersDialog
        open={ordersDialogOpen}
        onOpenChange={setOrdersDialogOpen}
        client={selectedClient}
      />
    </div>
  )
}
