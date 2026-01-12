'use client'

import { useState } from 'react'
import { X, Mail, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface BulkActionsModalProps {
  selectedCount: number
  onClose: () => void
  onSendEmail: (subject: string, message: string) => Promise<void>
  onExport: () => void
}

export function BulkActionsModal({
  selectedCount,
  onClose,
  onSendEmail,
  onExport,
}: BulkActionsModalProps) {
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [sending, setSending] = useState(false)

  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailMessage.trim()) {
      alert('Preencha o assunto e a mensagem')
      return
    }

    setSending(true)
    try {
      await onSendEmail(emailSubject, emailMessage)
      setShowEmailModal(false)
      setEmailSubject('')
      setEmailMessage('')
    } catch (error) {
      console.error('Erro ao enviar emails:', error)
      alert('Erro ao enviar emails')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* Toolbar de Ações */}
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            {selectedCount} {selectedCount === 1 ? 'organização selecionada' : 'organizações selecionadas'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEmailModal(true)}
            className="gap-2"
          >
            <Mail className="w-4 h-4" />
            Enviar Email
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Modal de Email */}
      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent className="sm:max-w-150">
          <DialogHeader>
            <DialogTitle>Enviar Email em Massa</DialogTitle>
            <DialogDescription>
              Enviar email para {selectedCount} {selectedCount === 1 ? 'organização' : 'organizações'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Assunto
              </label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="Digite o assunto do email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mensagem
              </label>
              <textarea
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none"
                placeholder="Digite a mensagem do email"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowEmailModal(false)}
              disabled={sending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={sending}
            >
              {sending ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
