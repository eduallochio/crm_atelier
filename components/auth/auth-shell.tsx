'use client'

import { useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'
import SewingMachine, { type SewingMachineHandle } from '@/components/landing/atelier/sewing-machine'
import { MotionProvider, useMotionPref } from '@/components/landing/atelier/motion'
import { dmSans } from '@/components/landing/atelier/fonts'

/**
 * Moldura das telas de acesso (login, cadastro…) com a identidade da landing:
 * painel em linho com a frase, a máquina de costura (costura curta ao abrir e a
 * cada mudança de `sewKey`) e o filete costurado; formulário à direita com a
 * marca e "Voltar ao site". No celular o painel some e a marca vai para o topo.
 *
 * As classes .lp-* (campos, botões, erros…) ficam disponíveis para o conteúdo.
 */

interface Props {
  /** frase grande do painel (use <em> para a palavra em terracota) */
  headline: React.ReactNode
  /** texto de apoio do painel */
  sub: React.ReactNode
  /** conteúdo no pé do painel, abaixo da máquina (recursos, etapas…) */
  panelFooter?: React.ReactNode
  /** quando muda, a máquina dá mais uma costurada (ex.: avançar de etapa) */
  sewKey?: string | number
  children: React.ReactNode
}

export default function AuthShell(props: Props) {
  return (
    <MotionProvider>
      <Shell {...props} />
    </MotionProvider>
  )
}

function Shell({ headline, sub, panelFooter, sewKey, children }: Props) {
  const motion = useMotionPref()
  const machine = useRef<SewingMachineHandle>(null)
  const stitch = useRef<SVGLineElement>(null)

  // tela de tarefa: só uma costurada curta ao abrir (e ao trocar de etapa)
  useEffect(() => {
    if (!motion.enabled) return
    const t = setTimeout(() => machine.current?.sew(2.4, 1.8), 350)
    return () => clearTimeout(t)
  }, [motion.enabled, sewKey])

  const onStitch = useCallback((off: number) => { stitch.current?.setAttribute('stroke-dashoffset', off.toFixed(2)) }, [])

  return (
    <div className={`${dmSans.variable} lp-root`}>
      <style>{AUTH_CSS}</style>

      <aside className="lp-panel lp-linen">
        <div className="lp-panel-inner">
          <Link href="/" className="lp-brand" aria-label="Meu Atelier — voltar ao site">
            <Image src="/logo-icon.svg" alt="" width={34} height={34} />
            <span>Meu <b>Atelier</b></span>
          </Link>

          <p className="lp-headline lp-serif">{headline}</p>
          <p className="lp-sub">{sub}</p>

          <div className="lp-machine" aria-hidden="true">
            <SewingMachine ref={machine} animated={motion.enabled} onStitch={onStitch} />
          </div>
          <svg className="lp-stitch" aria-hidden="true">
            <line ref={stitch} x1="0" y1="3" x2="100%" y2="3" stroke="rgba(212,168,90,.7)" strokeWidth="2" strokeDasharray="11 7" strokeLinecap="round" />
          </svg>
          {panelFooter}
        </div>
      </aside>

      <main className="lp-form-side">
        <div className="lp-top">
          <Link href="/" className="lp-brand" aria-label="Meu Atelier — página inicial">
            <Image src="/logo-icon.svg" alt="" width={30} height={30} />
            <span>Meu <b>Atelier</b></span>
          </Link>
          <Link href="/" className="lp-back">
            <ArrowLeft size={16} aria-hidden="true" /><span>Voltar ao site</span>
          </Link>
        </div>
        <div className="lp-center">{children}</div>
      </main>
    </div>
  )
}

const AUTH_CSS = `
  .lp-root {
    --ink: #2C1810; --cream: #F7F0E6; --terra: #C8714A; --terra-dark: #8A4B2C; --gold: #D4A85A; --mid: #6E5E4F; --card: #FFF8F0;
    --f-sans: var(--font-dm-sans), 'DM Sans', system-ui, sans-serif;
    --f-serif: var(--font-cormorant), 'Cormorant Garamond', Georgia, serif;
    font-family: var(--f-sans);
    min-height: 100vh; min-height: 100dvh;
    display: flex; align-items: flex-start;
    background: var(--card);
    color: var(--ink);
  }
  .lp-root *, .lp-root *::before, .lp-root *::after { box-sizing: border-box; }
  .lp-serif { font-family: var(--f-serif); font-weight: 300; letter-spacing: -0.01em; }

  .lp-linen {
    background-color: var(--ink);
    background-image: repeating-linear-gradient(0deg, rgba(255,255,255,.014) 0 1px, transparent 1px 4px), repeating-linear-gradient(90deg, rgba(255,255,255,.014) 0 1px, transparent 1px 4px);
  }
  .lp-brand { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; }
  .lp-brand img { border-radius: 8px; }
  .lp-brand span { font-size: 21px; font-weight: 600; letter-spacing: .04em; color: var(--cream); }
  .lp-brand span b { color: var(--terra); font-weight: 600; }
  .lp-brand:focus-visible { outline: 2px solid var(--gold); outline-offset: 4px; border-radius: 6px; }

  /* ── painel (fica parado enquanto o formulário rola) ── */
  .lp-panel { position: sticky; top: 0; width: 46%; max-width: 680px; height: 100vh; height: 100dvh; flex-shrink: 0; overflow: hidden; color: var(--cream); }
  .lp-panel-inner { height: 100%; display: flex; flex-direction: column; padding: 44px clamp(32px, 4vw, 56px); overflow-y: auto; scrollbar-width: none; }
  .lp-headline { margin: 56px 0 0; font-size: clamp(44px, 4.4vw, 60px); line-height: 1.02; color: var(--cream); }
  .lp-headline em { font-style: italic; color: var(--terra); }
  .lp-sub { margin: 20px 0 0; max-width: 360px; font-size: 15px; line-height: 1.7; color: rgba(247,240,230,.74); }
  .lp-machine { position: relative; margin: auto 0 0; padding-top: 28px; width: min(100%, 460px); }
  .lp-stitch { display: block; flex: none; width: 100%; height: 6px; margin: 22px 0; overflow: visible; }
  .lp-features { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 12px 20px; }
  .lp-features li { display: flex; gap: 10px; align-items: flex-start; font-size: 13.5px; line-height: 1.45; color: rgba(247,240,230,.78); }
  .lp-features svg { flex: none; margin-top: 2px; color: var(--gold); }

  /* ── formulário ── */
  .lp-form-side { flex: 1; min-height: 100vh; min-height: 100dvh; display: flex; flex-direction: column; padding: 28px clamp(24px, 5vw, 64px) 40px; min-width: 0; }
  .lp-top { display: flex; align-items: center; justify-content: flex-end; gap: 16px; min-height: 44px; }
  .lp-top .lp-brand { display: none; }
  .lp-top .lp-brand span { color: var(--ink); font-size: 19px; }
  .lp-back { display: inline-flex; align-items: center; gap: 8px; min-height: 44px; font-size: 13px; color: var(--mid); text-decoration: none; letter-spacing: .02em; }
  .lp-back:hover { color: var(--ink); }
  .lp-center { flex: 1; display: flex; align-items: center; justify-content: center; padding: 24px 0; }
  .lp-form-box { width: 100%; max-width: 380px; }
  .lp-form-box.lp-wide { max-width: 420px; }
  @media (prefers-reduced-motion: no-preference) {
    .lp-form-box { animation: lp-up .5s cubic-bezier(.2,.7,.2,1) .05s backwards; }
  }
  @keyframes lp-up { from { opacity: 0; transform: translateY(16px); } }

  .lp-eyebrow { margin: 0 0 10px; font-size: 11px; font-weight: 600; letter-spacing: .16em; text-transform: uppercase; color: var(--terra-dark); }
  .lp-title { margin: 0 0 10px; font-size: clamp(38px, 4vw, 46px); line-height: 1.04; color: var(--ink); outline: none; }
  .lp-title em { font-style: italic; color: var(--terra); }
  .lp-desc { margin: 0 0 32px; font-size: 14.5px; line-height: 1.6; color: var(--mid); }

  .lp-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 18px; }
  .lp-field { margin-bottom: 24px; }
  .lp-label { display: block; margin-bottom: 8px; font-size: 11px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: var(--mid); }
  .lp-req { color: #A33A2A; margin-left: 2px; }
  .lp-optional { margin-left: 6px; font-size: 11px; font-weight: 400; letter-spacing: 0; text-transform: none; color: #8C7C6C; }
  .lp-input-wrap { position: relative; }
  .lp-input, .lp-select {
    width: 100%; height: 48px; padding: 0 44px 0 2px;
    background: transparent; border: 0; border-bottom: 1.5px solid #D9CBB9; border-radius: 0;
    font: 400 16px var(--f-sans); color: var(--ink); outline: none;
    transition: border-color .2s; -webkit-appearance: none; appearance: none;
  }
  .lp-select { padding-right: 24px; cursor: pointer; background-image: linear-gradient(45deg, transparent 50%, #8C7C6C 50%), linear-gradient(135deg, #8C7C6C 50%, transparent 50%); background-position: calc(100% - 10px) 50%, calc(100% - 5px) 50%; background-size: 5px 5px; background-repeat: no-repeat; }
  .lp-input::placeholder { color: #9C8C7C; font-weight: 300; }
  .lp-input:focus, .lp-select:focus { border-bottom-color: var(--terra); box-shadow: 0 1.5px 0 var(--terra); }
  .lp-input[aria-invalid="true"] { border-bottom-color: #B3412F; }
  .lp-input:disabled { opacity: .7; }
  .lp-eye {
    position: absolute; right: 0; top: 50%; transform: translateY(-50%);
    width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;
    background: none; border: 0; border-radius: 6px; cursor: pointer; color: #8C7C6C; transition: color .2s;
  }
  .lp-eye:hover { color: var(--ink); }
  .lp-eye:focus-visible { outline: 2px solid var(--terra); outline-offset: 1px; }
  .lp-input-status { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); display: flex; }
  .lp-err { margin: 6px 0 0; font-size: 12.5px; color: #A33A2A; }
  .lp-hint { margin: 6px 0 0; font-size: 12.5px; color: var(--mid); }
  .lp-hint.ok { color: #2F7D4F; }

  .lp-forgot { display: flex; justify-content: flex-end; margin: -12px 0 28px; }
  .lp-forgot a { font-size: 13px; color: var(--terra-dark); text-decoration: none; padding: 4px 0; }
  .lp-forgot a:hover { text-decoration: underline; text-underline-offset: 3px; }

  .lp-btn {
    width: 100%; min-height: 50px; display: flex; align-items: center; justify-content: center; gap: 10px;
    background: var(--terra); color: var(--card); border: 1px solid transparent; border-radius: 2px;
    font: 500 13px var(--f-sans); letter-spacing: .12em; text-transform: uppercase; cursor: pointer;
    transition: background-color .3s cubic-bezier(.4,0,.2,1), transform .3s cubic-bezier(.4,0,.2,1);
  }
  .lp-btn:hover:not(:disabled) { background: #B45E37; transform: translateY(-1px); }
  .lp-btn:active:not(:disabled) { transform: scale(.985); }
  .lp-btn:disabled { opacity: .6; cursor: not-allowed; }
  .lp-btn-ghost {
    width: 100%; min-height: 46px; display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 12px;
    background: transparent; color: var(--mid); border: 1.5px solid #E2D6C6; border-radius: 2px;
    font: 500 13px var(--f-sans); letter-spacing: .06em; cursor: pointer; transition: border-color .2s, color .2s;
  }
  .lp-btn-ghost:hover { border-color: var(--gold); color: var(--ink); }
  .lp-btn:focus-visible, .lp-btn-ghost:focus-visible, .lp-btn-google:focus-visible, .lp-back:focus-visible, .lp-forgot a:focus-visible, .lp-register a:focus-visible, .lp-terms a:focus-visible { outline: 2px solid var(--terra); outline-offset: 3px; }

  .lp-spinner { width: 15px; height: 15px; border: 2px solid rgba(255,255,255,.35); border-top-color: #fff; border-radius: 50%; animation: lp-spin .65s linear infinite; }
  .lp-spinner.dark { border-color: rgba(44,24,16,.15); border-top-color: var(--ink); }
  .lp-spinner.gold { border-color: rgba(200,113,74,.25); border-top-color: var(--terra); }
  @keyframes lp-spin { to { transform: rotate(360deg); } }

  .lp-or { display: flex; align-items: center; gap: 12px; margin: 24px 0; }
  .lp-or::before, .lp-or::after { content: ''; flex: 1; border-top: 1px dashed #D9CBB9; }
  .lp-or span { font-size: 11px; color: #8C7C6C; letter-spacing: .1em; text-transform: uppercase; }

  .lp-btn-google {
    width: 100%; min-height: 48px; display: flex; align-items: center; justify-content: center; gap: 10px;
    background: #fff; color: var(--ink); border: 1.5px solid #E2D6C6; border-radius: 2px;
    font: 500 14px var(--f-sans); cursor: pointer; transition: border-color .2s, background-color .2s;
  }
  .lp-btn-google:hover:not(:disabled) { border-color: var(--gold); background: #FFFBF5; }
  .lp-btn-google:disabled { opacity: .6; cursor: not-allowed; }

  .lp-terms { display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; margin-bottom: 8px; background: rgba(212,168,90,.07); border: 1px dashed rgba(180,130,60,.45); border-radius: 4px; }
  .lp-terms input[type=checkbox] { margin-top: 2px; width: 18px; height: 18px; flex-shrink: 0; accent-color: var(--terra); cursor: pointer; }
  .lp-terms label { font-size: 13px; line-height: 1.55; color: var(--mid); }
  .lp-terms a { color: var(--terra-dark); font-weight: 600; text-decoration: none; }
  .lp-terms a:hover { text-decoration: underline; text-underline-offset: 3px; }

  .lp-register { margin: 26px 0 0; text-align: center; font-size: 14px; color: var(--mid); }
  .lp-register a { color: var(--terra-dark); font-weight: 600; text-decoration: none; }
  .lp-register a:hover { text-decoration: underline; text-underline-offset: 3px; }

  @media (max-width: 900px) {
    .lp-panel { display: none; }
    .lp-top { justify-content: space-between; }
    .lp-top .lp-brand { display: inline-flex; }
  }
  @media (max-width: 480px) {
    .lp-grid-2 { grid-template-columns: 1fr; }
  }
  @media (max-width: 420px) {
    .lp-back span { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
    .lp-back { min-width: 44px; justify-content: center; }
  }
`

/** Ícone de olho para o botão de mostrar/ocultar senha */
export function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

/** Logo do Google para os botões "com Google" */
export function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
      <path fill="none" d="M0 0h48v48H0z" />
    </svg>
  )
}
