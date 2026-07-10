'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

// Captura erros no layout raiz (fora do ErrorBoundary normal)
// Precisa renderizar seu próprio <html>/<body>
export default function GlobalError({
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
        errorType: 'global',
        severity:  'critical',
        url:       typeof window !== 'undefined' ? window.location.href : '',
        extra:     { digest: error.digest },
      }),
    }).catch(() => {})
  }, [error])

  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#f8fafc' }}>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
        }}>
          <div style={{ maxWidth: '400px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '80px',
              height: '80px',
              borderRadius: '16px',
              background: '#fee2e2',
              marginBottom: '24px',
            }}>
              <AlertTriangle style={{ width: '40px', height: '40px', color: '#dc2626' }} />
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
              Sistema temporariamente indisponível
            </h1>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '32px', lineHeight: '1.6' }}>
              Ocorreu um erro crítico no sistema. Nossa equipe foi notificada e está trabalhando para resolver.
            </p>
            {error.digest && (
              <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '24px', fontFamily: 'monospace' }}>
                Código: {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#4f46e5',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <RefreshCw style={{ width: '16px', height: '16px' }} />
              Tentar novamente
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
