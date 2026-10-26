'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'

const SERIF = { fontFamily: "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif" }
const PENDING_KEY = 'ma-pro-pendente'
const PENDING_EVENT = 'ma-pro-pendente'

/**
 * Pagamento iniciado e ainda não confirmado pelo Asaas. O plano só vira Pro quando o
 * Asaas confirma (webhook), então a comemoração espera por isso:
 * - 'aguardando': quem cuida é o ProCelebrationWatcher (pergunta a cada 5 s e comemora)
 * - 'pix-na-tela': a janela do PIX está aberta e cuida sozinha (visto costurado + comemoração)
 */
type PendingMode = 'aguardando' | 'pix-na-tela'
const PENDING_MAX_MS = 48 * 60 * 60 * 1000 // PIX abandonado: depois de 2 dias para de esperar
export function markProPending(mode: PendingMode = 'aguardando') {
  try { localStorage.setItem(PENDING_KEY, `${mode}|${Date.now()}`) } catch { /* storage bloqueado */ }
  window.dispatchEvent(new Event(PENDING_EVENT))
}
export function clearProPending() {
  try { localStorage.removeItem(PENDING_KEY) } catch { /* storage bloqueado */ }
  window.dispatchEvent(new Event(PENDING_EVENT))
}
function pendingMode(): PendingMode | null {
  try {
    const v = localStorage.getItem(PENDING_KEY)
    if (!v) return null
    const [mode, at] = v.split('|')
    if (!at || Date.now() - Number(at) > PENDING_MAX_MS) { localStorage.removeItem(PENDING_KEY); return null }
    return mode === 'pix-na-tela' ? 'pix-na-tela' : 'aguardando'
  } catch { return null }
}

const UNLOCKED = [
  'Clientes, serviços e ordens ilimitados',
  'Financeiro e caixa liberados',
  'Estoque e fornecedores liberados',
]

/** pesponto 7/6 desenhado até "len" (de 400) — o resto fica vazio */
function dashUpTo(len: number) {
  const parts: number[] = []
  let acc = 0
  while (acc + 13 <= len) { parts.push(7, 6); acc += 13 }
  parts.push(Math.max(0.01, Math.min(7, len - acc)), 400)
  return parts.join(' ')
}

/**
 * Comemoração do plano Pro: a agulha costura um selo "PRO" e aparecem os recursos liberados.
 * Aparece logo depois da assinatura (cartão, 3DS ou PIX confirmado).
 */
export function PlanCelebration({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      {open && <CelebrationContent onClose={onClose} />}
    </Dialog>
  )
}

function CelebrationContent({ onClose }: { onClose: () => void }) {
  const ring = useRef<SVGCircleElement>(null)
  const needle = useRef<SVGGElement>(null)
  const pro = useRef<SVGTextElement>(null)
  const rest = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const r = ring.current, n = needle.current, p = pro.current, box = rest.current
    if (!r || !n || !p || !box) return
    if (reduce) { box.style.opacity = '1'; return }

    // estado inicial
    r.style.strokeDasharray = dashUpTo(0)
    p.style.opacity = '0'
    n.style.opacity = '1'
    const items = Array.from(box.querySelectorAll<HTMLElement>('[data-step]'))
    items.forEach((el) => { el.style.opacity = '0'; el.style.transform = 'translateY(8px)' })
    box.style.opacity = '1'

    let raf = 0
    const T = 1700, start = performance.now() + 450
    const step = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / T))
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
      r.style.strokeDasharray = e >= 0.998 ? '7 6' : dashUpTo(400 * e)
      const ang = -Math.PI / 2 + e * Math.PI * 2
      const x = 80 + 64 * Math.cos(ang), y = 80 + 64 * Math.sin(ang)
      n.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(ang * 180 / Math.PI + 115).toFixed(1)})`)
      if (t < 1) { raf = requestAnimationFrame(step); return }
      n.style.opacity = '0'
      p.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 450, fill: 'forwards', easing: 'ease-out' })
      items.forEach((el, i) => el.animate(
        [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }],
        { duration: 420, delay: 250 + i * 220, fill: 'forwards', easing: 'cubic-bezier(.2,.7,.2,1)' },
      ))
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <DialogContent
      className="w-[calc(100vw-2rem)] max-w-md overflow-hidden rounded-2xl border-0 p-0 text-[#F7F0E6] shadow-2xl [&>button]:text-[#F7F0E6]/80 [&>button:hover]:text-[#F7F0E6]"
      style={{ background: 'repeating-linear-gradient(0deg, rgba(255,248,240,.03) 0 1px, transparent 1px 4px), repeating-linear-gradient(90deg, rgba(255,248,240,.025) 0 1px, transparent 1px 5px), #2C1810' }}
    >
      <div className="px-6 pb-6 pt-8 text-center sm:px-8">
        <svg viewBox="0 0 160 160" className="mx-auto block w-36 overflow-visible" aria-hidden="true">
          <circle cx="80" cy="80" r="64" fill="rgba(200,113,74,.16)" />
          <circle ref={ring} cx="80" cy="80" r="64" fill="none" stroke="#D4A85A" strokeWidth="3" strokeLinecap="round" pathLength={400} style={{ strokeDasharray: '7 6' }} />
          <circle cx="80" cy="80" r="52" fill="none" stroke="rgba(233,200,135,.35)" strokeWidth="1" />
          <text ref={pro} x="80" y="95" textAnchor="middle" fontWeight="600" fontSize="44" fill="#FFF8F0" style={SERIF}>PRO</text>
          <g ref={needle} style={{ opacity: 0 }}>
            <line x1="0" y1="-18" x2="0" y2="14" stroke="#E7DED2" strokeWidth="2.6" strokeLinecap="round" />
            <ellipse cx="0" cy="-13" rx="1.4" ry="3.2" fill="#2C1810" />
          </g>
        </svg>

        <div ref={rest}>
          <DialogTitle data-step className="mt-3 text-[30px] font-normal leading-tight text-[#F7F0E6]" style={SERIF}>
            Seu plano <em className="text-[#E9C887]">Pro</em> está ativo
          </DialogTitle>
          <DialogDescription data-step className="mt-1 text-[13.5px] text-[#F7F0E6]/70">
            Obrigada por assinar o Meu Atelier. Agora está tudo liberado:
          </DialogDescription>
          <ul className="mx-auto mt-4 grid w-fit gap-2 text-left text-[14px]">
            {UNLOCKED.map((t) => (
              <li key={t} data-step className="flex items-center gap-2.5">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-[1.5px] border-dashed border-[#D4A85A] text-[9px] text-[#E9C887]" aria-hidden="true">✓</span>
                {t}
              </li>
            ))}
          </ul>
          <button
            type="button"
            data-step
            onClick={onClose}
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-[2px] bg-[#C8714A] px-6 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#FFF8F0] transition-colors hover:bg-[#B45E37] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E9C887]"
          >
            Começar a usar
          </button>
        </div>
      </div>
    </DialogContent>
  )
}

/**
 * Comemora quando o plano vira Pro depois de um pagamento iniciado (cartão, volta do 3DS,
 * ou PIX cuja janela foi fechada antes de cair). Enquanto há pagamento aguardando, pergunta
 * a cada 5 s; quando vira Pro, mostra a comemoração uma vez só. Fica no layout do app.
 */
export function ProCelebrationWatcher() {
  const qc = useQueryClient()
  const [mode, setMode] = useState<PendingMode | null>(null)
  const [dismissed, setDismissed] = useState(false)

  // acompanha a marca no navegador (esta aba e outras abas)
  useEffect(() => {
    const sync = () => setMode(pendingMode())
    sync()
    window.addEventListener(PENDING_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => { window.removeEventListener(PENDING_EVENT, sync); window.removeEventListener('storage', sync) }
  }, [])

  const waiting = mode === 'aguardando'
  const { data } = useQuery<{ plan?: string } | null>({
    queryKey: ['plan-usage'],
    queryFn: async () => { const r = await fetch('/api/plan-usage', { cache: 'no-store' }); return r.ok ? r.json() : null },
    staleTime: 2 * 60 * 1000,
    refetchInterval: waiting ? 5000 : false,
    refetchIntervalInBackground: false,
  })
  const isPro = !!data?.plan && data.plan !== 'free'
  const show = waiting && isPro && !dismissed

  // virou Pro: atualiza o selo da barra lateral e os dados da assinatura
  useEffect(() => {
    if (!show) return
    qc.invalidateQueries({ queryKey: ['me'] })
    qc.invalidateQueries({ queryKey: ['subscription-info'] })
  }, [show, qc])

  return <PlanCelebration open={show} onClose={() => { clearProPending(); setDismissed(true) }} />
}
