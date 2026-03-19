'use client'

import { useState } from 'react'
import { Plus, Search, Package, CheckCircle, XCircle, DollarSign, TrendingUp, LayoutGrid, List, Filter } from 'lucide-react'
import { Loader } from '@/components/ui/loader'
import { Header } from '@/components/layouts/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useServices } from '@/hooks/use-services'
import { useServiceStats } from '@/hooks/use-service-stats'
import { usePlanLimit } from '@/hooks/use-plan-usage'
import { ServicesTable } from '@/components/dashboard/services-table'
import { ServicesCards } from '@/components/dashboard/services-cards'
import { ServiceDialog } from '@/components/forms/service-dialog'
import type { Service } from '@/lib/validations/service'

export default function ServicosPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'price-asc' | 'price-desc' | 'most-used'>('name')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  const { data: services = [], isLoading } = useServices()
  const { data: stats } = useServiceStats()
  const serviceLimit = usePlanLimit('services')

  const handleEdit = (service: Service) => {
    setSelectedService(service)
    setDialogOpen(true)
  }

  const handleNewService = () => {
    setSelectedService(null)
    setDialogOpen(true)
  }

  const handleDuplicate = (service: Service) => {
    // Criar um novo serviço baseado no existente, mas com nome modificado
    const duplicatedService: Partial<Service> = {
      ...service,
      id: undefined as any, // Será criado um novo ID
      nome: `${service.nome} (Cópia)`,
      created_at: undefined as any,
    }
    
    setSelectedService(duplicatedService as Service)
    setDialogOpen(true)
  }

  // Categorias predefinidas comuns para ateliers
  const commonCategories = [
    'Costura',
    'Ajuste',
    'Reforma',
    'Conserto',
    'Customização',
    'Barra',
    'Zíper',
    'Botões',
    'Bordado',
    'Aplicação',
  ]

  // Extrair categorias únicas dos serviços existentes
  const existingCategories = [...new Set(services.map(s => s.categoria).filter((cat): cat is string => Boolean(cat)))]
  const allCategories = [...new Set([...commonCategories, ...existingCategories])].sort()

  // Filtrar serviços pela busca
  const filteredServices = services.filter((service) => {
    const query = searchQuery.toLowerCase()
    const matchesSearch = (
      service.nome.toLowerCase().includes(query) ||
      service.categoria?.toLowerCase().includes(query) ||
      service.descricao?.toLowerCase().includes(query)
    )

    // Filtro de status
    const matchesStatus = 
      filterStatus === 'all' ? true :
      filterStatus === 'active' ? service.ativo :
      !service.ativo

    // Filtro de categoria
    const matchesCategory = 
      filterCategory === 'all' ? true :
      service.categoria === filterCategory

    return matchesSearch && matchesStatus && matchesCategory
  }).sort((a, b) => {
    // Ordenação
    if (sortBy === 'name') {
      return a.nome.localeCompare(b.nome)
    } else if (sortBy === 'price-asc') {
      return a.preco - b.preco
    } else if (sortBy === 'price-desc') {
      return b.preco - a.preco
    } else if (sortBy === 'most-used') {
      const usageA = stats?.serviceUsage.find(u => u.id === a.id)?.count || 0
      const usageB = stats?.serviceUsage.find(u => u.id === b.id)?.count || 0
      return usageB - usageA
    }
    return 0
  })

  // Separar serviços ativos e inativos
  const activeServices = filteredServices.filter(s => s.ativo)
  const inactiveServices = filteredServices.filter(s => !s.ativo)

  return (
    <div>
      <Header
        title="Serviços"
        description="Gerencie o catálogo de serviços"
      />
      
      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Total */}
          <div className="relative bg-card rounded-2xl overflow-hidden border border-border/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-blue-500" />
            <div className="p-4 sm:p-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Total Serviços</p>
                <div className="p-2 rounded-xl bg-blue-500 shadow-sm shrink-0">
                  <Package className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground mb-3">{stats?.totalServices || 0}</p>
              <div className="h-px bg-border/50 mb-2" />
              <p className="text-[10.5px] text-muted-foreground">no catálogo</p>
            </div>
          </div>

          {/* Ativos */}
          <div className="relative bg-card rounded-2xl overflow-hidden border border-border/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-emerald-500" />
            <div className="p-4 sm:p-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Ativos</p>
                <div className="p-2 rounded-xl bg-emerald-500 shadow-sm shrink-0">
                  <CheckCircle className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground mb-3">{stats?.activeServices || 0}</p>
              <div className="h-px bg-border/50 mb-2" />
              <p className="text-[10.5px] text-muted-foreground">disponíveis</p>
            </div>
          </div>

          {/* Inativos */}
          <div className="relative bg-card rounded-2xl overflow-hidden border border-border/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-slate-400" />
            <div className="p-4 sm:p-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Inativos</p>
                <div className="p-2 rounded-xl bg-slate-400 shadow-sm shrink-0">
                  <XCircle className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground mb-3">{stats?.inactiveServices || 0}</p>
              <div className="h-px bg-border/50 mb-2" />
              <p className="text-[10.5px] text-muted-foreground">desativados</p>
            </div>
          </div>

          {/* Preço Médio */}
          <div className="relative bg-card rounded-2xl overflow-hidden border border-border/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-violet-500" />
            <div className="p-4 sm:p-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Preço Médio</p>
                <div className="p-2 rounded-xl bg-violet-500 shadow-sm shrink-0">
                  <DollarSign className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground mb-3">R$ {stats?.averagePrice?.toFixed(2) || '0.00'}</p>
              <div className="h-px bg-border/50 mb-2" />
              <p className="text-[10.5px] text-muted-foreground">por serviço</p>
            </div>
          </div>

          {/* Mais Vendido */}
          <div className="relative bg-card rounded-2xl overflow-hidden border border-border/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 col-span-2 sm:col-span-1">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-orange-500" />
            <div className="p-4 sm:p-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Mais Vendido</p>
                <div className="p-2 rounded-xl bg-orange-500 shadow-sm shrink-0">
                  <TrendingUp className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
              <p className="text-sm font-bold text-foreground mb-3 truncate leading-tight">{stats?.mostUsedService?.nome || '—'}</p>
              <div className="h-px bg-border/50 mb-2" />
              <p className="text-[10.5px] text-muted-foreground">
                {stats?.mostUsedService ? `${stats.mostUsedService.count}x vendido` : 'sem dados'}
              </p>
            </div>
          </div>
        </div>

        {/* Barra de Ações */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome, categoria ou descrição..."
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
              {serviceLimit.isFree && (
                <span className={`hidden sm:block text-xs font-medium ${serviceLimit.atLimit ? 'text-red-500' : serviceLimit.nearLimit ? 'text-amber-500' : 'text-muted-foreground'}`}>
                  {serviceLimit.usage}/{serviceLimit.limit} serviços
                </span>
              )}
              <Button
                onClick={handleNewService}
                size="sm"
                className="shrink-0"
                disabled={serviceLimit.atLimit}
                title={serviceLimit.atLimit ? `Limite do plano Free atingido (${serviceLimit.limit} serviços). Faça upgrade para continuar.` : undefined}
              >
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Novo Serviço</span>
              </Button>
            </div>
          </div>

          {/* Filtros com scroll horizontal */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as 'all' | 'active' | 'inactive')}>
              <SelectTrigger className="w-auto shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Status: Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-auto shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Categoria: Todas</SelectItem>
                {allCategories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'name' | 'price-asc' | 'price-desc' | 'most-used')}>
              <SelectTrigger className="w-auto shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">A-Z</SelectItem>
                <SelectItem value="price-asc">Preço Menor</SelectItem>
                <SelectItem value="price-desc">Preço Maior</SelectItem>
                <SelectItem value="most-used">Mais Usado</SelectItem>
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
              {filteredServices.length} {filteredServices.length === 1 ? 'serviço' : 'serviços'}
              {searchQuery && ` encontrado(s)`}
            </span>
          )}
        </div>

        {/* Tabela/Cards de Serviços */}
        {isLoading ? (
          <Loader text="Carregando serviços..." />
        ) : viewMode === 'list' ? (
          <ServicesTable services={filteredServices} onEdit={handleEdit} onDuplicate={handleDuplicate} />
        ) : (
          <ServicesCards services={filteredServices} onEdit={handleEdit} onDuplicate={handleDuplicate} />
        )}
      </div>

      {/* Dialog de Criar/Editar Serviço */}
      <ServiceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        service={selectedService}
      />
    </div>
  )
}
