'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
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
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/50 mb-5">
        <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
      </div>

      <h2 className="text-lg font-semibold text-foreground mb-2">
        Erro ao carregar esta página
      </h2>
      <p className="text-sm text-muted-foreground max-w-sm mb-1">
        Ocorreu um problema inesperado. O restante do sistema continua funcionando normalmente.
      </p>
      {error.digest && (
        <p className="text-xs text-muted-foreground/50 font-mono mb-6">
          Código: {error.digest}
        </p>
      )}
      {!error.digest && <div className="mb-6" />}

      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={reset} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </Button>
        <Button variant="outline" asChild>
          <a href="/dashboard" className="gap-2 inline-flex items-center">
            <Home className="h-4 w-4" />
            Ir para o Dashboard
          </a>
        </Button>
      </div>
    </div>
  )
}
