'use client'

import { useState } from 'react'
import { Pencil, Trash2, Eye, DollarSign, User, Calendar, MessageCircle, AlertCircle, Clock, FileText, Square, CheckSquare, Printer, Banknote } from 'lucide-react'
import type { ServiceOrder } from '@/lib/validations/service-order'
import { useDeleteServiceOrder, useUpdateServiceOrder } from '@/hooks/use-service-orders'
import { Button } from '@/components/ui/button'
import { generateThermalPDF } from '@/lib/utils/thermal-printer'
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

interface ServiceOrdersTableProps {
  orders: ServiceOrder[]
  onView: (order: ServiceOrder) => void
  onBulkAction?: (action: string, orderIds: string[]) => void
}

const statusColors = {
  pendente: 'bg-yellow-100 dark:bg-yellow-950/50 text-yellow-800 dark:text-yellow-400',
  em_andamento: 'bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-400',
  concluido: 'bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-400',
  cancelado: 'bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-400',
}

const statusLabels = {
  pendente: 'Pendente',
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
}

export function ServiceOrdersTable({ orders, onView, onBulkAction }: ServiceOrdersTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [pendingConcluir, setPendingConcluir] = useState<{ id: string; saldo: number } | null>(null)
  const deleteOrder = useDeleteServiceOrder()
  const updateOrder = useUpdateServiceOrder()

  const handleDelete = async () => {
    if (deleteId) {
      await deleteOrder.mutateAsync(deleteId)
      setDeleteId(null)
    }
  }

  const parseLocalDate = (dateStr: string): Date => {
    const [y, m, d] = dateStr.split('T')[0].split('-').map(Number)
    return new Date(y, m - 1, d)
  }

  const fmtDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('T')[0].split('-')
    return `${d}/${m}/${y}`
  }

  // Verificar se ordem está atrasada
  const isOverdue = (order: ServiceOrder) => {
    if (order.status === 'concluido' || order.status === 'cancelado') return false
    if (!order.data_prevista) return false
    const today = new Date(); today.setHours(0, 0, 0, 0)
    return parseLocalDate(order.data_prevista) < today
  }

  // Calcular dias restantes/atrasados
  const getDaysRemaining = (order: ServiceOrder) => {
    if (!order.data_prevista) return null
    const today = new Date(); today.setHours(0, 0, 0, 0)
    return Math.ceil((parseLocalDate(order.data_prevista).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }

  const handleWhatsAppClick = (order: ServiceOrder) => {
    if (!order.client?.telefone) {
      toast.error('Cliente não possui telefone cadastrado')
      return
    }

    // Remover caracteres especiais do telefone
    const telefone = order.client.telefone.replace(/\D/g, '')
    
    // Verificar se tem código do país, senão adicionar +55 (Brasil)
    const telefoneFormatado = telefone.startsWith('55') ? telefone : `55${telefone}`
    
    // Criar mensagem
    const numeroOrdem = order.numero.toString().padStart(6, '0')
    const nomeCliente = order.client.nome
    const mensagem = encodeURIComponent(
      `Olá ${nomeCliente}!\n\n` +
      `Temos uma ótima notícia!\n\n` +
      `Sua ordem de serviço *#${numeroOrdem}* foi concluída e está pronta para retirada!\n\n` +
      `Aguardamos seu contato para combinar a entrega.\n\n` +
      `Qualquer dúvida, estamos à disposição!`
    )
    
    // Abrir WhatsApp Web
    window.open(`https://wa.me/${telefoneFormatado}?text=${mensagem}`, '_blank')
  }

  const handleWhatsAppWithPDF = (order: ServiceOrder) => {
    if (!order.client?.telefone) {
      toast.error('Cliente não possui telefone cadastrado')
      return
    }

    try {
      // Gerar o PDF primeiro
      generateThermalPDF(order)
      
      // Remover caracteres especiais do telefone
      const telefone = order.client.telefone.replace(/\D/g, '')
      const telefoneFormatado = telefone.startsWith('55') ? telefone : `55${telefone}`
      
      // Criar mensagem
      const numeroOrdem = order.numero.toString().padStart(6, '0')
      const nomeCliente = order.client.nome
      const mensagem = encodeURIComponent(
        `Olá ${nomeCliente}!\n\n` +
        `Segue sua Ordem de Serviço *#${numeroOrdem}*.\n\n` +
        `Por favor, anexe o PDF que acabou de ser baixado.`
      )
      
      // Abrir WhatsApp Web
      window.open(`https://wa.me/${telefoneFormatado}?text=${mensagem}`, '_blank')
      
      toast.success('PDF gerado! Anexe o arquivo no WhatsApp que abriu.', {
        duration: 5000,
      })
    } catch (error) {
      console.error('Erro ao enviar por WhatsApp:', error)
      toast.error('Erro ao preparar envio por WhatsApp')
    }
  }

  const handleStatusChange = async (orderId: string, newStatus: ServiceOrder['status']) => {
    if (newStatus === 'concluido') {
      const order = orders.find(o => o.id === orderId)
      if (order) {
        const saldo = (order.valor_total || 0) - (order.valor_pago || 0)
        if (saldo > 0) {
          setPendingConcluir({ id: orderId, saldo })
          return
        }
      }
    }
    await updateOrder.mutateAsync({ id: orderId, input: { status: newStatus } })
  }

  const confirmConcluir = async () => {
    if (!pendingConcluir) return
    await updateOrder.mutateAsync({ id: pendingConcluir.id, input: { status: 'concluido' } })
    setPendingConcluir(null)
  }

  // Bulk actions
  const toggleSelectOrder = (orderId: string) => {
    const newSelected = new Set(selectedOrders)
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId)
    } else {
      newSelected.add(orderId)
    }
    setSelectedOrders(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set())
    } else {
      setSelectedOrders(new Set(orders.map(o => o.id)))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedOrders.size === 0) return
    
    if (confirm(`Tem certeza que deseja excluir ${selectedOrders.size} ordem(ns)?`)) {
      for (const orderId of selectedOrders) {
        await deleteOrder.mutateAsync(orderId)
      }
      setSelectedOrders(new Set())
    }
  }

  const handleBulkStatusChange = async (newStatus: ServiceOrder['status']) => {
    if (selectedOrders.size === 0) return
    
    for (const orderId of selectedOrders) {
      await updateOrder.mutateAsync({
        id: orderId,
        input: { status: newStatus }
      })
    }
    setSelectedOrders(new Set())
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 bg-card rounded-lg border border-border">
        <p className="text-muted-foreground mb-2">Nenhuma ordem de serviço cadastrada</p>
        <p className="text-sm text-muted-foreground/70">
          Comece criando sua primeira ordem
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Bulk Actions Bar */}
      {selectedOrders.size > 0 && (
        <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="font-medium text-blue-900 dark:text-blue-300">
              {selectedOrders.size} {selectedOrders.size === 1 ? 'ordem selecionada' : 'ordens selecionadas'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkStatusChange(e.target.value as ServiceOrder['status'])
                  e.target.value = ''
                }
              }}
              className="text-sm rounded-md border border-blue-300 dark:border-blue-700 bg-background text-foreground px-3 py-1.5"
            >
              <option value="">Mudar status...</option>
              <option value="pendente">Pendente</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="concluido">Concluído</option>
              <option value="cancelado">Cancelado</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkDelete}
              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/50"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Excluir
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedOrders(new Set())}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Mobile: card list */}
      <div className="sm:hidden space-y-3">
        {orders.map((order) => {
          const overdue = isOverdue(order)
          const daysRemaining = getDaysRemaining(order)
          return (
            <div
              key={order.id}
              className={`bg-card border rounded-lg p-4 ${overdue ? 'border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20' : 'border-border'}`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-bold text-foreground">
                    #{order.numero.toString().padStart(6, '0')}
                  </span>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value as ServiceOrder['status'])}
                    className={`text-xs font-medium px-2 py-0.5 rounded-full border-0 cursor-pointer ${statusColors[order.status]}`}
                    disabled={updateOrder.isPending}
                  >
                    <option value="pendente">Pendente</option>
                    <option value="em_andamento">Em Andamento</option>
                    <option value="concluido">Concluído</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                  {overdue && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/50 px-2 py-0.5 rounded-full">
                      <AlertCircle className="h-3 w-3" />
                      ATRASADA
                    </span>
                  )}
                  {!overdue && daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 3 && order.status !== 'concluido' && order.status !== 'cancelado' && (
                    <span className="flex items-center gap-1 text-xs font-medium text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-950/50 px-2 py-0.5 rounded-full">
                      <Clock className="h-3 w-3" />
                      {daysRemaining === 0 ? 'Hoje' : `${daysRemaining}d`}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => toggleSelectOrder(order.id)}
                  className="text-muted-foreground hover:text-foreground shrink-0"
                >
                  {selectedOrders.has(order.id) ? <CheckSquare className="h-5 w-5 text-blue-600" /> : <Square className="h-5 w-5" />}
                </button>
              </div>

              {/* Cliente */}
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{order.client?.nome || 'Cliente não informado'}</p>
                  {order.client?.telefone && (
                    <p className="text-xs text-muted-foreground">{order.client.telefone}</p>
                  )}
                </div>
              </div>

              {/* Datas + valor */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {fmtDate(order.data_abertura)}
                    {order.data_prevista && <span className="text-muted-foreground/60">→ {fmtDate(order.data_prevista)}</span>}
                  </div>
                  {order.data_conclusao && (
                    <div className="text-green-600 dark:text-green-400">Concluído: {fmtDate(order.data_conclusao)}</div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center text-base font-semibold text-green-600 dark:text-green-400">
                    <DollarSign className="h-4 w-4" />
                    {order.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  {order.items && order.items.length > 0 && (
                    <div className="text-xs text-muted-foreground">{order.items.length} {order.items.length === 1 ? 'item' : 'itens'}</div>
                  )}
                </div>
              </div>

              {/* Badge pagamento pendente */}
              {order.status === 'concluido' && order.status_pagamento !== 'pago' && (
                <button
                  type="button"
                  title="Clique para gerar conta a receber"
                  disabled={updateOrder.isPending}
                  onClick={() => updateOrder.mutateAsync({ id: order.id, input: { status: 'concluido' } })}
                  className="flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/50 hover:bg-amber-200 dark:hover:bg-amber-900/60 px-2 py-1 rounded-full mb-3 transition-colors disabled:opacity-50"
                >
                  <Banknote className="h-3 w-3" />
                  R$ {((order.valor_total || 0) - (order.valor_pago || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} pendente
                </button>
              )}

              {/* Ações */}
              <div className="flex items-center gap-1 border-t border-border pt-3 mt-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                  onClick={() => { try { generateThermalPDF(order); toast.success('PDF gerado!') } catch { toast.error('Erro ao gerar PDF') } }}
                  title="Gerar PDF">
                  <Printer className="h-4 w-4" />
                </Button>
                {order.client?.telefone && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/50"
                    onClick={() => handleWhatsAppWithPDF(order)} title="Enviar por WhatsApp">
                    <FileText className="h-4 w-4" />
                  </Button>
                )}
                {order.status === 'concluido' && order.client?.telefone && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/50"
                    onClick={() => handleWhatsAppClick(order)} title="Notificar conclusão">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onView(order)}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50"
                  onClick={() => setDeleteId(order.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop: table */}
      <div className="hidden sm:block bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={toggleSelectAll}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {selectedOrders.size === orders.length ? (
                      <CheckSquare className="h-5 w-5" />
                    ) : (
                      <Square className="h-5 w-5" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Datas
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Valor Total
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((order) => {
                const overdue = isOverdue(order)
                const daysRemaining = getDaysRemaining(order)
                
                return (
                <tr key={order.id} className={`hover:bg-accent/50 ${overdue ? 'bg-red-50 dark:bg-red-950/20' : ''}`}>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => toggleSelectOrder(order.id)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {selectedOrders.has(order.id) ? (
                        <CheckSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <Square className="h-5 w-5" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-mono text-sm font-semibold text-foreground">
                        #{order.numero.toString().padStart(6, '0')}
                      </div>
                      {overdue && (
                        <div className="flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/50 px-2 py-1 rounded-full">
                          <AlertCircle className="h-3 w-3" />
                          ATRASADA
                        </div>
                      )}
                      {!overdue && daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 3 && order.status !== 'concluido' && order.status !== 'cancelado' && (
                        <div className="flex items-center gap-1 text-xs font-medium text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-950/50 px-2 py-1 rounded-full">
                          <Clock className="h-3 w-3" />
                          {daysRemaining === 0 ? 'Hoje' : `${daysRemaining}d`}
                        </div>
                      )}
                      {order.status === 'concluido' && order.status_pagamento !== 'pago' && (
                        <button
                          type="button"
                          title="Clique para gerar conta a receber em Financeiro"
                          disabled={updateOrder.isPending}
                          onClick={() => updateOrder.mutateAsync({ id: order.id, input: { status: 'concluido' } })}
                          className="flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/50 hover:bg-amber-200 dark:hover:bg-amber-900/60 px-2 py-1 rounded-full cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Banknote className="h-3 w-3" />
                          R$ {((order.valor_total || 0) - (order.valor_pago || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} pendente
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-muted-foreground mr-2" />
                      <div>
                        <div className="font-medium text-foreground">
                          {order.client?.nome || 'Cliente não informado'}
                        </div>
                        {order.client?.telefone && (
                          <div className="text-sm text-muted-foreground">
                            {order.client.telefone}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value as ServiceOrder['status'])}
                      className={`text-xs font-medium px-3 py-1 rounded-full border-0 cursor-pointer ${statusColors[order.status]}`}
                      disabled={updateOrder.isPending}
                    >
                      <option value="pendente">Pendente</option>
                      <option value="em_andamento">Em Andamento</option>
                      <option value="concluido">Concluído</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm space-y-1">
                      <div className="flex items-center text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1" />
                        Abertura: {fmtDate(order.data_abertura)}
                      </div>
                      {order.data_prevista && (
                        <div className="text-muted-foreground">
                          Previsão: {fmtDate(order.data_prevista)}
                        </div>
                      )}
                      {order.data_conclusao && (
                        <div className="text-green-600 dark:text-green-400">
                          Conclusão: {fmtDate(order.data_conclusao)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end text-lg font-semibold text-green-600 dark:text-green-400">
                      <DollarSign className="h-4 w-4" />
                      {order.valor_total.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    {order.items && order.items.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          try {
                            generateThermalPDF(order)
                            toast.success('PDF gerado com sucesso!')
                          } catch (error) {
                            toast.error('Erro ao gerar PDF')
                          }
                        }}
                        title="Gerar PDF para impressora térmica"
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      {order.client?.telefone && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleWhatsAppWithPDF(order)}
                          title="Enviar ordem por WhatsApp"
                          className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-950/50"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      )}
                      {order.status === 'concluido' && order.client?.telefone && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleWhatsAppClick(order)}
                          title="Notificar conclusão via WhatsApp"
                          className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-950/50"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onView(order)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(order.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta ordem de serviço? Esta ação não pode ser
              desfeita e todos os itens serão removidos.
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

      <AlertDialog open={!!pendingConcluir} onOpenChange={() => setPendingConcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-amber-600" />
              Pagamento pendente
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Esta OS possui um saldo de{' '}
                  <span className="font-semibold text-amber-700 dark:text-amber-400">
                    R$ {pendingConcluir?.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>{' '}
                  ainda não pago.
                </p>
                <p>
                  Ao concluir, uma <strong>conta a receber</strong> será gerada automaticamente
                  em <em>Financeiro → Contas a Receber</em>.
                </p>
                <p>Deseja marcar como concluída mesmo assim?</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmConcluir}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Concluir mesmo assim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
