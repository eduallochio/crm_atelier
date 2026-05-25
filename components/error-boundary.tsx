'use client'

import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

async function reportError(error: Error, componentStack?: string, errorType = 'boundary') {
  try {
    await fetch('/api/admin/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message:        error.message,
        stack:          error.stack,
        componentStack,
        errorType,
        severity:       'error',
        url:            window.location.href,
      }),
    })
  } catch {
    // silencioso — não deixar o reporter causar mais erros
  }
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    if (error.message === 'NEXT_REDIRECT' || error.message?.startsWith('NEXT_')) {
      return { hasError: false, error: null }
    }
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (error.message === 'NEXT_REDIRECT' || error.message?.startsWith('NEXT_')) return
    reportError(error, info.componentStack ?? undefined, 'boundary')
  }

  render() {
    if (this.state.hasError) {
      const isDev = process.env.NODE_ENV === 'development'
      return (
        <div className="min-h-[300px] flex flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">Algo deu errado</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              {isDev
                ? (this.state.error?.message || 'Erro inesperado')
                : 'Ocorreu um erro inesperado. Nossa equipe foi notificada.'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              this.setState({ hasError: false, error: null })
              window.location.reload()
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Recarregar página
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}

// Hook para capturar erros globais (unhandledrejection + onerror)
export function useGlobalErrorReporter() {
  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.message === 'NEXT_REDIRECT' || event.message?.startsWith('NEXT_')) return
      reportError(new Error(event.message), undefined, 'runtime')
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason))
      if (error.message === 'NEXT_REDIRECT' || error.message?.startsWith('NEXT_')) return
      reportError(error, undefined, 'unhandled_promise')
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])
}
