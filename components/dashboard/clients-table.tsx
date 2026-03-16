'use client'

import { useState } from 'react'
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
      {/* Mobile: card list */}
      <div className="sm:hidden space-y-3">
        {clients.map((client) => (
          <div key={client.id} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground truncate">{client.nome}</p>
                {client.telefone && (
                  <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3 shrink-0" />
                    <span>{client.telefone}</span>
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center gap-1.5 mt-0.5 text-sm text-muted-foreground truncate">
                    <Mail className="h-3 w-3 shrink-0" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                {(client.logradouro || client.cidade) && (
                  <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground/70 truncate">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{[client.cidade, client.estado].filter(Boolean).join(', ')}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {client.telefone && (
                  <Button variant="ghost" size="icon" onClick={() => handleWhatsApp(client)} title="WhatsApp"
                    className="h-8 w-8 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/50">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                )}
                {onViewOrders && (
                  <Button variant="ghost" size="icon" onClick={() => onViewOrders(client)} title="Ver ordens" className="h-8 w-8">
                    <FileText className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => onEdit(client)} className="h-8 w-8">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setDeleteId(client.id)}
                  className="h-8 w-8 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden sm:block bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Cadastro
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-accent/50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-foreground">
                        {client.nome}
                      </div>
                      {(client.logradouro || client.cidade) && (
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
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
                        <div className="flex items-center text-sm text-foreground">
                          <Phone className="h-3 w-3 mr-2 text-muted-foreground" />
                          {client.telefone}
                        </div>
                      )}
                      {client.email && (
                        <div className="flex items-center text-sm text-foreground">
                          <Mail className="h-3 w-3 mr-2 text-muted-foreground" />
                          {client.email}
                        </div>
                      )}
                      {!client.telefone && !client.email && (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {(() => {
                    const [y, m, d] = client.data_cadastro.split('T')[0].split('-')
                    return new Date(Number(y), Number(m) - 1, Number(d))
                      .toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
                  })()}
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
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50"
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
                          className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-950/50"
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
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/50"
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
