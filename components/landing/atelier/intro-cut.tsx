'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { MOTION_KEY } from './motion'

/**
 * Abertura "corte": uma costura atravessa a tela, a tesoura do logo corre por ela
 * e a tela se abre em duas metades revelando o herói.
 * Versão curta (~1,7s), uma vez por sessão, com botão Pular.
 *
 * Um script inline decide antes da hidratação se a abertura aparece
 * (já vista nesta sessão, animações pausadas ou movimento reduzido → não aparece),
 * para não piscar a página. Se o JavaScript falhar, a camada some sozinha em 6s.
 */

const KEY = 'landing-intro-seen'

const DECIDE = `(function(){var d=document.documentElement;try{var s=sessionStorage.getItem('${KEY}')==='1';var o=localStorage.getItem('${MOTION_KEY}')==='1';var r=window.matchMedia('(prefers-reduced-motion: reduce)').matches;if(s||o||r)d.setAttribute('data-intro','skip')}catch(e){d.setAttribute('data-intro','skip')}})()`

interface Props {
  /** animações permitidas; se false a abertura não aparece */
  animated: boolean
  /** a preferência de movimento já foi lida */
  ready: boolean
  /** chamado quando as metades começam a abrir (hora de animar o herói por baixo) */
  onOpen?: () => void
  /** chamado quando a abertura termina, ou na hora se ela não for exibida */
  onDone: () => void
}

export default function IntroCut({ animated, ready, onOpen, onDone }: Props) {
  const [gone, setGone] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const top = useRef<HTMLDivElement>(null)
  const bot = useRef<HTMLDivElement>(null)
  const brand = useRef<HTMLDivElement>(null)
  const word = useRef<HTMLSpanElement>(null)
  const tag = useRef<HTMLParagraphElement>(null)
  const stitchMask = useRef<SVGPathElement>(null)
  const scissors = useRef<HTMLImageElement>(null)
  const tl = useRef<gsap.core.Timeline | null>(null)
  const doneRef = useRef(onDone)
  const openRef = useRef(onOpen)
  useEffect(() => { doneRef.current = onDone; openRef.current = onOpen }, [onDone, onOpen])

  useEffect(() => {
    if (!ready) return
    let seen = false
    try { seen = sessionStorage.getItem(KEY) === '1' } catch { /* storage bloqueado */ }
    const skipAttr = document.documentElement.getAttribute('data-intro') === 'skip'
    // o script inline só roda na carga da página; voltar para "/" pela navegação do site também precisa respeitar o "uma vez por sessão"
    if (!animated || skipAttr || seen || !root.current) {
      document.documentElement.setAttribute('data-intro', 'skip')
      doneRef.current()
      return
    }

    const vw = window.innerWidth
    // enquanto a abertura cobre a tela, o conteúdo de trás não recebe foco pelo Tab
    const page = document.querySelector('.m-root')
    page?.setAttribute('inert', '')
    const t = gsap.timeline({
      onComplete: () => {
        page?.removeAttribute('inert')
        document.documentElement.setAttribute('data-intro', 'skip')
        setGone(true)
        doneRef.current()
      },
    })
    t.timeScale(1.7)
    t.fromTo(stitchMask.current, { strokeDasharray: 1440, strokeDashoffset: 1440 }, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' }, 0)
      .from(word.current, { yPercent: 110, duration: 0.8, ease: 'power3.out' }, 0.35)
      .from(tag.current, { autoAlpha: 0, y: -8, duration: 0.5, ease: 'power1.out' }, 0.6)
      .fromTo(scissors.current, { x: 0, rotation: -8 }, { x: vw + 160, duration: 1.0, ease: 'power2.in' }, 1.25)
      .to(scissors.current, { rotation: 8, duration: 0.09, repeat: 9, yoyo: true, ease: 'sine.inOut' }, 1.25)
      .addLabel('open', 2.05)
      .call(() => {
        // só conta como vista quando a tela abre (se o efeito for desfeito antes, ela toca de novo)
        try { sessionStorage.setItem(KEY, '1') } catch { /* storage bloqueado */ }
        openRef.current?.()
      }, undefined, 'open')
      .to(brand.current, { y: -40, autoAlpha: 0, duration: 0.5, ease: 'power2.in' }, 'open-=0.15')
      .to(tag.current, { y: 40, autoAlpha: 0, duration: 0.5, ease: 'power2.in' }, 'open-=0.15')
      .to(top.current, { yPercent: -100, duration: 0.95, ease: 'power4.inOut' }, 'open')
      .to(bot.current, { yPercent: 100, duration: 0.95, ease: 'power4.inOut' }, 'open')
    tl.current = t
    const el = root.current
    const skipOnScroll = () => { if (t.time() < t.labels.open - 0.2) t.seek('open-=0.2') }
    el.addEventListener('wheel', skipOnScroll, { passive: true })
    el.addEventListener('touchmove', skipOnScroll, { passive: true })
    return () => {
      el.removeEventListener('wheel', skipOnScroll)
      el.removeEventListener('touchmove', skipOnScroll)
      page?.removeAttribute('inert')
      t.kill()
    }
  }, [animated, ready])

  const skip = () => {
    const t = tl.current
    if (t && t.time() < t.labels.open - 0.2) t.seek('open-=0.2')
  }

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: DECIDE }} />
      <style>{`
        .intro-root { position: fixed; inset: 0; z-index: 200; animation: intro-failsafe 0s linear 6s forwards; }
        html[data-intro="skip"] .intro-root { display: none; }
        @keyframes intro-failsafe { to { visibility: hidden; pointer-events: none; } }
      `}</style>
      {!gone && (
        <div ref={root} className="intro-root">
          <div ref={top} aria-hidden="true" className="dark-linen" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '50%' }} />
          <div ref={bot} aria-hidden="true" className="dark-linen" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '50%' }} />
          <div ref={brand} aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, bottom: '50%', paddingBottom: 28, textAlign: 'center' }}>
            <p className="display" style={{ margin: 0, fontSize: 'clamp(56px,8vw,104px)', fontStyle: 'italic', fontWeight: 300, color: 'var(--gold)', lineHeight: 1 }}>
              <span style={{ display: 'block', overflow: 'hidden', paddingBottom: '.1em' }}><span ref={word} style={{ display: 'block' }}>meu atelier</span></span>
            </p>
          </div>
          <p ref={tag} aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, top: '50%', margin: '30px 0 0', textAlign: 'center', fontSize: 12, letterSpacing: '.32em', textTransform: 'uppercase', color: 'rgba(212,168,90,.85)' }}>
            Gestão inteligente para ateliês
          </p>
          <svg aria-hidden="true" viewBox="0 0 1440 40" preserveAspectRatio="none" style={{ position: 'absolute', left: 0, width: '100%', top: 'calc(50% - 20px)', height: 40 }}>
            <defs><mask id="introStitch" maskUnits="userSpaceOnUse" x="0" y="0" width="1440" height="40"><path ref={stitchMask} d="M0 20H1440" stroke="#fff" strokeWidth="10" fill="none" /></mask></defs>
            <path d="M0 20H1440" stroke="#D4A85A" strokeWidth="2" strokeDasharray="14 10" fill="none" mask="url(#introStitch)" />
          </svg>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={scissors} src="/logo-icon.svg" alt="" width={64} height={64} style={{ position: 'absolute', left: -80, top: 'calc(50% - 32px)', borderRadius: 14 }} />
          <button
            type="button"
            onClick={skip}
            style={{ position: 'absolute', top: 22, right: 22, minHeight: 44, padding: '0 18px', borderRadius: 2, border: '1px solid rgba(247,240,230,.3)', background: 'transparent', color: 'var(--cream)', fontFamily: 'var(--f-sans)', fontWeight: 500, fontSize: 12, letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer' }}
          >
            Pular
          </button>
        </div>
      )}
    </>
  )
}
