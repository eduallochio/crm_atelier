'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Pencil, Trash2, Phone, Mail, MapPin, FileText, MessageCircle } from 'lucide-react'
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

interface ClientsTableProps {
  clients: Client[]
  onEdit: (client: Client) => void
  onViewOrders?: (client: Client) => void
}

export function ClientsTable({ clients, onEdit, onViewOrders }: ClientsTableProps) {
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

    // Remover caracteres especiais do telefone
    const telefone = client.telefone.replace(/\D/g, '')
    const telefoneFormatado = telefone.startsWith('55') ? telefone : `55${telefone}`
    
    // Criar mensagem
    const mensagem = encodeURIComponent(
      `Olá ${client.nome}!\n\n` +
      `Como você está? Estou entrando em contato para...`
    )
    
    // Abrir WhatsApp Web
    window.open(`https://wa.me/${telefoneFormatado}?text=${mensagem}`, '_blank')
  }

  if (clients.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border">
        <p className="text-gray-500 mb-2">Nenhum cliente cadastrado</p>
        <p className="text-sm text-gray-400">
          Comece adicionando seu primeiro cliente
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cadastro
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">
                        {client.nome}
                      </div>
                      {(client.logradouro || client.cidade) && (
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          {[
                            client.logradouro,
                            client.numero,
                            client.bairro,
                            client.cidade,
                            client.estado
                          ].filter(Boolean).join(', ')}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {client.telefone && (
                        <div className="flex items-center text-sm text-gray-900">
                          <Phone className="h-3 w-3 mr-2 text-gray-400" />
                          {client.telefone}
                        </div>
                      )}
                      {client.email && (
                        <div className="flex items-center text-sm text-gray-900">
                          <Mail className="h-3 w-3 mr-2 text-gray-400" />
                          {client.email}
                        </div>
                      )}
                      {!client.telefone && !client.email && (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {format(new Date(client.data_cadastro), "dd 'de' MMMM 'de' yyyy", {
                      locale: ptBR,
                    })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {(client.logradouro && client.cidade) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
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
                          }}
                          title="Abrir no Google Maps"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <MapPin className="h-4 w-4" />
                        </Button>
                      )}
                      {client.telefone && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleWhatsApp(client)}
                          title="Enviar mensagem no WhatsApp"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {onViewOrders && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onViewOrders(client)}
                          title="Ver histórico de ordens"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(client)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(client.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
