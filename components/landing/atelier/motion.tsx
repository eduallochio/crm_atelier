'use client'

import { createContext, useCallback, useContext, useSyncExternalStore } from 'react'

/**
 * Preferência de movimento da landing.
 * - respeita "reduzir movimento" do sistema operacional;
 * - permite pausar as animações por um botão no rodapé (salvo no navegador).
 */

export const MOTION_KEY = 'landing-motion-off'
const EVT = 'landing-motion-change'

interface MotionPref {
  /** true quando as animações podem rodar */
  enabled: boolean
  /** true depois da hidratação (a preferência já foi lida no navegador) */
  ready: boolean
  /** o sistema pede movimento reduzido (o botão não sobrepõe isso) */
  systemReduced: boolean
  toggle: () => void
}

const Ctx = createContext<MotionPref>({ enabled: false, ready: false, systemReduced: false, toggle: () => {} })

const QUERY = '(prefers-reduced-motion: reduce)'
function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia(QUERY)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}
function readUserOff() {
  try { return localStorage.getItem(MOTION_KEY) === '1' } catch { return false }
}
function subscribeUser(cb: () => void) {
  window.addEventListener(EVT, cb)
  window.addEventListener('storage', cb)
  return () => { window.removeEventListener(EVT, cb); window.removeEventListener('storage', cb) }
}
const noop = () => () => {}

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const ready = useSyncExternalStore(noop, () => true, () => false)
  const systemReduced = useSyncExternalStore(subscribeReduced, () => window.matchMedia(QUERY).matches, () => false)
  const userOff = useSyncExternalStore(subscribeUser, readUserOff, () => false)

  const toggle = useCallback(() => {
    try { localStorage.setItem(MOTION_KEY, readUserOff() ? '0' : '1') } catch { /* storage bloqueado */ }
    window.dispatchEvent(new Event(EVT))
  }, [])

  return (
    <Ctx.Provider value={{ enabled: ready && !userOff && !systemReduced, ready, systemReduced, toggle }}>
      {children}
    </Ctx.Provider>
  )
}

export function useMotionPref() {
  return useContext(Ctx)
}
