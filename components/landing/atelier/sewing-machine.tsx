'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { gsap } from 'gsap'

/**
 * Máquina de costura animada do herói.
 * Física simplificada: a agulha sobe e desce (1 volta do volante = 1 ponto),
 * o tecido só avança com a agulha fora dele (dente impelidor), a alavanca
 * puxa a linha adiantada e o motor vibra conforme a velocidade.
 * Só roda enquanto está visível na tela e com animações ligadas.
 */

export interface SewingMachineHandle {
  /** costura na velocidade dada (pontos/s) por alguns segundos; sem seconds, até nova ordem */
  sew: (speed: number, seconds?: number) => void
  /** empurrão de velocidade (ex.: velocidade do scroll) */
  boost: (amount: number) => void
  svg: () => SVGSVGElement | null
}

interface Props {
  /** false = desenho parado (movimento reduzido ou animações pausadas) */
  animated: boolean
  /** chamado a cada quadro com o deslocamento do tecido, para sincronizar outras costuras */
  onStitch?: (offset: number) => void
}

type RefName = 'rBody' | 'rFabric' | 'rFeed' | 'rLever' | 'rNeedle' | 'rShine' | 'rSpool' | 'rStitch' | 'rThread' | 'rWheel'

function feedOffset(p: number) {
  const q = p - 0.72
  const fl = Math.floor(q)
  const fr = q - fl
  let k = Math.min(1, fr / 0.56)
  k = k * k * (3 - 2 * k)
  return { off: 18 * (fl + k), feeding: fr < 0.56, k }
}

function drawFrame(R: Partial<Record<RefName, SVGElement | null>>, p: number, t: number, sp: number): number | null {
  if (!R.rNeedle) return null
  const TAU = Math.PI * 2
  const f = feedOffset(p)
  const off = f.off
  const ny = 15 - 15 * Math.cos(TAU * p)
  const lv = -18 * Math.cos(TAU * (p + 0.18))
  const ly = 136 + lv
  const sag = Math.max(0, 9 * Math.sin(TAU * (p + 0.18)))
  const wob = Math.sin(t * 23) * Math.min(1, sp / 3) * 3
  R.rNeedle.setAttribute('transform', `translate(0 ${ny.toFixed(2)})`)
  R.rLever?.setAttribute('transform', `translate(0 ${lv.toFixed(2)})`)
  R.rThread?.setAttribute('d', `M420 64Q375 ${(78 + wob).toFixed(1)} 330 98L214 104L200 137L190 166L144 ${ly.toFixed(1)}Q${(152 + sag * 0.6).toFixed(1)} ${((ly + 232) / 2 + sag).toFixed(1)} 166 232L165.5 ${(311 + ny).toFixed(1)}`)
  R.rWheel?.setAttribute('transform', `rotate(${(p * 360 % 360).toFixed(1)} 578 160)`)
  R.rFabric?.setAttribute('transform', `translate(${(-(off % 70)).toFixed(2)} 0)`)
  R.rStitch?.setAttribute('stroke-dashoffset', off.toFixed(2))
  R.rFeed?.setAttribute('transform', f.feeding ? `translate(${(-6 + 12 * f.k).toFixed(2)} -2.5)` : 'translate(0 0)')
  R.rSpool?.setAttribute('stroke-dashoffset', (-off * 0.35).toFixed(2))
  R.rShine?.setAttribute('transform', `translate(${((off * 0.9) % 26).toFixed(2)} 0)`)
  const a = 0.45 * Math.min(1, sp / 3)
  R.rBody?.setAttribute('transform', `translate(${(a * Math.sin(t * 97)).toFixed(2)} ${(a * Math.cos(t * 131)).toFixed(2)})`)
  return off
}

const SewingMachine = forwardRef<SewingMachineHandle, Props>(function SewingMachine({ animated, onStitch }, ref) {
  const svgRef = useRef<SVGSVGElement>(null)
  const els = useRef<Partial<Record<RefName, SVGElement | null>>>({})
  const st = useRef({ p: 0.25, speed: 0, target: 0, boost: 0, hover: false, visible: true })
  const stopCall = useRef<gsap.core.Tween | null>(null)
  const onStitchRef = useRef(onStitch)
  useEffect(() => { onStitchRef.current = onStitch }, [onStitch])

  const setRef = (n: RefName) => (el: SVGElement | null) => { els.current[n] = el }

  const frame = (p: number, t: number, sp: number) => {
    const off = drawFrame(els.current, p, t, sp)
    if (off !== null) onStitchRef.current?.(off)
  }

  useImperativeHandle(ref, () => ({
    sew(speed, seconds) {
      const s = st.current
      s.target = speed
      stopCall.current?.kill()
      if (seconds) stopCall.current = gsap.delayedCall(seconds, () => { if (!s.hover) s.target = 0 })
    },
    boost(amount) { st.current.boost = Math.min(6, st.current.boost + amount) },
    svg: () => svgRef.current,
  }), [])

  useEffect(() => {
    const s = st.current
    if (!animated) { frame(6.3, 0, 0); return }
    frame(s.p, 0, 0)
    const tick = (time: number, dt: number) => {
      const d = Math.min(dt, 50) / 1000
      s.boost *= Math.pow(0.04, d)
      const goal = s.visible ? s.target + s.boost : 0
      s.speed += (goal - s.speed) * Math.min(1, d * 4)
      if (s.speed < 0.01 && goal === 0) return
      s.p += s.speed * d
      frame(s.p, time, s.speed)
    }
    gsap.ticker.add(tick)
    const svg = svgRef.current
    const io = svg ? new IntersectionObserver(([e]) => { s.visible = e.isIntersecting }, { threshold: 0 }) : null
    if (svg && io) io.observe(svg)
    const wrap = svg?.parentElement
    const enter = () => { s.hover = true; s.target = 2.6; stopCall.current?.kill() }
    const leave = () => { s.hover = false; s.target = 0 }
    wrap?.addEventListener('pointerenter', enter)
    wrap?.addEventListener('pointerleave', leave)
    return () => {
      gsap.ticker.remove(tick)
      io?.disconnect()
      wrap?.removeEventListener('pointerenter', enter)
      wrap?.removeEventListener('pointerleave', leave)
      stopCall.current?.kill()
    }
  }, [animated])

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 640 430"
      width="100%"
      role="img"
      aria-label="Ilustração animada de uma máquina de costura doméstica costurando um tecido terracota; a linha sai do carretel, passa pela tensão e pela alavanca até a agulha, e o ponto aparece no tecido"
      style={{ display: 'block', overflow: 'hidden' }}
    >
        <defs>
        <linearGradient id="mqBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4A2D1E" /><stop offset=".45" stopColor="#2C1810" /><stop offset="1" stopColor="#1C0F08" /></linearGradient>
        <linearGradient id="mqBed" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3A2216" /><stop offset="1" stopColor="#140B06" /></linearGradient>
        <linearGradient id="mqChrome" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#8F8880" /><stop offset=".35" stopColor="#F3EEE7" /><stop offset=".6" stopColor="#B9B2AA" /><stop offset="1" stopColor="#6E6760" /></linearGradient>
        <linearGradient id="mqChromeV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F3EEE7" /><stop offset=".5" stopColor="#ABA49C" /><stop offset="1" stopColor="#6E6760" /></linearGradient>
        <linearGradient id="mqGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#E8C96A" /><stop offset=".5" stopColor="#C9A84C" /><stop offset="1" stopColor="#A07830" /></linearGradient>
        <linearGradient id="mqFab" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" stopOpacity=".18" /><stop offset=".5" stopColor="#FFFFFF" stopOpacity="0" /><stop offset="1" stopColor="#000000" stopOpacity=".25" /></linearGradient>
        <radialGradient id="mqLamp" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#FFE2AA" stopOpacity=".45" /><stop offset="1" stopColor="#FFE2AA" stopOpacity="0" /></radialGradient>
        <radialGradient id="mqShadow" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#000" stopOpacity=".55" /><stop offset="1" stopColor="#000" stopOpacity="0" /></radialGradient>
        <pattern id="mqWeave" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M0 2.5H5" stroke="rgba(60,20,8,.22)" strokeWidth="1" /><path d="M2.5 0V5" stroke="rgba(255,235,210,.10)" strokeWidth="1" /></pattern>
        <clipPath id="mqLeft"><rect x="-400" y="300" width="565.5" height="60" /></clipPath>
        </defs>
        <ellipse cx="330" cy="400" rx="310" ry="16" fill="url(#mqShadow)" />
        <g ref={setRef('rBody')}>
        <rect x="26" y="332" width="588" height="54" rx="14" fill="url(#mqBed)" stroke="rgba(212,168,90,.45)" strokeWidth="1.5" />
        <path d="M40 335H600" stroke="rgba(255,255,255,.08)" strokeWidth="2" />
        <path d="M250 338V350M262 338V346M274 338V350M286 338V346M298 338V350" stroke="rgba(212,168,90,.35)" strokeWidth="1.2" />
        <rect x="118" y="328" width="106" height="7" rx="2" fill="url(#mqChromeV)" />
        <rect ref={setRef('rFeed')} x="154" y="331" width="26" height="3" rx="1" fill="#5B544D" />
        <g ref={setRef('rFabric')}><rect x="-300" y="312" width="1400" height="18" fill="#C8714A" /><rect x="-300" y="312" width="1400" height="18" fill="url(#mqWeave)" /><rect x="-300" y="312" width="1400" height="18" fill="url(#mqFab)" /></g>
        <line ref={setRef('rStitch')} x1="-400" y1="321" x2="165.5" y2="321" stroke="#F7F0E6" strokeWidth="2.4" strokeDasharray="11 7" strokeLinecap="round" clipPath="url(#mqLeft)" />
        <ellipse cx="166" cy="318" rx="96" ry="22" fill="url(#mqLamp)" />
        <path d="M206 116C250 94 470 92 506 102C546 112 560 140 560 172V334H474C474 280 472 226 458 210C450 200 438 196 420 196H222Z" fill="url(#mqBody)" stroke="rgba(212,168,90,.55)" strokeWidth="2" strokeLinejoin="round" />
        <path d="M224 108C300 95 460 95 500 106" stroke="rgba(255,255,255,.14)" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M540 140V320" stroke="rgba(255,255,255,.07)" strokeWidth="4" strokeLinecap="round" />
        <path d="M238 140H448" stroke="url(#mqGold)" strokeWidth="3" />
        <path d="M238 146H448" stroke="url(#mqGold)" strokeWidth="1" />
        <text x="268" y="178" style={{ fontFamily: 'var(--f-serif)' }} fontStyle="italic" fontSize="26" fill="url(#mqGold)">meu atelier</text>
        <circle cx="514" cy="252" r="17" fill="url(#mqChrome)" stroke="#2C1810" strokeWidth="1.5" />
        <path d="M514 240V252" stroke="#2C1810" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M496 226A26 26 0 0 1 532 226" stroke="rgba(212,168,90,.6)" strokeWidth="1.2" fill="none" strokeDasharray="2 4" />
        <rect x="106" y="94" width="120" height="150" rx="22" fill="url(#mqBody)" stroke="rgba(212,168,90,.55)" strokeWidth="2" />
        <path d="M116 104C140 98 190 98 214 104" stroke="rgba(255,255,255,.14)" strokeWidth="3" fill="none" strokeLinecap="round" />
        <rect x="114" y="108" width="62" height="122" rx="10" fill="rgba(255,255,255,.035)" stroke="rgba(212,168,90,.3)" />
        <circle cx="120" cy="114" r="2.2" fill="url(#mqChrome)" /><circle cx="170" cy="114" r="2.2" fill="url(#mqChrome)" /><circle cx="120" cy="224" r="2.2" fill="url(#mqChrome)" /><circle cx="170" cy="224" r="2.2" fill="url(#mqChrome)" />
        <rect x="139" y="106" width="10" height="66" rx="5" fill="#0E0805" />
        <circle cx="200" cy="152" r="15" fill="url(#mqChrome)" stroke="#2C1810" strokeWidth="1.5" />
        <circle cx="200" cy="152" r="6" fill="#2C1810" />
        <path d="M200 137V141M215 152H211M200 167V163M185 152H189" stroke="#2C1810" strokeWidth="1.5" />
        <circle cx="214" cy="104" r="3.5" fill="url(#mqChrome)" />
        <circle cx="330" cy="100" r="4.5" fill="#1A110A" stroke="url(#mqChrome)" strokeWidth="2" />
        <rect x="120" y="243" width="44" height="6" rx="3" fill="#FFE2AA" opacity=".85" />
        <line x1="420" y1="104" x2="420" y2="52" stroke="url(#mqChrome)" strokeWidth="3.5" strokeLinecap="round" />
        <rect x="403" y="60" width="34" height="38" fill="#C8714A" />
        <g ref={setRef('rSpool')} stroke="rgba(255,235,210,.5)" strokeWidth="1.4" strokeDasharray="3 3"><line x1="404" y1="65" x2="436" y2="65" /><line x1="404" y1="70" x2="436" y2="70" /><line x1="404" y1="75" x2="436" y2="75" /><line x1="404" y1="80" x2="436" y2="80" /><line x1="404" y1="85" x2="436" y2="85" /><line x1="404" y1="90" x2="436" y2="90" /><line x1="404" y1="95" x2="436" y2="95" /></g>
        <rect ref={setRef('rShine')} x="408" y="60" width="4" height="38" fill="rgba(255,240,220,.35)" />
        <ellipse cx="420" cy="60" rx="19" ry="4.5" fill="#E9DCC6" stroke="#B9A88E" strokeWidth="1" />
        <ellipse cx="420" cy="98" rx="19" ry="4.5" fill="#D9C9AE" stroke="#B9A88E" strokeWidth="1" />
        <path ref={setRef('rThread')} d="M420 64L330 98L214 104L200 137L190 166L144 136L166 232L165.5 312" fill="none" stroke="#F4EFE6" strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round" />
        <g ref={setRef('rLever')}><rect x="134" y="131" width="22" height="10" rx="5" fill="url(#mqChromeV)" stroke="#5B544D" strokeWidth=".8" /><circle cx="144" cy="136" r="2" fill="#1A110A" /></g>
        <rect x="194" y="236" width="7" height="76" fill="url(#mqChrome)" />
        <path d="M176 308H224Q230 308 230 313V316H176Z" fill="url(#mqChromeV)" stroke="#5B544D" strokeWidth=".8" />
        <path d="M226 236L240 226" stroke="url(#mqChrome)" strokeWidth="4" strokeLinecap="round" />
        <g ref={setRef('rNeedle')}><rect x="160" y="228" width="11" height="58" rx="2" fill="url(#mqChrome)" /><rect x="156.5" y="278" width="18" height="11" rx="2" fill="url(#mqChromeV)" stroke="#5B544D" strokeWidth=".8" /><circle cx="173" cy="283.5" r="2.4" fill="#4A443E" /><path d="M164.3 289H166.7V314L165.5 319L164.3 314Z" fill="#E8E3DB" stroke="#8F8880" strokeWidth=".5" /><ellipse cx="165.5" cy="311" rx=".6" ry="1.8" fill="#2C1810" /></g>
        <g ref={setRef('rWheel')}><circle cx="578" cy="160" r="42" fill="#1A110A" stroke="url(#mqChrome)" strokeWidth="6" /><g stroke="#B9B2AA" strokeWidth="2" strokeLinecap="round"><line x1="578" y1="116" x2="578" y2="124" transform="rotate(0 578 160)" /><line x1="578" y1="116" x2="578" y2="124" transform="rotate(15 578 160)" /><line x1="578" y1="116" x2="578" y2="124" transform="rotate(30 578 160)" /><line x1="578" y1="116" x2="578" y2="124" transform="rotate(45 578 160)" /><line x1="578" y1="116" x2="578" y2="124" transform="rotate(60 578 160)" /><line x1="578" y1="116" x2="578" y2="124" transform="rotate(75 578 160)" /><line x1="578" y1="116" x2="578" y2="124" transform="rotate(90 578 160)" /><line x1="578" y1="116" x2="578" y2="124" transform="rotate(105 578 160)" /><line x1="578" y1="116" x2="578" y2="124" transform="rotate(120 578 160)" /><line x1="578" y1="116" x2="578" y2="124" transform="rotate(135 578 160)" /><line x1="578" y1="116" x2="578" y2="124" transform="rotate(150 578 160)" /><line x1="578" y1="116" x2="578" y2="124" transform="rotate(165 578 160)" /><line x1="578" y1="116" x2="578" y2="124" transform="rotate(180 578 160)" /><line x1="578" y1="116" x2="578" y2="124" transform="rotate(195 578 160)" /><line x1="578" y1="116" x2="578" y2="124" transform="rotate(210 578 160)" /><line x1="578" y1="116" x2="578" y2="124" transform="rotate(225 578 160)" /><line x1="578" y1="116" x2="578" y2="124" transform="rotate(240 578 160)" /><line x1="578" y1="116" x2="578" y2="124" transform="rotate(255 578 160)" /><line x1="578" y1="116" x2="578" y2="124" transform="rotate(270 578 160)" /><line x1="578" y1="116" x2="578" y2="124" transform="rotate(285 578 160)" /><line x1="578" y1="116" x2="578" y2="124" transform="rotate(300 578 160)" /><line x1="578" y1="116" x2="578" y2="124" transform="rotate(315 578 160)" /><line x1="578" y1="116" x2="578" y2="124" transform="rotate(330 578 160)" /><line x1="578" y1="116" x2="578" y2="124" transform="rotate(345 578 160)" /></g><circle cx="578" cy="160" r="22" fill="none" stroke="rgba(212,168,90,.45)" strokeWidth="1.5" /><path d="M578 140V180M558 160H598" stroke="rgba(185,178,170,.5)" strokeWidth="3" strokeLinecap="round" /><circle cx="578" cy="160" r="10" fill="url(#mqChrome)" /></g>
        </g>
    </svg>
  )
})

export default SewingMachine
