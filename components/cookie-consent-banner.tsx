'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Cookie } from 'lucide-react'
import Link from 'next/link'

export function CookieConsentBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Verificar se já existe consentimento
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      // Mostrar banner após 1 segundo
      const timer = setTimeout(() => setShow(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const acceptAll = () => {
    localStorage.setItem('cookie-consent', 'all')
    localStorage.setItem('cookie-consent-date', new Date().toISOString())
    setShow(false)
  }

  const acceptNecessary = () => {
    localStorage.setItem('cookie-consent', 'necessary')
    localStorage.setItem('cookie-consent-date', new Date().toISOString())
    setShow(false)
  }

  const closeBanner = () => {
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
      <div className="bg-linear-to-r from-gray-900 via-gray-800 to-gray-900 text-white shadow-2xl border-t-2 border-blue-500">
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Ícone e Texto */}
            <div className="flex items-start gap-3 flex-1">
              <Cookie className="h-6 w-6 text-blue-400 shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">🍪 Cookies e Privacidade</h3>
                <p className="text-sm text-gray-300 leading-relaxed">
                  Usamos cookies essenciais para manter você autenticado e melhorar sua experiência. 
                  Ao continuar navegando, você concorda com nossa{' '}
                  <Link href="/privacidade" className="text-blue-400 hover:text-blue-300 underline font-medium">
                    Política de Privacidade
                  </Link>
                  {' '}e{' '}
                  <Link href="/termos" className="text-blue-400 hover:text-blue-300 underline font-medium">
                    Termos de Uso
                  </Link>.
                </p>
              </div>
            </div>

            {/* Botões */}
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={acceptNecessary}
                className="bg-transparent border-gray-600 hover:bg-gray-700 hover:border-gray-500 text-white"
              >
                Apenas Essenciais
              </Button>
              <Button 
                size="sm" 
                onClick={acceptAll}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Aceitar Todos
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeBanner}
                className="hover:bg-gray-700 text-gray-400 hover:text-white sm:ml-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Informação Extra */}
          <div className="mt-3 pt-3 border-t border-gray-700">
            <p className="text-xs text-gray-400">
              💡 <strong>Cookies usados:</strong> Autenticação de usuário e preferências de tema. 
              Não rastreamos você para publicidade.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
