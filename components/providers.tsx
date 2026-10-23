'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useSystemPreferences } from '@/hooks/use-settings'
import { ErrorBoundary, useGlobalErrorReporter } from '@/components/error-boundary'
import { NewVersionToast } from '@/components/new-version-toast'

// páginas abertas sem login: lá não há preferências para buscar (a API responderia 401)
const PUBLIC_PATHS = ['/promo', '/login', '/cadastro', '/esqueci-senha', '/redefinir-senha', '/confirmar-email', '/termos', '/privacidade', '/lgpd', '/manutencao', '/auth']
const isPublicPath = (p: string) => p === '/' || PUBLIC_PATHS.some((x) => p === x || p.startsWith(`${x}/`))

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/'
  const { data: preferences } = useSystemPreferences({ enabled: !isPublicPath(pathname) })

  useEffect(() => {
    if (preferences?.theme) {
      const root = document.documentElement
      const body = document.body
      
      // Remover classes anteriores
      root.classList.remove('light', 'dark')
      
      if (preferences.theme === 'auto') {
        // Detectar preferência do sistema
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        root.classList.add(isDark ? 'dark' : 'light')
      } else {
        root.classList.add(preferences.theme)
      }
      
      // Aplicar classes de cor ao body
      body.className = body.className.replace(/bg-\S+/g, '').replace(/text-\S+/g, '')
      if (root.classList.contains('dark')) {
        body.classList.add('bg-background', 'text-foreground')
      } else {
        body.classList.add('bg-background', 'text-foreground')
      }
    }
  }, [preferences?.theme])

  return <>{children}</>
}

function GlobalErrorReporter({ children }: { children: React.ReactNode }) {
  useGlobalErrorReporter()
  return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,  // 5 minutos — evita refetch entre navegações
            gcTime:    10 * 60 * 1000, // 10 minutos — mantém cache em memória
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <GlobalErrorReporter>
          <ThemeProvider>
            <NewVersionToast />
            {children}
          </ThemeProvider>
        </GlobalErrorReporter>
      </ErrorBoundary>
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}
