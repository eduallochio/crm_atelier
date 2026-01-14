'use client'

import { useState } from 'react'
import { Plus, Search, Package, CheckCircle, XCircle, DollarSign, TrendingUp, LayoutGrid, List, Filter } from 'lucide-react'
import { Header } from '@/components/layouts/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useServices } from '@/hooks/use-services'
import { useServiceStats } from '@/hooks/use-service-stats'
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
      
      <div className="p-6 space-y-6">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg">
                <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Serviços</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats?.totalServices || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-50 dark:bg-green-950/50 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ativos</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats?.activeServices || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-muted rounded-lg">
                <XCircle className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Inativos</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats?.inactiveServices || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-50 dark:bg-purple-950/50 rounded-lg">
                <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Preço Médio</p>
                <p className="text-2xl font-bold text-foreground">
                  R$ {stats?.averagePrice.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-50 dark:bg-orange-950/50 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mais Vendido</p>
                <p className="text-sm font-semibold text-foreground truncate">
                  {stats?.mostUsedService?.nome || '-'}
                </p>
                {stats?.mostUsedService && (
                  <p className="text-xs text-muted-foreground">
                    {stats.mostUsedService.count}x vendido
                  </p>
                )}
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
                placeholder="Buscar por nome, categoria ou descrição..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtros */}
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 border border-border rounded-md text-sm bg-background text-foreground hover:bg-accent"
              >
                <option value="all">📦 Status: Todos</option>
                <option value="active">✅ Ativos</option>
                <option value="inactive">❌ Inativos</option>
              </select>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-border rounded-md text-sm bg-background text-foreground hover:bg-accent"
              >
                <option value="all">🏷️ Categoria: Todas</option>
                {allCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-border rounded-md text-sm bg-background text-foreground hover:bg-accent"
              >
                <option value="name">🔤 A-Z</option>
                <option value="price-asc">📈 Preço Menor</option>
                <option value="price-desc">📉 Preço Maior</option>
                <option value="most-used">🎯 Mais Usado</option>
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

            <Button onClick={handleNewService}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Serviço
            </Button>
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
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-4 text-muted-foreground">Carregando serviços...</p>
          </div>
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
