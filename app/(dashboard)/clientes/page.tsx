'use client'

import { useState } from 'react'
import { Plus, Search, Users, UserPlus, ShoppingBag, Phone, Filter, SortAsc, Cake, LayoutGrid, List } from 'lucide-react'
import { Loader } from '@/components/ui/loader'
import { Header } from '@/components/layouts/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useClients } from '@/hooks/use-clients'
import { useClientStats } from '@/hooks/use-client-stats'
import { usePlanLimit } from '@/hooks/use-plan-usage'
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
  const clientLimit = usePlanLimit('clients')

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
      
      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {[
            { label: 'Total Clientes',   value: stats?.totalClients || 0,       icon: Users,       bar: 'bg-blue-500',   icon_bg: 'bg-blue-500',    text: 'text-blue-600 dark:text-blue-400' },
            { label: 'Novos Este Mês',   value: stats?.newThisMonth || 0,        icon: UserPlus,    bar: 'bg-green-500',  icon_bg: 'bg-green-500',   text: 'text-green-600 dark:text-green-400' },
            { label: 'Ordens Abertas',   value: stats?.withActiveOrders || 0,    icon: ShoppingBag, bar: 'bg-orange-500', icon_bg: 'bg-orange-500',  text: 'text-orange-600 dark:text-orange-400' },
            { label: 'Com Telefone',     value: stats?.withPhone || 0,           icon: Phone,       bar: 'bg-purple-500', icon_bg: 'bg-purple-500',  text: 'text-purple-600 dark:text-purple-400' },
            { label: 'Aniversários Mês', value: stats?.birthdayThisMonth || 0,  icon: Cake,        bar: 'bg-pink-500',   icon_bg: 'bg-pink-500',    text: 'text-pink-600 dark:text-pink-400', extra: 'col-span-2 sm:col-span-1' },
          ].map(({ label, value, icon: Icon, bar, icon_bg, text, extra }) => (
            <div key={label} className={`relative bg-card rounded-2xl overflow-hidden border border-border/60 shadow-sm hover:shadow-md transition-all duration-200 ${extra || ''}`}>
              <div className={`absolute top-0 left-0 right-0 h-[3px] ${bar}`} />
              <div className="p-4 sm:p-5 pt-5 sm:pt-6">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-[10px] sm:text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground leading-tight">{label}</p>
                  <div className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl ${icon_bg} shadow-sm shrink-0`}>
                    <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                  </div>
                </div>
                <p className={`text-2xl sm:text-3xl font-bold ${text}`}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Barra de Ações */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome, email ou telefone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-1 border rounded-md p-1 shrink-0">
              <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('list')} title="Lista">
                <List className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('grid')} title="Cards">
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {clientLimit.isFree && (
                <span className={`hidden sm:block text-xs font-medium ${clientLimit.atLimit ? 'text-red-500' : clientLimit.nearLimit ? 'text-amber-500' : 'text-muted-foreground'}`}>
                  {clientLimit.usage}/{clientLimit.limit} clientes
                </span>
              )}
              <Button
                onClick={handleNewClient}
                size="sm"
                className="shrink-0"
                disabled={clientLimit.atLimit}
                title={clientLimit.atLimit ? `Limite do plano Free atingido (${clientLimit.limit} clientes). Faça upgrade para continuar.` : undefined}
              >
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Novo Cliente</span>
              </Button>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <Select value={filterPhone} onValueChange={(v) => setFilterPhone(v as 'all' | 'with' | 'without')}>
              <SelectTrigger className="w-auto shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Telefone: Todos</SelectItem>
                <SelectItem value="with">Com Telefone</SelectItem>
                <SelectItem value="without">Sem Telefone</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterEmail} onValueChange={(v) => setFilterEmail(v as 'all' | 'with' | 'without')}>
              <SelectTrigger className="w-auto shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Email: Todos</SelectItem>
                <SelectItem value="with">Com Email</SelectItem>
                <SelectItem value="without">Sem Email</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'name' | 'recent' | 'oldest')}>
              <SelectTrigger className="w-auto shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Mais Recentes</SelectItem>
                <SelectItem value="oldest">Mais Antigos</SelectItem>
                <SelectItem value="name">A-Z</SelectItem>
              </SelectContent>
            </Select>
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
          <Loader text="Carregando clientes..." />
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
