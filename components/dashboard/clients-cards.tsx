'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Pencil, Trash2, Phone, Mail, MapPin, FileText, MessageCircle, Cake } from 'lucide-react'
import type { Client } from '@/lib/validations/client'
import { useDeleteClient } from '@/hooks/use-clients'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useState } from 'react'

interface ClientsCardsProps {
  clients: Client[]
  onEdit: (client: Client) => void
  onViewOrders?: (client: Client) => void
}

export function ClientsCards({ clients, onEdit, onViewOrders }: ClientsCardsProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const deleteClient = useDeleteClient()

  const handleDelete = async () => {
    if (deleteId) {
      await deleteClient.mutateAsync(deleteId)
      setDeleteId(null)
    }
  }

  const handleWhatsApp = (client: Client) => {
    if (!client.telefone) {
      toast.error('Cliente não possui telefone cadastrado')
      return
    }

    const telefone = client.telefone.replace(/\D/g, '')
    const telefoneFormatado = telefone.startsWith('55') ? telefone : `55${telefone}`
    
    const mensagem = encodeURIComponent(
      `Olá ${client.nome}!\n\n` +
      `Como você está? Estou entrando em contato para...`
    )
    
    window.open(`https://wa.me/${telefoneFormatado}?text=${mensagem}`, '_blank')
  }

  const handleMaps = (client: Client) => {
    const endereco = [
      client.logradouro,
      client.numero,
      client.bairro,
      client.cidade,
      client.estado,
      client.cep
    ].filter(Boolean).join(', ')
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`
    window.open(url, '_blank')
  }

  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  if (clients.length === 0) {
    return (
      <div className="text-center py-12 bg-card rounded-lg border border-border">
        <p className="text-muted-foreground mb-2">Nenhum cliente cadastrado</p>
        <p className="text-sm text-muted-foreground/70">
          Comece adicionando seu primeiro cliente
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((client) => (
          <div
            key={client.id}
            className="bg-card rounded-lg border border-border p-6 hover:shadow-md transition-shadow"
          >
            {/* Header do Card */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-foreground mb-1">
                  {client.nome}
                </h3>
                {client.data_nascimento && (
                  <div className="flex items-center text-sm text-pink-600 dark:text-pink-400 mb-2">
                    <Cake className="h-3 w-3 mr-1" />
                    {calculateAge(client.data_nascimento)} anos
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Cliente desde {format(new Date(client.data_cadastro), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>

            {/* Informações de Contato */}
            <div className="space-y-2 mb-4 pb-4 border-b border-border">
              {client.telefone && (
                <div className="flex items-center text-sm text-foreground">
                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                  {client.telefone}
                </div>
              )}
              {client.email && (
                <div className="flex items-center text-sm text-foreground">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  {client.email}
                </div>
              )}
              {(client.logradouro || client.cidade) && (
                <div className="flex items-start text-sm text-foreground">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground mt-0.5" />
                  <span className="flex-1">
                    {[
                      client.logradouro,
                      client.numero,
                      client.bairro,
                      client.cidade,
                      client.estado
                    ].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
              {!client.telefone && !client.email && !client.logradouro && (
                <p className="text-sm text-muted-foreground">Sem informações de contato</p>
              )}
            </div>

            {/* Observações */}
            {client.observacoes && (
              <div className="mb-4 pb-4 border-b border-border">
                <p className="text-xs text-muted-foreground mb-1">Observações:</p>
                <p className="text-sm text-foreground line-clamp-2">
                  {client.observacoes}
                </p>
              </div>
            )}

            {/* Ações */}
            <div className="flex flex-wrap gap-2">
              {(client.logradouro && client.cidade) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMaps(client)}
                  title="Abrir no Google Maps"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 flex-1"
                >
                  <MapPin className="h-4 w-4 mr-1" />
                  Mapa
                </Button>
              )}
              {client.telefone && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleWhatsApp(client)}
                  title="Enviar mensagem no WhatsApp"
                  className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-950/50 flex-1"
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  WhatsApp
                </Button>
              )}
              {onViewOrders && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewOrders(client)}
                  title="Ver histórico de ordens"
                  className="flex-1"
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Ordens
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(client)}
                title="Editar cliente"
                className="flex-1"
              >
                <Pencil className="h-4 w-4 mr-1" />
                Editar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteId(client.id)}
                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/50 flex-1"
                title="Excluir cliente"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Excluir
              </Button>
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este cliente? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
