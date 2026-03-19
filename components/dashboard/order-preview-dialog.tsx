'use client'

import { useState } from 'react'
import { Printer, X, MessageCircle } from 'lucide-react'
import type { ServiceOrder } from '@/lib/validations/service-order'
import { generateThermalPreview, generateThermalPDF, generateWhatsAppText } from '@/lib/utils/thermal-printer'
import { usePaymentMethods } from '@/hooks/use-payment-methods'
import { useOrganizationSettings, useFinancialSettings } from '@/hooks/use-settings'
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
  organizationName = 'Meu Atelier',
  onConfirm,
  confirmButtonText = 'Confirmar e Salvar',
  showConfirmButton = false
}: OrderPreviewDialogProps) {
  const [printing, setPrinting] = useState(false)
  const { data: paymentMethods = [] } = usePaymentMethods()
  const { data: orgSettings } = useOrganizationSettings()
  const { data: financialSettings } = useFinancialSettings()

  const orgData = orgSettings ? {
    name: orgSettings.name || organizationName,
    instagram: orgSettings.instagram,
    facebook: orgSettings.facebook,
    twitter: orgSettings.twitter,
    tiktok: orgSettings.tiktok,
    kwai: orgSettings.kwai,
    pix_key: financialSettings?.pix_key || null,
    show_pix_key_on_order: financialSettings?.show_pix_key_on_order || false,
  } : undefined

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
      generateThermalPDF(orderWithPaymentName, orgData?.name || organizationName, orgData)
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
      // Formatar telefone (remover caracteres especiais)
      const phone = orderWithPaymentName.client.telefone.replace(/\D/g, '')
      const phoneWithCountry = phone.startsWith('55') ? phone : `55${phone}`

      // Gerar mensagem formatada igual ao cupom
      const message = generateWhatsAppText(orderWithPaymentName, orgData?.name || organizationName, orgData)

      // Abrir WhatsApp Web com a OS completa
      const whatsappUrl = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`
      window.open(whatsappUrl, '_blank')

      toast.success('WhatsApp aberto com a OS formatada!')
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
      <DialogContent className="flex flex-col w-[calc(100vw-2rem)] max-w-lg max-h-[92vh] p-0 gap-0 overflow-hidden">
        {/* Header fixo */}
        <DialogHeader className="shrink-0 px-6 pt-5 pb-3 border-b border-border">
          <DialogTitle>Preview da Ordem de Serviço</DialogTitle>
          <DialogDescription>
            Visualização de como ficará a impressão térmica
          </DialogDescription>
        </DialogHeader>

        {/* Preview com scroll independente */}
        {orderWithPaymentName && (
          <div className="flex-1 overflow-y-auto min-h-0 px-6 py-4">
            <div
              dangerouslySetInnerHTML={{ __html: generateThermalPreview(orderWithPaymentName, orgData?.name || organizationName, orgData) }}
            />
          </div>
        )}

        {/* Footer fixo */}
        {orderWithPaymentName && (
          <div className="shrink-0 border-t border-border px-6 py-4">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4 mr-1.5" />
                Fechar
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrint}
                disabled={printing}
              >
                <Printer className="h-4 w-4 mr-1.5" />
                Baixar PDF
              </Button>

              {orderWithPaymentName.client?.telefone && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleWhatsApp}
                  className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/30 border-green-300 dark:border-green-800"
                >
                  <MessageCircle className="h-4 w-4 mr-1.5" />
                  Enviar WhatsApp
                </Button>
              )}

              {showConfirmButton && (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleConfirm}
                  className="ml-auto"
                >
                  {confirmButtonText}
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
