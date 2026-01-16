'use client'

import { useState } from 'react'
import { Printer, X, MessageCircle } from 'lucide-react'
import type { ServiceOrder } from '@/lib/validations/service-order'
import { generateThermalPreview, generateThermalPDF } from '@/lib/utils/thermal-printer'
import { usePaymentMethods } from '@/hooks/use-payment-methods'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface OrderPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: ServiceOrder | null
  organizationName?: string
  onConfirm?: () => void
  confirmButtonText?: string
  showConfirmButton?: boolean
}

export function OrderPreviewDialog({ 
  open, 
  onOpenChange, 
  order,
  organizationName = 'CRM Atelier',
  onConfirm,
  confirmButtonText = 'Confirmar e Salvar',
  showConfirmButton = false
}: OrderPreviewDialogProps) {
  const [printing, setPrinting] = useState(false)
  const { data: paymentMethods = [] } = usePaymentMethods()

  // Converter código da forma de pagamento para nome
  const getPaymentMethodName = (code: string | null | undefined): string => {
    if (!code) return ''
    const method = paymentMethods.find(m => m.code === code)
    return method?.name || code
  }

  // Criar ordem com forma de pagamento traduzida
  const orderWithPaymentName = order ? {
    ...order,
    forma_pagamento: getPaymentMethodName(order.forma_pagamento)
  } : null

  const handlePrint = () => {
    if (!orderWithPaymentName) return
    try {
      setPrinting(true)
      generateThermalPDF(orderWithPaymentName, organizationName)
      toast.success('PDF gerado com sucesso!')
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      toast.error('Erro ao gerar PDF')
    } finally {
      setPrinting(false)
    }
  }

  const handleWhatsApp = () => {
    if (!orderWithPaymentName || !orderWithPaymentName.client?.telefone) {
      toast.error('Cliente não possui telefone cadastrado')
      return
    }

    try {
      // Gerar o PDF primeiro
      generateThermalPDF(orderWithPaymentName, organizationName)
      
      // Formatar telefone (remover caracteres especiais)
      const phone = orderWithPaymentName.client.telefone.replace(/\D/g, '')
      const phoneWithCountry = phone.startsWith('55') ? phone : `55${phone}`
      
      // Criar mensagem
      const orderNumber = orderWithPaymentName.numero.toString().padStart(6, '0')
      const message = `Olá ${orderWithPaymentName.client.nome}! Segue sua Ordem de Serviço #${orderNumber}.\n\nPor favor, anexe o PDF que acabou de ser baixado no seu computador.`
      
      // Abrir WhatsApp Web
      const whatsappUrl = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`
      window.open(whatsappUrl, '_blank')
      
      toast.success('PDF gerado! Anexe o arquivo no WhatsApp que abriu.', {
        duration: 5000,
      })
    } catch (error) {
      console.error('Erro ao enviar por WhatsApp:', error)
      toast.error('Erro ao preparar envio por WhatsApp')
    }
  }

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm()
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent className="sm:max-w-125 max-h-[90vh] overflow-y-auto z-100">
        <DialogHeader>
          <DialogTitle>Preview da Ordem de Serviço</DialogTitle>
          <DialogDescription>
            Visualização de como ficará a impressão térmica
          </DialogDescription>
        </DialogHeader>

        {orderWithPaymentName && (
          <>
            <div className="my-4">
              <div 
                className="overflow-auto"
                dangerouslySetInnerHTML={{ __html: generateThermalPreview(orderWithPaymentName, organizationName) }}
              />
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1 sm:flex-initial"
                >
                  <X className="h-4 w-4 mr-2" />
                  Fechar
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrint}
                  disabled={printing}
                  className="flex-1 sm:flex-initial"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Baixar PDF
                </Button>

                {orderWithPaymentName.client?.telefone && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleWhatsApp}
                    className="flex-1 sm:flex-initial text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Enviar WhatsApp
                  </Button>
                )}
              </div>

              {showConfirmButton && (
                <Button
                  type="button"
                  onClick={handleConfirm}
                  className="w-full sm:w-auto"
                >
                  {confirmButtonText}
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
