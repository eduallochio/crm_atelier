'use client'

import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { Header } from '@/components/layouts/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useClients } from '@/hooks/use-clients'
import { ClientsTable } from '@/components/dashboard/clients-table'
import { ClientDialog } from '@/components/forms/client-dialog'
import type { Client } from '@/lib/validations/client'

export default function ClientesPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const { data: clients = [], isLoading } = useClients()

  const handleEdit = (client: Client) => {
    setSelectedClient(client)
    setDialogOpen(true)
  }

  const handleNewClient = () => {
    setSelectedClient(null)
    setDialogOpen(true)
  }

  // Filtrar clientes pela busca
  const filteredClients = clients.filter((client) => {
    const query = searchQuery.toLowerCase()
    return (
      client.nome.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query) ||
      client.telefone?.toLowerCase().includes(query)
    )
  })

  return (
    <div>
      <Header
        title="Clientes"
        description="Gerencie seus clientes"
      />
      
      <div className="p-6 space-y-6">
        {/* Barra de Ações */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome, email ou telefone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={handleNewClient}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        </div>

        {/* Contador */}
        <div className="text-sm text-gray-600">
          {isLoading ? (
            <span>Carregando...</span>
          ) : (
            <span>
              {filteredClients.length} {filteredClients.length === 1 ? 'cliente' : 'clientes'}
              {searchQuery && ` encontrado(s)`}
            </span>
          )}
        </div>

        {/* Tabela de Clientes */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-4 text-gray-500">Carregando clientes...</p>
          </div>
        ) : (
          <ClientsTable clients={filteredClients} onEdit={handleEdit} />
        )}
      </div>

      {/* Dialog de Criar/Editar Cliente */}
      <ClientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        client={selectedClient}
      />
    </div>
  )
}
