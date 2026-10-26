'use client'

import { useEffect, useRef, useState } from 'react'
import { Copy } from 'lucide-react'
import { toast } from 'sonner'

const SERIF = { fontFamily: "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif" }
const POLL_MS = 5000
const POLL_LIMIT_MS = 30 * 60 * 1000 // depois de 30 min para de perguntar (a comemoração ainda aparece ao voltar ao sistema)

type PixData = { encodedImage: string; payload: string; expirationDate: string }

/**
 * QR do PIX que espera o pagamento: pergunta a cada 5 s se o plano já virou Pro.
 * Quando vira, o QR some, um visto é costurado no lugar e, logo depois, chama onPaid.
 */
export function PixPayment({ pix, onPaid }: { pix: PixData; onPaid: () => void }) {
  const [paid, setPaid] = useState(false)
  const [stopped, setStopped] = useState(false)
  const onPaidRef = useRef(onPaid)
  useEffect(() => { onPaidRef.current = onPaid }, [onPaid])

  useEffect(() => {
    if (paid) return
    const started = Date.now()
    let alive = true
    const tick = async () => {
      if (!alive) return
      if (Date.now() - started > POLL_LIMIT_MS) { setStopped(true); return }
      if (document.visibilityState === 'visible') {
        try {
          const r = await fetch('/api/plan-usage', { cache: 'no-store' })
          const d = r.ok ? await r.json() : null
          if (alive && d?.plan && d.plan !== 'free') { setPaid(true); return }
        } catch { /* sem rede: tenta de novo no próximo ciclo */ }
      }
      if (alive) timer = setTimeout(tick, POLL_MS)
    }
    let timer = setTimeout(tick, POLL_MS)
    return () => { alive = false; clearTimeout(timer) }
  }, [paid])

  useEffect(() => {
    if (!paid) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const t = setTimeout(() => onPaidRef.current(), reduce ? 600 : 1900)
    return () => clearTimeout(t)
  }, [paid])

  const copy = async () => {
    try { await navigator.clipboard.writeText(pix.payload); toast.success('Código PIX copiado!') }
    catch { toast.error('Não deu para copiar. Selecione o código e copie manualmente.') }
  }

  return (
    <div className="flex flex-col items-center gap-5 py-2">
      <style>{PIX_CSS}</style>
      <div className="space-y-1 text-center" aria-live="polite">
        <p className="text-sm font-semibold text-foreground">{paid ? 'Tudo certo' : 'Escaneie o QR Code para pagar'}</p>
        {!paid && <p className="text-xs text-muted-foreground">Assim que o pagamento cair, seu plano Pro é ativado aqui mesmo.</p>}
      </div>

      <div className="relative h-60 w-60">
        <div className={`pix-qr absolute inset-0 rounded-2xl border-2 border-[#c8714a]/30 bg-white p-4 shadow-sm ${paid ? 'is-gone' : ''}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`data:image/png;base64,${pix.encodedImage}`} alt="QR Code PIX" className="h-full w-full object-contain" />
        </div>
        {paid && (
          <div className="pix-done absolute inset-0 grid place-items-center" aria-hidden="true">
            <svg viewBox="0 0 120 120" className="w-[82%] overflow-visible">
              <circle className="pix-circle" cx="60" cy="60" r="52" fill="none" stroke="#2F7A45" strokeWidth="3" strokeDasharray="6 5" />
              <path className="pix-check" d="M36 62 L53 78 L86 44" fill="none" stroke="#2F7A45" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" pathLength={100} />
            </svg>
          </div>
        )}
      </div>

      {paid ? (
        <div className="pix-ok text-center" role="status">
          <p className="text-[26px] font-semibold leading-tight text-emerald-700 dark:text-emerald-400" style={SERIF}>Pagamento recebido!</p>
          <p className="text-sm text-muted-foreground">Seu plano Pro está ativo.</p>
        </div>
      ) : (
        <>
          <div className="grid justify-items-center gap-2 text-xs text-muted-foreground" role="status">
            {!stopped && <span className="pix-thread" aria-hidden="true" />}
            {stopped
              ? 'Ainda não recebemos a confirmação. Se já pagou, seu plano é ativado em instantes; pode fechar esta janela.'
              : 'Aguardando o pagamento…'}
          </div>
          <div className="w-full space-y-2">
            <p className="text-center text-xs text-muted-foreground">Ou copie o código PIX:</p>
            <div className="flex gap-2">
              <input readOnly value={pix.payload} onFocus={(e) => e.currentTarget.select()} aria-label="Código PIX copia e cola"
                className="h-10 min-w-0 flex-1 truncate rounded-md border border-border bg-muted/50 px-3 font-mono text-xs text-foreground" />
              <button type="button" onClick={copy} aria-label="Copiar código PIX"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-background hover:border-[#D4A85A]">
                <Copy className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            {pix.expirationDate && (
              <p className="text-center text-[11px] text-muted-foreground">Válido até: {new Date(pix.expirationDate).toLocaleString('pt-BR')}</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

const PIX_CSS = `
.pix-thread { display: block; width: 180px; height: 3px; position: relative; overflow: hidden; background: repeating-linear-gradient(90deg, rgba(200,113,74,.25) 0 8px, transparent 8px 13px); }
.pix-thread::after { content: ''; position: absolute; inset: 0; width: 40%; background: repeating-linear-gradient(90deg, #C8714A 0 8px, transparent 8px 13px); animation: pix-run 1.4s linear infinite; }
@keyframes pix-run { from { transform: translateX(-100%) } to { transform: translateX(250%) } }
.pix-qr { transition: opacity .45s ease, transform .45s ease, filter .45s ease; }
.pix-qr.is-gone { opacity: 0; transform: scale(.86); filter: blur(3px); }
.pix-done { animation: pix-fade .3s ease .25s both; }
.pix-circle { transform-origin: 60px 60px; animation: pix-spin .9s cubic-bezier(.2,.8,.2,1) .25s both; }
.pix-check { stroke-dasharray: 100; animation: pix-draw .45s ease-out 1.05s both; }
.pix-ok { animation: pix-up .4s ease-out .9s both; }
@keyframes pix-fade { from { opacity: 0 } }
@keyframes pix-spin { from { transform: rotate(-120deg) scale(.7) } }
@keyframes pix-draw { from { stroke-dashoffset: 100 } to { stroke-dashoffset: 0 } }
@keyframes pix-up { from { opacity: 0; transform: translateY(6px) } }
@media (prefers-reduced-motion: reduce) {
  .pix-thread::after, .pix-done, .pix-circle, .pix-check, .pix-ok { animation: none; }
  .pix-check { stroke-dashoffset: 0; }
  .pix-qr { transition: none; }
}
`
