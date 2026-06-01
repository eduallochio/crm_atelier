'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Printer, X, MessageCircle, Loader2 } from 'lucide-react'
import type { ServiceOrder } from '@/lib/validations/service-order'
import { generateThermalPreview, generateWhatsAppText } from '@/lib/utils/thermal-printer'
import { usePaymentMethods } from '@/hooks/use-payment-methods'
import { useOrganizationSettings, useFinancialSettings, useOrderSettings } from '@/hooks/use-settings'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface OrderPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: ServiceOrder | null
  organizationName?: string
  onConfirm?: () => Promise<void> | void
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
  const { data: orderSettings } = useOrderSettings()
  const printerWidth = orderSettings?.printer_width ?? '80mm'

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
    setPrinting(true)
    try {
      const html = generateThermalPreview(orderWithPaymentName, orgData?.name || organizationName, orgData)
      const win = window.open('', '_blank', 'width=400,height=600')
      if (!win) { toast.error('Permita pop-ups para imprimir'); return }
      win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>OS</title><style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: monospace; font-size: 12px; background: #fff; color: #000; padding: 8px; }
        @media print { @page { margin: 4mm; size: ${printerWidth} auto; } }
      </style></head><body>${html}</body></html>`)
      win.document.close()
      win.focus()
      win.onload = () => { win.print(); win.close() }
      // fallback caso onload já tenha disparado antes de ser atribuído
      setTimeout(() => { if (!win.closed) { win.print(); win.close() } }, 1000)
    } catch (error) {
      console.error('Erro ao imprimir:', error)
      toast.error('Erro ao imprimir')
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

  const [confirming, setConfirming] = useState(false)

  const handleConfirm = async () => {
    if (!onConfirm) return
    setConfirming(true)
    try {
      await onConfirm()
    } finally {
      setConfirming(false)
      onOpenChange(false)
    }
  }

  if (!open) return null

  const content = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative flex flex-col w-full max-w-lg max-h-[92vh] bg-background rounded-xl shadow-2xl border border-border overflow-hidden">
        {/* Header fixo */}
        <div className="shrink-0 px-6 pt-5 pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Preview da Ordem de Serviço</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Visualização de como ficará a impressão</p>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

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
                Imprimir
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
                  disabled={confirming}
                  className="ml-auto gap-2"
                >
                  {confirming && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {confirming ? 'Salvando...' : confirmButtonText}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
