'use client'

import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { Header } from '@/components/layouts/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useServices } from '@/hooks/use-services'
import { ServicesTable } from '@/components/dashboard/services-table'
import { ServiceDialog } from '@/components/forms/service-dialog'
import type { Service } from '@/lib/validations/service'

export default function ServicosPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const { data: services = [], isLoading } = useServices()

  const handleEdit = (service: Service) => {
    setSelectedService(service)
    setDialogOpen(true)
  }

  const handleNewService = () => {
    setSelectedService(null)
    setDialogOpen(true)
  }

  // Filtrar serviços pela busca
  const filteredServices = services.filter((service) => {
    const query = searchQuery.toLowerCase()
    return (
      service.nome.toLowerCase().includes(query) ||
      service.categoria?.toLowerCase().includes(query) ||
      service.descricao?.toLowerCase().includes(query)
    )
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
        {/* Barra de Ações */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome, categoria ou descrição..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={handleNewService}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Serviço
          </Button>
        </div>

        {/* Contador */}
        <div className="text-sm text-gray-600">
          {isLoading ? (
            <span>Carregando...</span>
          ) : (
            <span>
              {filteredServices.length} {filteredServices.length === 1 ? 'serviço' : 'serviços'}
              {searchQuery && ` encontrado(s)`}
              {' '}({activeServices.length} ativo{activeServices.length !== 1 ? 's' : ''}, {inactiveServices.length} inativo{inactiveServices.length !== 1 ? 's' : ''})
            </span>
          )}
        </div>

        {/* Tabela de Serviços */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-4 text-gray-500">Carregando serviços...</p>
          </div>
        ) : (
          <ServicesTable services={filteredServices} onEdit={handleEdit} />
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
