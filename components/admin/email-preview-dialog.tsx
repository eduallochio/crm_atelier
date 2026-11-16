'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmailPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fetchUrl: string
}

// Preview do HTML de um email, carregado via iframe isolado (não
// dangerouslySetInnerHTML) — o HTML do email é um documento completo com
// <head>/<style> próprios, que quebrariam renderizados fora de um documento
// isolado; srcDoc evita conflito de CSS com a página do admin.
export function EmailPreviewDialog({ open, onOpenChange, fetchUrl }: EmailPreviewDialogProps) {
  const [html, setHtml] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setHtml(null)
    fetch(fetchUrl)
      .then((res) => res.ok ? res.text() : Promise.reject())
      .then(setHtml)
      .catch(() => setHtml('<p style="font-family:sans-serif;padding:24px;">Erro ao carregar o preview.</p>'))
      .finally(() => setLoading(false))
  }, [open, fetchUrl])

  if (!open) return null

  const content = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={() => onOpenChange(false)} />
      <div className="relative flex flex-col w-full max-w-2xl max-h-[92vh] bg-background rounded-xl shadow-2xl border border-border overflow-hidden">
        <div className="shrink-0 px-6 pt-5 pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Preview do email</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Como a organização vai ver na caixa de entrada</p>
            </div>
            <button onClick={() => onOpenChange(false)} className="p-1.5 rounded-md hover:bg-muted transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 bg-muted/30">
          {loading ? (
            <div className="flex items-center justify-center h-full py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <iframe srcDoc={html ?? ''} title="Preview do email" className="w-full h-[70vh] border-0" />
          )}
        </div>

        <div className="shrink-0 border-t border-border px-6 py-4">
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-1.5" />
            Fechar
          </Button>
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
