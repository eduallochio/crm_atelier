'use client'

import { useEffect, useCallback } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

const SESSION_KEY = 'atelier_sid'
const CONSENT_KEY = 'cookie-consent'

function generateSessionId(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function getSessionId(): string {
  try {
    let sid = localStorage.getItem(SESSION_KEY)
    if (!sid) {
      sid = generateSessionId()
      localStorage.setItem(SESSION_KEY, sid)
    }
    return sid
  } catch {
    return generateSessionId()
  }
}

function getConsent(): string | null {
  try {
    return localStorage.getItem(CONSENT_KEY)
  } catch {
    return null
  }
}

function getUtms(searchParams: URLSearchParams | null): {
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
} {
  return {
    utm_source:   searchParams?.get('utm_source')   ?? null,
    utm_medium:   searchParams?.get('utm_medium')   ?? null,
    utm_campaign: searchParams?.get('utm_campaign') ?? null,
  }
}

/**
 * Hook principal de tracking.
 * Retorna a função `track(eventType, metadata?)` que envia eventos
 * para /api/events de forma fire-and-forget, respeitando o consentimento LGPD.
 */
export function useTrack() {
  const pathname    = usePathname()
  const searchParams = useSearchParams()

  const track = useCallback(
    (eventType: string, metadata?: Record<string, unknown>) => {
      // Respeita LGPD: só rastreia se o usuário aceitou cookies além dos necessários
      const consent = getConsent()
      if (consent === 'necessary') return

      const session_id = getSessionId()
      const { utm_source, utm_medium, utm_campaign } = getUtms(searchParams)
      const referrer = typeof document !== 'undefined' ? document.referrer || null : null

      const payload = {
        event_type: eventType,
        session_id,
        page:        pathname,
        referrer,
        utm_source,
        utm_medium,
        utm_campaign,
        metadata: metadata ?? null,
      }

      // Fire-and-forget — nunca bloqueia nem propaga erros
      fetch('/api/events', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
        // keepalive permite que a requisição sobreviva ao unload da página
        keepalive: true,
      }).catch(() => {/* silencia erros de rede */})
    },
    [pathname, searchParams],
  )

  return { track }
}

/**
 * Hook conveniente: dispara um `page_view` no mount do componente.
 * @param page - página opcional; se omitido usa o pathname atual do Next.js
 */
export function usePageView(page?: string) {
  const pathname    = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const consent = getConsent()
    if (consent === 'necessary') return

    const session_id = getSessionId()
    const { utm_source, utm_medium, utm_campaign } = getUtms(searchParams)
    const referrer = typeof document !== 'undefined' ? document.referrer || null : null

    const payload = {
      event_type: 'page_view',
      session_id,
      page:        page ?? pathname,
      referrer,
      utm_source,
      utm_medium,
      utm_campaign,
      metadata:    null,
    }

    fetch('/api/events', {
      method:    'POST',
      headers:   { 'Content-Type': 'application/json' },
      body:      JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {/* silencia erros de rede */})
  // Executa apenas no mount — dependências intencionalmente omitidas
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
