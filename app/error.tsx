'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Ignora erros internos do Next.js
    if (error.message?.startsWith('NEXT_')) return
    fetch('/api/admin/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message:   error.message,
        stack:     error.stack,
        errorType: 'page',
        severity:  'error',
        url:       window.location.href,
        extra:     { digest: error.digest },
      }),
    }).catch(() => {})
  }, [error])

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 dark:bg-red-950/50 rounded-2xl mb-6">
          <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="text-xl font-semibold text-foreground mb-3">Algo deu errado</h1>
        <p className="text-muted-foreground text-sm mb-8">
          Ocorreu um erro inesperado nesta página. Nossa equipe foi notificada automaticamente.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/60 mb-6 font-mono">
            Código: {error.digest}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 text-white px-5 py-2.5 text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </button>
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
          >
            <Home className="h-4 w-4" />
            Ir para o Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
