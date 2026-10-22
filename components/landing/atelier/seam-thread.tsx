'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

/**
 * Costura que acompanha a rolagem da landing.
 *
 * - A linha sai do tecido da máquina do herói, atravessa acima dos prints e
 *   desce pela margem da coluna de conteúdo até o fim da página.
 * - Rolando para baixo a agulha costura; rolando para cima um abridor de casas
 *   desfaz os pontos (ficam os furinhos e caem fiapos).
 * - Os títulos marcados com [data-seam-reveal] aparecem quando a agulha passa por eles.
 * - No fim: nó de arremate e a tesoura do logo corta a linha.
 * - Linha terracota nas seções claras (.linen) e dourada nas escuras.
 * - Só recalcula quando há rolagem/redimensionamento (sem custo com a página parada).
 */

interface Props {
  rootRef: React.RefObject<HTMLElement | null>
  /** elemento <svg> da máquina (ponto de saída do tecido) */
  getMachineSvg: () => SVGSVGElement | null
  /** faixa dos prints logo abaixo do herói — a linha atravessa logo acima dela */
  shotsRef: React.RefObject<HTMLElement | null>
  /** começa a costurar (ex.: depois da abertura) */
  start: boolean
  /** false = movimento reduzido/pausado: costura pronta, sem agulha */
  animated: boolean
  /** a preferência de movimento já foi lida (antes disso não faz nada) */
  ready: boolean
}

const GOLD = '#D4A85A'
const TERRA = '#C8714A'
const FRAGS = 8

type El = SVGElement | null

export default function SeamThread({ rootRef, getMachineSvg, shotsRef, start, animated, ready }: Props) {
  // posição da costura sobrevive a pausar/retomar as animações (não recomeça do topo)
  const keep = useRef({ cur: 0, max: 0 })
  const wrapRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const r = useRef<Record<string, El>>({})
  const set = (n: string) => (el: El) => { r.current[n] = el }

  useEffect(() => {
    const root = rootRef.current
    const wrap = wrapRef.current
    const svg = svgRef.current
    const R = r.current
    if (!root || !wrap || !svg || !ready) return
    const revealEls = () => Array.from(root.querySelectorAll<HTMLElement>('[data-seam-reveal]'))

    // ── estado ──
    const s = {
      T: 1, H: 0, cur: 0, goal: 0, max: 0, dir: 1, flip: 0, tail: 0, vel: 0,
      moving: false, settled: false, dirty: true, tied: false, lastFrag: 0, fragIdx: 0,
      lane: 30, end: { x: 0, y: 0 }, lin: [] as [number, number][], smp: [] as [number, number][],
      reveals: [] as { el: HTMLElement; y: number }[], col: '', small: false,
    }
    const tie = { knot: 0, cut: 0, fall: 0 }
    const stitch = R.stitch as SVGPathElement

    const f1 = (n: number) => n.toFixed(1)

    const layout = () => {
      const rr = root.getBoundingClientRect()
      const W = root.clientWidth
      // altura do conteúdo (offsetHeight): scrollHeight incluiria a própria camada da costura
      // e a página nunca encolheria (ex.: girar o celular ou estreitar e alargar a janela)
      const H = root.offsetHeight
      const rel = (el: Element) => { const b = el.getBoundingClientRect(); return { l: b.left - rr.left, t: b.top - rr.top, b: b.bottom - rr.top } }
      s.small = W < 760
      // alinha à margem da coluna de conteúdo (max 1240px) em telas largas
      s.lane = s.small ? 9 : Math.max(30, Math.min((W - 1240) / 2 + 10, 140))
      const lane = s.lane
      const shots = shotsRef.current ? rel(shotsRef.current) : { t: 600, l: 0, b: 600 }
      const gy = shots.t - 22
      const foot = root.querySelector('footer')
      const endY = (foot ? rel(foot).t : H) - 40
      let d: string
      if (s.small) {
        d = `M${f1(lane)} ${f1(gy)}`
      } else {
        const m = getMachineSvg()
        let sx = lane + 80
        let sy = gy - 120
        if (m) {
          const ctm = m.getScreenCTM()
          const mb = rel(m)
          if (ctm) {
            const pt = m.createSVGPoint(); pt.x = 0; pt.y = 321
            const sp = pt.matrixTransform(ctm)
            sy = sp.y - rr.top
          }
          sx = Math.max(lane + 80, mb.l + 3)
        }
        if (sy > gy - 40) sy = gy - 120
        d = `M${f1(sx)} ${f1(sy)}C${f1(sx)} ${f1(gy - 8)} ${f1(sx - 6)} ${f1(gy)} ${f1(sx - 40)} ${f1(gy)}`
        let x = sx - 40
        const xe = lane + 70
        let side = 1
        while (x > xe + 1) {
          const x2 = Math.max(xe, x - 300); const w = x - x2
          d += `C${f1(x - w * 0.33)} ${f1(gy + 5 * side)} ${f1(x - w * 0.67)} ${f1(gy + 5 * side)} ${f1(x2)} ${f1(gy)}`
          x = x2; side = -side
        }
        d += `C${f1(lane + 22)} ${f1(gy)} ${f1(lane)} ${f1(gy + 22)} ${f1(lane)} ${f1(gy + 70)}`
      }
      const amp = s.small ? 4 : 9
      let side = 1
      for (let y = s.small ? gy : gy + 70; y < endY - 1; y += 360) {
        const y2 = Math.min(endY, y + 360); const h = y2 - y
        d += `C${f1(lane + amp * side)} ${f1(y + h * 0.33)} ${f1(lane + amp * side)} ${f1(y + h * 0.67)} ${f1(lane)} ${f1(y2)}`
        side = -side
      }
      wrap.style.height = H + 'px'
      svg.setAttribute('width', String(W)); svg.setAttribute('height', String(H)); svg.setAttribute('viewBox', `0 0 ${W} ${H}`)
      ;[R.maskBox, R.holeBox].forEach((b) => { b?.setAttribute('width', String(W)); b?.setAttribute('height', String(H)) })
      ;[R.mask, R.holeMask, R.holes, R.holesL, R.stitch, R.stitchL].forEach((p) => p?.setAttribute('d', d))
      const sw = s.small ? '1.6' : '2.2'
      R.stitch?.setAttribute('stroke-width', sw); R.stitchL?.setAttribute('stroke-width', s.small ? '1.9' : '2.6')
      let ld = ''
      s.lin = []
      root.querySelectorAll('.linen').forEach((el) => { const b = rel(el); s.lin.push([b.t, b.b]); ld += `M0 ${f1(b.t)}H${W}V${f1(b.b)}H0Z` })
      R.linen?.setAttribute('d', ld || 'M0 0')
      R.knot?.setAttribute('d', `M${f1(lane)} ${f1(endY)}c7 1 9 8 3 10s-8-3-3-8 6-3 7 1`)
      R.endTail?.setAttribute('d', `M${f1(lane)} ${f1(endY)}q10 12 3 24t4 18`)
      s.end = { x: lane, y: endY }
      s.T = stitch.getTotalLength()
      s.H = H
      // tabela comprimento → altura (para achar o ponto da linha pela rolagem)
      const smp: [number, number][] = []
      let my = -1e9
      for (let L = 0; L <= s.T; L += 6) { my = Math.max(my, stitch.getPointAtLength(L).y); smp.push([L, my]) }
      smp.push([s.T, Math.max(my, endY)])
      s.smp = smp
      s.reveals = revealEls().filter((el) => !el.classList.contains('is-sewn')).map((el) => ({ el, y: rel(el).t }))
      if (s.cur > s.T) s.cur = s.T
      s.dirty = true
    }

    const lenForY = (y: number) => {
      const a = s.smp
      if (!a.length) return 0
      if (y <= a[0][1]) return 0
      if (y >= a[a.length - 1][1]) return a[a.length - 1][0]
      let lo = 0, hi = a.length - 1
      while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (a[mid][1] <= y) lo = mid; else hi = mid }
      const k = (y - a[lo][1]) / Math.max(0.001, a[hi][1] - a[lo][1])
      return a[lo][0] + (a[hi][0] - a[lo][0]) * k
    }
    const inLinen = (y: number) => s.lin.some(([a, b]) => y >= a && y <= b)

    const draw = (t: number) => {
      const T = s.T
      const L = Math.max(0, Math.min(T, s.cur))
      const M = Math.max(L, s.max)
      R.mask?.setAttribute('stroke-dasharray', `${f1(L)} ${T + 50}`)
      R.holeMask?.setAttribute('stroke-dasharray', `${f1(M)} ${T + 50}`)
      const p = stitch.getPointAtLength(L)
      const q = stitch.getPointAtLength(Math.min(T, L + 2))
      const ang = L >= T - 2 ? 90 : Math.atan2(q.y - p.y, q.x - p.x) * 180 / Math.PI
      const e = s.flip * s.flip * (3 - 2 * s.flip)
      const bob = s.moving ? Math.min(3, 0.6 + Math.abs(s.vel) / 400) * Math.sin(t * 38) : 0
      const sc = s.small ? 0.7 : 1
      const fade = Math.max(0, 1 - tie.knot * 1.6)
      // agulha (costurando) e abridor de casas (descosturando) trocam conforme a direção
      R.needle?.setAttribute('transform', `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) rotate(${(ang + 180 * e).toFixed(1)}) scale(${sc}) translate(${bob.toFixed(2)} 0)`)
      R.needle?.setAttribute('opacity', (fade * (1 - e)).toFixed(2))
      R.ripper?.setAttribute('transform', `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) rotate(${(ang + 180).toFixed(1)}) scale(${sc}) translate(${(-bob).toFixed(2)} 0)`)
      R.ripper?.setAttribute('opacity', (fade * e).toFixed(2))
      R.tail?.setAttribute('opacity', s.tail.toFixed(2))
      const col = inLinen(p.y) ? TERRA : GOLD
      if (col !== s.col) { s.col = col; R.nThread?.setAttribute('stroke', col); R.tail?.setAttribute('stroke', col) }
      // arremate + corte
      const E = s.end
      R.knot?.setAttribute('stroke-dashoffset', (1 - tie.knot).toFixed(3))
      const a = Math.min(1, tie.cut / 0.55)
      const sn = tie.cut > 0.55 ? Math.sin((tie.cut - 0.55) * 46) * 14 : 0
      R.cut?.setAttribute('opacity', tie.cut > 0 ? (Math.min(1, a * 3) * (1 - tie.fall)).toFixed(2) : '0')
      R.cut?.setAttribute('transform', `translate(${f1(E.x + 30 + 90 * (1 - a))} ${f1(E.y + 18)}) rotate(${f1(-20 + sn)}) scale(${sc})`)
      R.endTail?.setAttribute('opacity', tie.knot > 0.6 ? (1 - tie.fall).toFixed(2) : '0')
      R.endTail?.setAttribute('transform', `translate(0 ${f1(36 * tie.fall * tie.fall)}) rotate(${f1(28 * tie.fall)} ${E.x} ${E.y})`)
      // títulos aparecem quando a agulha passa
      if (s.reveals.length) {
        s.reveals = s.reveals.filter((rv) => { if (p.y >= rv.y - 30) { rv.el.classList.add('is-sewn'); return false } return true })
      }
      return p
    }

    const frags = Array.from({ length: FRAGS }, (_, i) => R['frag' + i])
    const dropFrag = (x: number, y: number) => {
      const el = frags[s.fragIdx++ % FRAGS]
      if (!el) return
      el.setAttribute('stroke', s.col || GOLD)
      gsap.killTweensOf(el)
      gsap.set(el, { x, y, rotation: Math.random() * 180, opacity: 0.9, transformOrigin: '50% 50%' })
      gsap.to(el, { y: y + 30 + Math.random() * 20, x: x + (Math.random() * 24 - 12), rotation: '+=120', opacity: 0, duration: 0.9, ease: 'power1.in' })
    }

    // ── modo estático (movimento reduzido/pausado) ──
    if (!animated) {
      layout()
      s.cur = s.max = s.T
      tie.knot = 1; tie.cut = 0; tie.fall = 1
      draw(0)
      R.needle?.setAttribute('opacity', '0'); R.ripper?.setAttribute('opacity', '0')
      revealEls().forEach((el) => el.classList.add('is-sewn'))
      root.classList.remove('seam-armed')
      wrap.style.opacity = '1'
      const ro = new ResizeObserver(() => { layout(); s.cur = s.max = s.T; draw(0) })
      ro.observe(root)
      return () => ro.disconnect()
    }

    // títulos ficam escondidos até a costura chegar
    root.classList.add('seam-armed')
    if (!start) return () => { root.classList.remove('seam-armed') }

    layout()
    s.cur = s.lastFrag = Math.min(keep.current.cur, s.T)
    s.max = Math.min(keep.current.max, s.T)
    gsap.to(wrap, { opacity: 1, duration: 0.5, ease: 'power1.out' })
    const tieTl = gsap.timeline({ paused: true, onUpdate: () => { draw(gsap.ticker.time) } })
      .to(tie, { knot: 1, duration: 0.55, ease: 'power2.inOut' })
      .to(tie, { cut: 1, duration: 0.8, ease: 'none' }, 0.35)
      .to(tie, { fall: 1, duration: 0.6, ease: 'power2.in' }, 1.1)

    // posição da agulha na página: ~70% da tela, descendo até o fim quando a rolagem acaba
    const targetY = () => {
      const vh = window.innerHeight
      const max = Math.max(1, document.documentElement.scrollHeight - vh)
      const ramp = Math.min(1, Math.max(0, (window.scrollY - (max - vh * 0.6)) / (vh * 0.6)))
      return -root.getBoundingClientRect().top + vh * (0.7 + 0.3 * ramp)
    }

    const tick = (time: number, dt: number) => {
      if (!s.dirty && s.settled) return
      const d = Math.min(dt, 50) / 1000
      const ty = targetY()
      s.goal = lenForY(ty)
      s.dirty = false
      const diff = s.goal - s.cur
      const prev = s.cur
      s.moving = Math.abs(diff) > 0.6
      if (s.moving) { s.cur += diff * Math.min(1, d * 7); s.dir = diff > 0 ? 1 : -1 }
      s.vel = d > 0 ? (s.cur - prev) / d : 0
      s.max = Math.max(s.max, s.cur)
      const ft = s.dir < 0 ? 1 : 0
      const tt = s.dir < 0 ? (s.moving ? 1 : 0.75) : 0
      s.flip += (ft - s.flip) * Math.min(1, d * 9)
      s.tail += (tt - s.tail) * Math.min(1, d * 6)
      s.settled = !s.moving && Math.abs(ft - s.flip) < 0.002 && Math.abs(tt - s.tail) < 0.002
      if (!s.tied && s.cur >= s.T - 2) { s.tied = true; tieTl.play() }
      else if (s.tied && s.cur < s.T - 24) { s.tied = false; tieTl.reverse() }
      const p = draw(time)
      if (s.dir < 0 && s.moving && s.lastFrag - s.cur > 22) { dropFrag(p.x, p.y); s.lastFrag = s.cur }
      if (s.dir > 0) s.lastFrag = s.cur
      // garantia: um título que já está bem acima da linha de leitura aparece mesmo se a agulha atrasar
      if (s.reveals.length) s.reveals = s.reveals.filter((rv) => { if (ty >= rv.y + 240) { rv.el.classList.add('is-sewn'); return false } return true })
      keep.current.cur = s.cur
      keep.current.max = s.max
    }
    gsap.ticker.add(tick)

    const onScroll = () => { s.dirty = true }
    let raf = 0
    const onResize = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(layout) }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    const ro = new ResizeObserver(onResize)
    ro.observe(root)
    // a máquina ainda pode estar entrando quando a costura começa
    const late = gsap.delayedCall(1.3, layout)

    return () => {
      gsap.ticker.remove(tick)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      ro.disconnect()
      late.kill()
      tieTl.kill()
      cancelAnimationFrame(raf)
      root.classList.remove('seam-armed')
    }
  }, [rootRef, shotsRef, getMachineSvg, start, animated, ready])

  return (
    <div ref={wrapRef} aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: 0, zIndex: 15, pointerEvents: 'none', opacity: 0 }}>
      <svg ref={svgRef} width="10" height="10" viewBox="0 0 10 10" style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <mask id="seamSew" ref={set('maskBox')} maskUnits="userSpaceOnUse" x="0" y="0" width="10" height="10">
            <path ref={set('mask')} d="M0 0" stroke="#fff" strokeWidth="12" fill="none" />
          </mask>
          <mask id="seamHoles" ref={set('holeBox')} maskUnits="userSpaceOnUse" x="0" y="0" width="10" height="10">
            <path ref={set('holeMask')} d="M0 0" stroke="#fff" strokeWidth="12" fill="none" />
          </mask>
          <clipPath id="seamLinen" clipPathUnits="userSpaceOnUse"><path ref={set('linen')} d="M0 0" /></clipPath>
          <clipPath id="seamRound"><rect x="-15" y="-15" width="30" height="30" rx="7" /></clipPath>
        </defs>
        <path ref={set('holes')} d="M0 0" fill="none" stroke={GOLD} strokeOpacity=".38" strokeWidth="2.6" strokeLinecap="round" strokeDasharray="0 11 0 7" mask="url(#seamHoles)" />
        <path ref={set('holesL')} d="M0 0" fill="none" stroke="#2C1810" strokeOpacity=".3" strokeWidth="2.6" strokeLinecap="round" strokeDasharray="0 11 0 7" mask="url(#seamHoles)" clipPath="url(#seamLinen)" />
        <path ref={set('stitch')} d="M0 0" fill="none" stroke={GOLD} strokeWidth="2.2" strokeDasharray="11 7" mask="url(#seamSew)" />
        <path ref={set('stitchL')} d="M0 0" fill="none" stroke={TERRA} strokeWidth="2.6" strokeDasharray="11 7" mask="url(#seamSew)" clipPath="url(#seamLinen)" />
        <path ref={set('knot')} d="M0 0" pathLength={1} fill="none" stroke={GOLD} strokeWidth="1.8" strokeLinecap="round" strokeDasharray="1 1" strokeDashoffset="1" />
        <path ref={set('endTail')} d="M0 0" fill="none" stroke={GOLD} strokeWidth="1.3" strokeLinecap="round" opacity="0" />
        {Array.from({ length: FRAGS }, (_, i) => (
          <path key={i} ref={set('frag' + i)} d="M-5 0q2.5-3 5 0t5 0" fill="none" stroke={GOLD} strokeWidth="1.4" strokeLinecap="round" opacity="0" />
        ))}
        {/* agulha com linha */}
        <g ref={set('needle')}>
          <path ref={set('tail')} d="M-35 0c-5 6-1 11-7 16s-2 10-9 14-3 9-10 12" fill="none" stroke={GOLD} strokeWidth="1.3" strokeLinecap="round" opacity="0" />
          <path ref={set('nThread')} d="M-35 0Q-18 5-1 1" fill="none" stroke={GOLD} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M-43 0c0-1.4 1.4-2 3-2H-7L0 0-7 2H-40c-1.6 0-3-.6-3-2Z" fill="#CFC6BC" stroke="#2C1810" strokeWidth=".8" />
          <path d="M-38 -1.2H-9" stroke="#fff" strokeOpacity=".7" strokeWidth=".6" />
          <ellipse cx="-35" cy="0" rx="3" ry="1" fill="#2C1810" />
        </g>
        {/* abridor de casas (descosturar) */}
        <g ref={set('ripper')} opacity="0">
          <rect x="-50" y="-4" width="28" height="8" rx="4" fill={TERRA} stroke="#2C1810" strokeWidth=".8" />
          <path d="M-46 -1.6H-26" stroke="#fff" strokeOpacity=".35" strokeWidth=".8" strokeLinecap="round" />
          <rect x="-23" y="-1.4" width="16" height="2.8" rx="1" fill="#CFC6BC" stroke="#5B544D" strokeWidth=".5" />
          <path d="M-7.5 0.6L0 0.6L-1 -0.4" fill="none" stroke="#CFC6BC" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M-7.5 -0.6Q-5 -3.5 -3.4 -4.2" fill="none" stroke="#CFC6BC" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="-3.2" cy="-4.4" r="1.7" fill="#B3412F" />
        </g>
        {/* tesoura do logo para o corte final */}
        <g ref={set('cut')} opacity="0">
          <g clipPath="url(#seamRound)">
            <image href="/logo-icon.svg" x="-15" y="-15" width="30" height="30" />
          </g>
        </g>
      </svg>
    </div>
  )
}
