'use client'

import { useState, useEffect } from 'react'
import { Cookie, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

type Consent = 'accepted' | 'necessary'

export function CookieConsentBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      const timer = setTimeout(() => setShow(true), 800)
      return () => clearTimeout(timer)
    }
  }, [])

  const save = (value: Consent) => {
    localStorage.setItem('cookie-consent', value)
    localStorage.setItem('cookie-consent-date', new Date().toISOString())
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-gray-950 border-t border-gray-800 shadow-2xl">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">

            {/* Ícone + Texto */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <Cookie className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-white mb-0.5">
                  Cookies e Privacidade
                </p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Usamos apenas cookies <strong className="text-gray-300">essenciais</strong> para autenticação e preferências de tema.{' '}
                  <strong className="text-gray-300">Não usamos rastreamento, analytics ou publicidade.</strong>{' '}
                  Saiba mais em nossa{' '}
                  <Link href="/privacidade" className="text-amber-400 hover:text-amber-300 underline">
                    Política de Privacidade
                  </Link>.
                </p>
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => save('necessary')}
                className="text-gray-400 hover:text-white hover:bg-gray-800 text-xs h-8 px-3"
              >
                Só essenciais
              </Button>
              <Button
                size="sm"
                onClick={() => save('accepted')}
                className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold text-xs h-8 px-4"
              >
                <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
                Entendido
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Hook para verificar o consentimento atual.
 * Retorna null enquanto o componente não estiver montado (SSR safe).
 */
export function useCookieConsent(): Consent | null {
  const [consent, setConsent] = useState<Consent | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('cookie-consent') as Consent | null
    setConsent(stored)
  }, [])

  return consent
}
