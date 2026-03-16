'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, useEffect } from 'react'
import { useSystemPreferences } from '@/hooks/use-settings'

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: preferences } = useSystemPreferences()

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

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minuto
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {children}
      </ThemeProvider>
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}
