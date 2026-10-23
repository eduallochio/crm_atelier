'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { MOTION_KEY } from './motion'

/**
 * Título do herói "bordado": cada linha ganha primeiro o contorno em ponto
 * corrido dourado e depois o preenchimento em ponto cheio (cetim), com a
 * agulha avançando na frente do bordado.
 *
 * O texto real continua no <h1> (SEO, leitores de tela, seleção); o bordado é
 * um SVG decorativo por cima, alinhado pela linha de base de cada linha.
 * Um script inline esconde o texto antes da primeira pintura quando o bordado
 * vai acontecer, para não piscar; se o JavaScript falhar, o texto volta em 4s.
 */

export interface EmbroideredLine {
  text: string
  color: string
  italic?: boolean
}

interface Props {
  lines: EmbroideredLine[]
  /** começa a bordar */
  play: boolean
  /** animações permitidas; se false mostra o texto normal */
  animated: boolean
  className?: string
}

interface LineBox { x: number; y: number; w: number; fs: number; family: string; ls: number }

const GOLD = '#D4A85A'
const GATE = `(function(){var d=document.documentElement;try{var o=localStorage.getItem('${MOTION_KEY}')==='1';var r=window.matchMedia('(prefers-reduced-motion: reduce)').matches;if(o||r)return;d.setAttribute('data-embroider','on');setTimeout(function(){if(!window.__embReady)d.removeAttribute('data-embroider')},4000)}catch(e){}})()`

export default function EmbroideredTitle({ lines, play, animated, className }: Props) {
  const h1 = useRef<HTMLHeadingElement>(null)
  const svg = useRef<SVGSVGElement>(null)
  const [boxes, setBoxes] = useState<LineBox[] | null>(null)
  const played = useRef(false)

  // mede cada linha (posição, linha de base, largura) — depois das fontes e a cada mudança de tamanho
  useEffect(() => {
    const el = h1.current
    if (!el || !animated) return
    const measure = () => {
      // cada linha precisa caber numa linha só (o bordado não quebra linha):
      // se a coluna for estreita demais, reduz o tamanho do título até caber
      el.style.fontSize = ''
      const avail = el.clientWidth
      const widest = Math.max(...Array.from(el.querySelectorAll<HTMLElement>('.emb-text')).map((t) => t.getBoundingClientRect().width))
      if (avail > 0 && widest > avail) {
        el.style.fontSize = `${(parseFloat(getComputedStyle(el).fontSize) * avail / widest * 0.98).toFixed(2)}px`
      }
      const hr = el.getBoundingClientRect()
      const out: LineBox[] = []
      el.querySelectorAll<HTMLElement>('.emb-line').forEach((line) => {
        const t = line.querySelector<HTMLElement>('.emb-text')
        const base = line.querySelector<HTMLElement>('.emb-base')
        if (!t || !base) return
        const tr = t.getBoundingClientRect()
        const cs = getComputedStyle(t)
        out.push({
          x: tr.left - hr.left,
          y: base.getBoundingClientRect().top - hr.top,
          w: tr.width,
          fs: parseFloat(cs.fontSize),
          family: cs.fontFamily,
          ls: parseFloat(cs.letterSpacing) || 0,
        })
      })
      setBoxes(out)
    }
    let alive = true
    document.fonts?.ready.then(() => { if (alive) measure() })
    requestAnimationFrame(() => { if (alive) measure() })
    const ro = new ResizeObserver(() => measure())
    ro.observe(el)
    return () => { alive = false; ro.disconnect() }
  }, [animated])

  // o atributo do script inline só segura o texto até o bordado montar; depois quem manda
  // é a classe .emb-on (e, sem animação, o texto volta a aparecer normalmente)
  useEffect(() => {
    if (!animated || boxes) {
      ;(window as unknown as { __embReady?: boolean }).__embReady = true
      document.documentElement.removeAttribute('data-embroider')
    }
  }, [animated, boxes])

  // o bordado
  useEffect(() => {
    const s = svg.current
    if (!s || !boxes || !animated) return
    // já bordado (ex.: animações pausadas e retomadas): mostra pronto
    if (played.current) { gsap.set(s, { opacity: 1 }); return }
    if (!play) return
    played.current = true
    const q = gsap.utils.selector(s)
    const needle = s.querySelector<SVGGElement>('.emb-needle')
    const tl = gsap.timeline()
    gsap.set(s, { opacity: 1 })
    // ritmo do bordado: devagar o bastante para se ver o ponto sendo feito (~6 s nas três linhas).
    // a agulha borda uma linha de cada vez: a próxima só começa quando a anterior termina
    const FILL = 1.8                // preenchimento com a agulha andando
    const STAGGER = FILL + 0.05     // intervalo entre o começo de uma linha e o da seguinte
    const OUTLINE = 1.5             // contorno em ponto atrás
    const LAG = 0.35                // o preenchimento começa um pouco depois do contorno
    boxes.forEach((b, i) => {
      const at = i * STAGGER
      const outline = q(`.emb-outline-mask-${i}`)
      const wipe = q(`.emb-wipe-${i}`)
      tl.fromTo(outline, { attr: { 'stroke-dasharray': '0 6000' } }, { attr: { 'stroke-dasharray': '6000 0' }, duration: OUTLINE, ease: 'power1.inOut' }, at)
      const st = { p: 0 }
      tl.fromTo(wipe, { attr: { width: 0 } }, { attr: { width: b.w + 20 }, duration: FILL, ease: 'none' }, at + LAG)
        .to(st, {
          p: 1, duration: FILL, ease: 'none',
          onStart: () => { if (needle) gsap.set(needle, { autoAlpha: 1 }) },
          onUpdate: () => {
            if (!needle) return
            const x = b.x + b.w * st.p
            const bob = Math.sin(st.p * 90) * b.fs * 0.06
            needle.setAttribute('transform', `translate(${x.toFixed(1)} ${(b.y - b.fs * 0.32 + bob).toFixed(1)}) rotate(68) scale(${(b.fs / 100).toFixed(3)})`)
          },
        }, at + LAG)
    })
    tl.to(needle ?? {}, { autoAlpha: 0, duration: 0.3 })
    return () => { tl.progress(1) }
  }, [boxes, play, animated])

  const on = animated && !!boxes

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: GATE }} />
      <style>{`
        .emb-h1 { position: relative; }
        .emb-line { display: block; white-space: nowrap; }
        .emb-base { display: inline-block; width: 0; height: 0; vertical-align: baseline; }
        html[data-embroider="on"] .emb-h1 .emb-text, .emb-h1.emb-on .emb-text { color: transparent !important; }
        .emb-svg { position: absolute; left: 0; top: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
      `}</style>
      <h1 ref={h1} className={`emb-h1 ${on ? 'emb-on' : ''} ${className ?? ''}`}>
        {lines.map((l) => (
          <span key={l.text} className="emb-line">
            <span className="emb-text" style={{ color: l.color, fontStyle: l.italic ? 'italic' : undefined }}>{l.text}</span>
            <span className="emb-base" aria-hidden="true" />
          </span>
        ))}
        {on && (
          <svg ref={svg} className="emb-svg" aria-hidden="true" style={{ opacity: 0 }}>
            <defs>
              {lines.map((l, i) => (
                <pattern key={i} id={`embSatin${i}`} patternUnits="userSpaceOnUse" width="3.2" height="3.2" patternTransform="rotate(38)">
                  <rect width="3.2" height="3.2" fill={l.color} />
                  <line x1="0.4" y1="0" x2="0.4" y2="3.2" stroke="rgba(0,0,0,.24)" strokeWidth=".7" />
                  <line x1="2" y1="0" x2="2" y2="3.2" stroke="rgba(255,255,255,.22)" strokeWidth=".5" />
                </pattern>
              ))}
              {boxes.map((b, i) => (
                <g key={i}>
                  <mask id={`embOutline${i}`} maskUnits="userSpaceOnUse" x={b.x - 40} y={b.y - b.fs * 1.3} width={b.w + 80} height={b.fs * 1.8}>
                    <text
                      className={`emb-outline-mask-${i}`}
                      x={b.x} y={b.y}
                      fontSize={b.fs} fontFamily={b.family} fontWeight={300}
                      fontStyle={lines[i]?.italic ? 'italic' : 'normal'}
                      letterSpacing={b.ls}
                      fill="none" stroke="#fff" strokeWidth={Math.max(4, b.fs * 0.08)} strokeDasharray="6000 0"
                    >{lines[i]?.text}</text>
                  </mask>
                  <clipPath id={`embWipe${i}`} clipPathUnits="userSpaceOnUse">
                    <rect className={`emb-wipe-${i}`} x={b.x - 10} y={b.y - b.fs * 1.3} width={b.w + 20} height={b.fs * 1.8} />
                  </clipPath>
                </g>
              ))}
            </defs>
            {boxes.map((b, i) => {
              const l = lines[i]
              if (!l) return null
              const common = { x: b.x, y: b.y, fontSize: b.fs, fontFamily: b.family, fontWeight: 300, fontStyle: l.italic ? 'italic' : 'normal', letterSpacing: b.ls }
              return (
                <g key={i}>
                  {/* ponto cheio (cetim) */}
                  <text {...common} fill={`url(#embSatin${i})`} clipPath={`url(#embWipe${i})`}>{l.text}</text>
                  {/* contorno em ponto corrido */}
                  <text {...common} fill="none" stroke={GOLD} strokeWidth={Math.max(0.8, b.fs * 0.012)} strokeDasharray={`${(b.fs * 0.05).toFixed(1)} ${(b.fs * 0.035).toFixed(1)}`} strokeLinecap="round" mask={`url(#embOutline${i})`}>{l.text}</text>
                </g>
              )
            })}
            {/* agulha */}
            <g className="emb-needle" opacity="0">
              <path d="M-35 0Q-52 -16 -70 -6" fill="none" stroke={GOLD} strokeWidth="1.4" strokeLinecap="round" />
              <path d="M-43 0c0-1.6 1.6-2.4 3.4-2.4H-7L0 0-7 2.4H-39.6c-1.8 0-3.4-.8-3.4-2.4Z" fill="#CFC6BC" stroke="#2C1810" strokeWidth=".8" />
              <path d="M-38 -1.3H-9" stroke="#fff" strokeOpacity=".7" strokeWidth=".7" />
              <ellipse cx="-35" cy="0" rx="3.2" ry="1.1" fill="#2C1810" />
            </g>
          </svg>
        )}
      </h1>
    </>
  )
}
