'use client'

import Link from 'next/link'
import {
  Check, X, FileText, Wallet, Users, Scissors,
  BarChart3, ArrowRight,
  Bell, Shield, MessageCircle, Printer, Package,
} from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import StaggeredMenu from '@/components/landing/staggered-menu'
import NavBar from '@/components/landing/nav-bar'
import SewingMachine, { type SewingMachineHandle } from '@/components/landing/atelier/sewing-machine'
import SeamThread from '@/components/landing/atelier/seam-thread'
import IntroCut from '@/components/landing/atelier/intro-cut'
import EmbroideredTitle from '@/components/landing/atelier/embroidered-title'
import { MotionProvider, useMotionPref } from '@/components/landing/atelier/motion'
import { useTrack, usePageView } from '@/hooks/use-track'
import type { PublicPlan } from '@/app/api/plans/route'

if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger, MotionPathPlugin, DrawSVGPlugin)

interface LandingContent {
  hero_title?: string
  hero_subtitle?: string
  hero_cta_primary?: string
  hero_cta_secondary?: string
  stats_orgs?: string
  stats_clients?: string
  stats_orders?: string
  footer_tagline?: string
  features_json?: string
  how_it_works_json?: string
  testimonials_json?: string
  faq_json?: string
  whatsapp_support_phone?: string
  promo_banner_active?: string
  promo_banner_text?: string
  promo_banner_deadline?: string
  announcement?: string
}

/* ─── Planos padrão (fallback se API falhar) ─────────────────────────────── */
const DEFAULT_PLANS: PublicPlan[] = [
  {
    id: 'free',
    slug: 'free',
    name: 'Free',
    description: 'Para começar',
    price: 0,
    price_annual: null,
    annual_note: null,
    badge: null,
    is_featured: false,
    cta_text: 'Criar conta grátis',
    cta_url: '/cadastro',
    sort_order: 1,
    features: [
      { text: 'Até 50 clientes', included: true },
      { text: 'Até 20 serviços cadastrados', included: true },
      { text: 'Até 100 ordens de serviço', included: true },
      { text: 'Até 2 usuários', included: true },
      { text: 'Dashboard e relatórios básicos', included: true },
      { text: 'Controle de caixa', included: true },
      { text: 'Contas a pagar/receber', included: true },
      { text: 'Exportação Excel/PDF', included: false },
      { text: 'Suporte prioritário', included: false },
    ],
  },
  {
    id: 'pro',
    slug: 'pro',
    name: 'Pro',
    description: 'Para crescer',
    price: 59.9,
    price_annual: 599,
    annual_note: 'ou R$ 599/ano — 2 meses grátis',
    badge: 'Popular',
    is_featured: true,
    cta_text: 'Iniciar teste grátis',
    cta_url: '/cadastro',
    sort_order: 2,
    features: [
      { text: 'Clientes ilimitados', included: true },
      { text: 'Serviços ilimitados', included: true },
      { text: 'Ordens de serviço ilimitadas', included: true },
      { text: 'Até 3 usuários', included: true },
      { text: 'Exportação Excel e PDF', included: true },
      { text: 'Controle de estoque', included: true },
      { text: 'Dashboard e relatórios completos', included: true },
      { text: 'Suporte prioritário', included: true },
    ],
  },
]

/* ─── Conteúdo fixo (mesmos textos da landing anterior) ─────────────────── */
const STATS = [
  { num: '50', to: 50, desc: 'clientes no plano gratuito' },
  { num: '100', to: 100, desc: 'ordens de serviço grátis' },
  { num: 'R$ 0', to: 0, desc: 'para começar, sem cartão' },
  { num: '100%', to: 0, desc: 'dados seguros, isolados por ateliê' },
]

const DEFAULT_STEPS = [
  { n: '01', title: 'Crie sua conta', desc: 'Cadastro em menos de 2 minutos. Sem cartão de crédito. Configure o nome do seu ateliê e comece imediatamente.', detail: 'Grátis para começar' },
  { n: '02', title: 'Cadastre seus dados', desc: 'Adicione clientes, serviços e preços. O sistema se adapta ao seu jeito de trabalhar, não o contrário.', detail: 'Simples e rápido' },
  { n: '03', title: 'Gerencie com clareza', desc: 'Ordens de serviço, caixa, relatórios — tudo em uma tela. De qualquer dispositivo, a qualquer hora.', detail: 'Acesso em qualquer lugar' },
]

const FEATURES = [
  { Icon: BarChart3, title: 'Dashboard em tempo real', desc: 'KPIs atualizados instantaneamente. Visualize receita, ordens em aberto e performance do seu ateliê de um relance.' },
  { Icon: FileText, title: 'Ordens de serviço', desc: 'Timeline completa por ordem. Status, histórico de alterações, anotações e valores em um só lugar.' },
  { Icon: Users, title: 'Gestão de clientes', desc: 'Cadastro completo com histórico de ordens, aniversários e observações de cada cliente.' },
  { Icon: Wallet, title: 'Controle financeiro', desc: 'Caixa, contas a pagar e a receber com relatórios de fluxo de caixa mensais e metas de faturamento.' },
  { Icon: MessageCircle, title: 'Envio por WhatsApp', desc: 'Envie o resumo da OS direto para o cliente via WhatsApp com um clique. Comunicação rápida e profissional.' },
  { Icon: Printer, title: 'Impressão térmica', desc: 'Imprima comprovantes em impressoras térmicas de 58mm ou 80mm. Configurável por ateliê.' },
  { Icon: Package, title: 'Controle de estoque', desc: 'Gerencie materiais e insumos. Baixa automática ao concluir uma OS. Alertas de estoque mínimo.' },
  { Icon: Bell, title: 'Alertas inteligentes', desc: 'Ordens atrasadas, contas vencidas e aniversários de clientes — tudo sinalizado no menu lateral em tempo real.' },
  { Icon: Shield, title: 'Dados seguros e isolados', desc: 'Arquitetura multi-tenant: cada ateliê tem seus dados completamente separados. Conformidade total com a LGPD.' },
]

const BEFORE = [
  ['Planilhas desorganizadas', 'Dados espalhados, difícil de encontrar'],
  ['Anotações em papel', 'Informações que somem ou se perdem'],
  ['Caixa que não fecha', 'Sem controle preciso do que entrou e saiu'],
  ['Horas perdidas buscando', 'Histórico de clientes inacessível'],
  ['Decisões no escuro', 'Sem dados para analisar o negócio'],
]

const AFTER = [
  ['Tudo centralizado', 'Busca instantânea de qualquer cliente, ordem ou serviço'],
  ['Histórico completo', 'Cada cliente com todas as ordens e valores salvos'],
  ['Controle financeiro preciso', 'Caixa, contas a pagar e receber em tempo real'],
  ['WhatsApp integrado', 'Envie o resumo da OS para o cliente com um clique'],
  ['Impressão profissional', 'Comprovantes em impressora térmica 58mm ou 80mm'],
  ['Decisões baseadas em dados', 'Dashboard com metas, gráficos e relatórios completos'],
]

const HERO_LINES = [
  { text: 'Seu ateliê,', color: '#F7F0E6' },
  { text: 'organizado', color: '#C8714A', italic: true },
  { text: 'como merece.', color: '#F7F0E6' },
]

const NEEDLE_PATH = 'M2 6C2 4.6 3.4 4 5 4H36L43 6L36 8H5C3.4 8 2 7.4 2 6Z'

/** Título com linhas que sobem quando a costura passa por elas */
function SewnTitle({ lines, className, style }: { lines: React.ReactNode[]; className?: string; style?: React.CSSProperties }) {
  return (
    <h2 className={`display ${className ?? ''}`} style={style}>
      {lines.map((l, i) => (
        <span key={i} className="m-mask"><span data-seam-reveal="">{l}</span></span>
      ))}
    </h2>
  )
}

/* ─── Page ──────────────────────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <MotionProvider>
      <Landing />
    </MotionProvider>
  )
}

function Landing() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [plans, setPlans] = useState<PublicPlan[]>(DEFAULT_PLANS)
  const [cms, setCms] = useState<LandingContent>({})
  const [introDone, setIntroDone] = useState(false)
  const [embPlay, setEmbPlay] = useState(false)
  const motion = useMotionPref()
  const animated = motion.enabled
  const track = useTrack()
  usePageView('/')

  const rootRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLElement>(null)
  const shotsRef = useRef<HTMLDivElement>(null)
  const machine = useRef<SewingMachineHandle>(null)
  const goldStitch = useRef<SVGLineElement>(null)
  const stepsRef = useRef<HTMLDivElement>(null)
  const weaveRef = useRef<SVGPathElement>(null)
  const needleIconRef = useRef<SVGSVGElement>(null)
  const ctaPathRef = useRef<SVGPathElement>(null)
  const ctaNeedleRef = useRef<SVGSVGElement>(null)
  const ctaSewRef = useRef<HTMLDivElement>(null)
  const heroPlayed = useRef(false)

  const bannerExpired = !!cms.promo_banner_deadline && Date.now() > new Date(cms.promo_banner_deadline).getTime()
  const bannerVisible = cms.promo_banner_active === 'true' && !!cms.promo_banner_text && !bannerExpired

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    fetch('/api/plans').then((r) => r.ok ? r.json() : Promise.reject()).then((data) => { if (Array.isArray(data) && data.length > 0) setPlans(data) }).catch(() => {})
    fetch('/api/landing').then((r) => r.json()).then(setCms).catch(() => {})
  }, [])

  // CMS helpers with fallback
  const c = {
    heroSubtitle: cms.hero_subtitle || 'Gerencie clientes, ordens de serviço e finanças em um único lugar.\nFeito especialmente para costureiras e proprietárias de ateliê.',
    footerTagline: cms.footer_tagline || 'Meu Atelier Sistema',
    whatsappPhone: cms.whatsapp_support_phone || '',
  }

  // fecha menu ao clicar fora
  useEffect(() => {
    if (!menuOpen) return
    const fn = () => setMenuOpen(false)
    document.addEventListener('click', fn)
    return () => document.removeEventListener('click', fn)
  }, [menuOpen])

  const announcement = cms.announcement?.trim() || ''

  const steps = useMemo(() => {
    let cmsSteps: { step: number; title: string; description: string }[] = []
    try { cmsSteps = cms.how_it_works_json ? JSON.parse(cms.how_it_works_json) : [] } catch { /* */ }
    return cmsSteps.length > 0
      ? cmsSteps.map((s) => ({ n: String(s.step).padStart(2, '0'), title: s.title, desc: s.description, detail: '' }))
      : DEFAULT_STEPS
  }, [cms.how_it_works_json])

  const testimonials = useMemo(() => {
    let t: { name: string; role: string; text: string }[] = []
    try { t = cms.testimonials_json ? JSON.parse(cms.testimonials_json) : [] } catch { /* */ }
    return t
  }, [cms.testimonials_json])

  const faq = useMemo(() => {
    let f: { question: string; answer: string }[] = []
    try { f = cms.faq_json ? JSON.parse(cms.faq_json) : [] } catch { /* */ }
    return f
  }, [cms.faq_json])

  const getMachineSvg = useCallback(() => machine.current?.svg() ?? null, [])
  const onStitch = useCallback((off: number) => { goldStitch.current?.setAttribute('stroke-dashoffset', off.toFixed(2)) }, [])

  /* ── entrada do herói (por baixo da abertura) ── */
  const heroIn = useCallback(() => {
    const hero = heroRef.current
    if (!hero || heroPlayed.current) return
    heroPlayed.current = true
    const q = gsap.utils.selector(hero)
    const tl = gsap.timeline()
    tl.from(q('.hero-tag'), { autoAlpha: 0, y: 10, duration: 0.5, ease: 'power1.out' }, 0.1)
      .from(q('.hero-fade'), { autoAlpha: 0, y: 16, duration: 0.5, stagger: 0.08, ease: 'power1.out' }, 0.55)
      .from(q('.hero-machine'), { autoAlpha: 0, y: 40, duration: 0.9, ease: 'power3.out' }, 0.3)
      .from(q('.hero-stat'), { autoAlpha: 0, y: 12, duration: 0.5, stagger: 0.08, ease: 'power1.out' }, 0.8)
    q<HTMLElement>('.hero-count').forEach((el) => {
      const to = Number(el.dataset.to)
      if (!to) return
      const o = { v: 0 }
      tl.to(o, { v: to, duration: 0.8, ease: 'power2.out', onUpdate: () => { el.textContent = String(Math.round(o.v)) } }, 0.85)
    })
  }, [])

  const onIntroOpen = useCallback(() => { heroIn(); setEmbPlay(true); machine.current?.sew(3.2, 4.2) }, [heroIn])
  const onIntroDone = useCallback(() => {
    if (!heroPlayed.current) machine.current?.sew(3.2, 3)
    setEmbPlay(true)
    setIntroDone(true)
  }, [])

  /* ── animações de seção (depois da abertura) ── */
  useEffect(() => {
    const root = rootRef.current
    if (!root || !introDone || !animated) return
    const ctx = gsap.context(() => {
      const once = (el: string | Element | null, start = 'top 82%') => ({ trigger: el, start, toggleActions: 'play none none none' })

      // velocidade da rolagem acelera a máquina
      ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (st) => machine.current?.boost(Math.abs(st.getVelocity()) / 1500) })

      // prints
      gsap.from('.shot-desk', { autoAlpha: 0, y: 60, rotationX: 14, duration: 0.9, ease: 'power3.out', scrollTrigger: once(shotsRef.current) })
      gsap.from('.shot-mob', { autoAlpha: 0, y: 80, duration: 0.8, delay: 0.25, ease: 'power3.out', scrollTrigger: once(shotsRef.current) })

      // funcionalidades: ícones desenhados
      ScrollTrigger.batch('.m-feat', {
        start: 'top 88%', once: true,
        onEnter: (els) => {
          gsap.from(els, { autoAlpha: 0, y: 18, duration: 0.5, stagger: 0.08, ease: 'power1.out' })
          els.forEach((el, i) => gsap.from(el.querySelectorAll('.m-draw > *'), { drawSVG: '0%', duration: 0.9, delay: 0.15 + i * 0.08, ease: 'power2.inOut' }))
        },
      })

      // antes × depois
      const cmp = gsap.timeline({ scrollTrigger: once('.m-compare', 'top 60%') })
      cmp.fromTo('.m-strike', { scaleX: 0 }, { scaleX: 1, duration: 0.35, stagger: 0.18, ease: 'power2.inOut' }, 0.3)
        .from('.m-after', { autoAlpha: 0, x: -14, duration: 0.45, stagger: 0.1, ease: 'power1.out' }, 0.6)

      gsap.from('.m-quote', { autoAlpha: 0, y: 30, duration: 0.8, ease: 'power1.out', scrollTrigger: once('.m-quote') })
      gsap.from('.m-plans > *', { autoAlpha: 0, y: 30, duration: 0.6, stagger: 0.12, ease: 'power1.out', scrollTrigger: once('.m-plans') })

      // fechamento: agulha costura o sublinhado
      if (ctaPathRef.current && ctaNeedleRef.current) {
        const cta = gsap.timeline({ scrollTrigger: once(ctaSewRef.current, 'top 90%') })
        cta.fromTo(ctaPathRef.current, { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.4, ease: 'power2.inOut' }, 0)
          .fromTo(ctaNeedleRef.current, { autoAlpha: 1 }, { duration: 1.4, ease: 'power2.inOut', motionPath: { path: ctaPathRef.current, align: ctaPathRef.current, alignOrigin: [0.85, 0.5], autoRotate: true } }, 0)
          .to(ctaNeedleRef.current, { autoAlpha: 0, duration: 0.3 }, 1.4)
      }
    }, root)
    return () => ctx.revert()
  }, [introDone, animated])

  /* ── passos: a linha trança entre os números e a agulha acompanha a rolagem ── */
  useEffect(() => {
    const box = stepsRef.current
    const weave = weaveRef.current
    const needle = needleIconRef.current
    if (!box || !weave || !needle || !introDone) return
    const stepEls = Array.from(box.querySelectorAll<HTMLElement>('.m-step'))
    const bubbles = Array.from(box.querySelectorAll<HTMLElement>('.m-bubble'))
    const buildPath = () => {
      const b = box.getBoundingClientRect()
      const x = 24, A = 22
      const ys = bubbles.map((el) => { const r = el.getBoundingClientRect(); return r.top - b.top + r.height / 2 })
      let d = `M${x} 0`, prev = 0, side = 1
      ys.concat([b.height]).forEach((y) => {
        const h = y - prev
        d += `C${x + A * side} ${(prev + h * 0.33).toFixed(1)} ${x + A * side} ${(prev + h * 0.67).toFixed(1)} ${x} ${y.toFixed(1)}`
        prev = y; side = -side
      })
      weave.setAttribute('d', d)
      return ys.map((y) => y / b.height)
    }
    if (!animated) {
      buildPath()
      gsap.set(needle, { autoAlpha: 0 })
      return
    }
    let ctx: gsap.Context | null = null
    const build = () => {
      ctx?.revert()
      const marks = buildPath()
      ctx = gsap.context(() => {
        const tl = gsap.timeline({ defaults: { ease: 'none' } })
        tl.fromTo(weave, { drawSVG: '0%' }, { drawSVG: '100%', duration: 1 }, 0)
          .fromTo(needle, { autoAlpha: 1 }, { duration: 1, motionPath: { path: weave, align: weave, alignOrigin: [0.85, 0.5], autoRotate: true } }, 0)
        gsap.set(stepEls, { autoAlpha: 0, x: 24 })
        marks.forEach((m, i) => {
          tl.to(stepEls[i], { autoAlpha: 1, x: 0, duration: 0.12, ease: 'power2.out' }, Math.max(0, m - 0.08))
            .fromTo(bubbles[i], { scale: 0.4 }, { scale: 1, duration: 0.1, ease: 'back.out(2)' }, m)
        })
        ScrollTrigger.create({ trigger: box, start: 'top 70%', end: 'bottom 55%', scrub: 0.6, animation: tl })
      })
    }
    build()
    let w = window.innerWidth
    const onResize = () => { if (Math.abs(window.innerWidth - w) > 40) { w = window.innerWidth; build() } }
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('resize', onResize); ctx?.revert() }
  }, [introDone, animated, steps])

  return (
    <>
      {announcement && (
        <div style={{
          background: '#2C1810',
          color: '#fff8f0',
          textAlign: 'center',
          padding: '10px 24px',
          fontSize: 13,
          fontWeight: 400,
          lineHeight: 1.5,
          letterSpacing: '0.01em',
          position: 'relative',
          zIndex: 100,
        }}>
          {announcement}
        </div>
      )}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        :root {
          --ink:   #2C1810;
          --cream: #F7F0E6;
          --terra: #C8714A;
          --gold:  #D4A85A;
          --mid:   #6E5E4F;
          --card:  #fff8f0;
          --dark:  #1a110a;
        }

        html { scroll-behavior: smooth; }
        body { font-family: 'DM Sans', sans-serif; margin: 0; overflow-x: hidden; }
        .display { font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 300; letter-spacing: -0.01em; }

        .linen {
          background-color: var(--cream);
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='4' height='4' fill='%23f7f0e6'/%3E%3Crect x='0' y='0' width='1' height='1' fill='%23e8d8c4' opacity='0.4'/%3E%3Crect x='2' y='2' width='1' height='1' fill='%23e8d8c4' opacity='0.4'/%3E%3C/svg%3E");
          color: var(--ink);
        }
        .dark-linen {
          background-color: var(--ink);
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='4' height='4' fill='%232C1810'/%3E%3Crect x='0' y='0' width='1' height='1' fill='%23ffffff' opacity='0.015'/%3E%3Crect x='2' y='2' width='1' height='1' fill='%23ffffff' opacity='0.015'/%3E%3C/svg%3E");
          color: var(--cream);
        }

        .m-root { position: relative; background: var(--ink); color: var(--cream); overflow-x: clip; }
        .m-wrap { max-width: 1240px; margin: 0 auto; padding: 0 clamp(20px, 4vw, 48px); }
        .m-section { padding: clamp(80px, 10vw, 128px) 0; }
        .m-h2 { margin: 0; text-align: center; font-size: clamp(36px, 5vw, 64px); line-height: 1.05; }

        /* ── buttons ── */
        .btn-primary, .btn-ghost {
          display: inline-flex; align-items: center; justify-content: center; gap: 10px;
          min-height: 48px; padding: 0 30px; border-radius: 2px;
          font-family: 'DM Sans', sans-serif; font-weight: 500; font-size: 13px;
          letter-spacing: 0.1em; text-transform: uppercase; text-decoration: none; white-space: nowrap; cursor: pointer;
          transition: background-color .35s cubic-bezier(.4,0,.2,1), transform .35s cubic-bezier(.4,0,.2,1), border-color .35s;
        }
        .btn-primary { background: var(--terra); color: var(--card); border: 1px solid transparent; }
        .btn-primary:hover { background: #B45E37; transform: translateY(-1px); }
        .btn-ghost { background: transparent; color: var(--cream); border: 1px solid rgba(247,240,230,0.32); }
        .btn-ghost:hover { border-color: rgba(212,168,90,0.8); }
        .btn-primary:active, .btn-ghost:active { transform: scale(.98); }
        .btn-primary:focus-visible, .btn-ghost:focus-visible, .m-motion-btn:focus-visible { outline: 2px solid var(--gold); outline-offset: 3px; }

        .tag {
          display: inline-block; padding: 5px 12px; border: 1px solid rgba(212,168,90,.7);
          color: var(--gold); font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase;
        }

        /* ── títulos costurados ── */
        .m-mask { display: block; overflow: hidden; padding-bottom: .1em; }
        .m-mask > span { display: block; }
        [data-seam-reveal] { transition: transform .9s cubic-bezier(.2,.7,.2,1); }
        .seam-armed [data-seam-reveal] { transform: translateY(110%); }
        .seam-armed [data-seam-reveal].is-sewn { transform: none; }

        /* ── herói ── */
        .hero { position: relative; overflow: hidden; }
        .hero-top { display: flex; flex-wrap: wrap; align-items: center; gap: clamp(32px, 5vw, 72px); padding-top: clamp(120px, 12vw, 160px); padding-bottom: 56px; }
        .hero-copy { flex: 1 1 460px; min-width: 0; }
        .hero-machine { flex: 1 1 520px; min-width: 0; position: relative; }
        .hero h1 { margin: 22px 0 0; font-size: clamp(52px, 7.4vw, 104px); line-height: .98; letter-spacing: -0.02em; }

        .m-frame { border-radius: 12px; background: var(--card); box-shadow: 0 40px 80px rgba(0,0,0,.45); overflow: hidden; border: 1px solid rgba(212,168,90,.25); }
        .m-frame-bar { height: 28px; background: var(--dark); display: flex; align-items: center; gap: 6px; padding: 0 12px; }
        .m-frame-bar i { width: 9px; height: 9px; border-radius: 50%; background: rgba(247,240,230,.18); display: block; }
        .m-frame img { display: block; width: 100%; height: auto; }

        .m-phone { position: absolute; right: -24px; bottom: -10px; width: clamp(150px, 22%, 230px); aspect-ratio: 9 / 19.5; border-radius: 46px; padding: 10px; background: #0E0906; box-shadow: inset 0 0 0 1.5px #5A4636, inset 0 0 0 3px #0E0906, 0 40px 80px rgba(0,0,0,.55); }
        .m-screen { position: relative; width: 100%; height: 100%; border-radius: 36px; overflow: hidden; background: #FAFAFA; display: flex; flex-direction: column; }
        .m-status { position: relative; flex: none; height: 30px; background: #fff; display: flex; align-items: center; justify-content: space-between; padding: 2px 18px 0 22px; font: 600 11px -apple-system, 'SF Pro Text', 'DM Sans', sans-serif; color: #111; }
        .m-island { position: absolute; top: 7px; left: 50%; width: 31%; height: 18px; transform: translateX(-50%); border-radius: 10px; background: #0E0906; }
        .m-screen img { flex: none; width: 100%; height: auto; display: block; }
        .m-fade { position: absolute; left: 0; right: 0; bottom: 0; height: 24%; background: linear-gradient(rgba(250,250,250,0), #FAFAFA 70%); pointer-events: none; }
        .m-home { position: absolute; left: 50%; bottom: 7px; width: 36%; height: 4px; border-radius: 3px; background: #111; opacity: .85; transform: translateX(-50%); }
        .m-btn-side { position: absolute; width: 3px; border-radius: 2px; background: #3A2C22; }

        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); gap: 24px; }

        /* ── funcionalidades ── */
        .m-feats { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr)); gap: 0 56px; }
        .m-feat { display: flex; gap: 18px; padding: 26px 0; border-top: 1px dashed rgba(212,168,90,.28); }
        .m-ic { width: 48px; height: 48px; border-radius: 12px; border: 1px solid rgba(212,168,90,.35); display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--gold); }

        /* ── antes × depois ── */
        .m-compare-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 380px), 1fr)); gap: 20px; }
        .m-li { display: flex; gap: 14px; align-items: flex-start; position: relative; }
        .m-strike { position: absolute; left: 30px; top: 10px; height: 1.5px; background: #B3412F; transform-origin: left; width: calc(100% - 30px); }

        /* ── planos ── */
        .m-plans { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr)); gap: 20px; align-items: stretch; }
        .m-plan { border-radius: 20px; padding: clamp(28px, 4vw, 40px); display: flex; flex-direction: column; gap: 6px; position: relative; }
        .m-plan ul { list-style: none; margin: 18px 0 0; padding: 18px 0 0; display: flex; flex-direction: column; gap: 12px; font-size: 14px; }
        .m-plan li { display: flex; gap: 12px; align-items: flex-start; }

        /* ── passos ── */
        .m-steps { position: relative; padding-left: 72px; }
        .m-bubble { position: absolute; left: -72px; top: 18px; width: 48px; height: 48px; border-radius: 50%; background: var(--cream); border: 1.5px solid var(--terra); color: var(--terra); display: inline-flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 500; }
        @media (max-width: 600px) {
          .m-steps { padding-left: 60px; }
          .m-bubble { left: -60px; width: 40px; height: 40px; font-size: 17px; }
        }

        /* ── whatsapp button ── */
        .wa-btn {
          position: fixed; bottom: 28px; right: 28px; z-index: 9999;
          width: 56px; height: 56px; border-radius: 50%;
          background: #25D366; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 20px rgba(37,211,102,0.45);
          transition: transform 0.2s, background 0.2s;
          text-decoration: none;
        }
        .wa-btn:hover { transform: scale(1.1); background: #1ebe5d; }
        .wa-btn svg { width: 28px; height: 28px; fill: #fff; }

        .m-motion-btn { background: none; border: 1px solid rgba(212,168,90,.25); border-radius: 2px; color: rgba(247,240,230,.6); font: inherit; font-size: 12px; letter-spacing: .06em; padding: 8px 14px; min-height: 36px; cursor: pointer; }
        .m-motion-btn:hover { color: var(--cream); border-color: rgba(212,168,90,.6); }

        /* ── celular ── */
        @media (max-width: 768px) {
          .hero-top { padding-top: 110px; }
          .hero-buttons { flex-direction: column; align-items: stretch; }
          .hero-machine { flex-basis: 100%; max-width: 440px; margin: 0 auto; }
          .m-phone { right: -8px; width: 34%; border-radius: 30px; padding: 7px; }
          .m-screen { border-radius: 24px; }
          .m-status { height: 22px; font-size: 9px; padding: 1px 12px 0 14px; }
          .m-island { top: 5px; height: 12px; }
          .wa-btn { bottom: 20px; right: 16px; width: 50px; height: 50px; }
          .wa-btn svg { width: 24px; height: 24px; }
        }

        /* ── celular pequeno ── */
        @media (max-width: 600px) {
          .m-section { padding: 64px 0; }
          .hero-top { gap: 32px; padding-bottom: 40px; }
          .hero h1 { margin-top: 18px; }
          .hero-machine { max-width: 380px; }
          /* no celular mostramos só o celular, maior e centralizado */
          .shot-desk { display: none; }
          .shots-stage { padding-bottom: 8px !important; }
          .m-phone { position: relative; right: auto; bottom: auto; margin: 0 auto; width: min(64%, 250px); border-radius: 40px; padding: 9px; }
          .m-screen { border-radius: 32px; }
          .m-status { height: 28px; font-size: 11px; padding: 2px 16px 0 20px; }
          .m-island { top: 7px; height: 16px; }
          .stats-grid { grid-template-columns: 1fr 1fr; gap: 22px 12px; }
          .hero-stat { padding-left: 14px !important; }
          .hero-stat .display { font-size: 32px !important; }
          .m-steps-needle { display: none; }
          .m-step-card { padding: 20px !important; }
          .m-step-card h3 { font-size: 23px !important; }
          .m-feat { gap: 14px; padding: 22px 0; }
          .m-ic { width: 42px; height: 42px; border-radius: 10px; }
          .m-quote-text { font-size: 19px !important; }
          .m-plan-price { font-size: 46px !important; }
          .m-compare-grid { gap: 14px; }
        }

        @media (prefers-reduced-motion: reduce) {
          html { scroll-behavior: auto; }
          .btn-primary, .btn-ghost, [data-seam-reveal] { transition: none; }
        }
      `}</style>

      {/* ── BANNER PROMOCIONAL ── */}
      {bannerVisible && (
        <div style={{
          background: '#1A110A',
          color: '#F7F0E6',
          textAlign: 'center',
          padding: '10px 20px',
          fontSize: 14,
          fontWeight: 500,
          letterSpacing: '0.01em',
          position: 'relative',
          zIndex: 10,
          borderBottom: '1px solid rgba(212,168,90,.15)',
        }}>
          <span dangerouslySetInnerHTML={{ __html: cms.promo_banner_text ?? '' }} />
          {' '}
          <a href="/promo" style={{ color: '#D4A85A', textDecoration: 'underline', fontWeight: 600 }}>
            Ver oferta →
          </a>
        </div>
      )}

      <IntroCut animated={animated} ready={motion.ready} onOpen={onIntroOpen} onDone={onIntroDone} />

      <div ref={rootRef} className="m-root">
        <SeamThread rootRef={rootRef} getMachineSvg={getMachineSvg} shotsRef={shotsRef} start={introDone} animated={animated} />

        {/* ── MOBILE MENU (Staggered) ── */}
        <StaggeredMenu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          navItems={[
            { href: '#funcionalidades', label: 'Funcionalidades' },
            { href: '#como-funciona',   label: 'Como funciona'   },
            { href: '#planos',          label: 'Planos'          },
          ]}
        />

        {/* ── NAV ── */}
        <NavBar
          scrolled={scrolled}
          onMenuOpen={() => setMenuOpen(o => !o)}
          bannerOffset={bannerVisible ? 41 : 0}
        />

        {/* ── HERO ── */}
        <section ref={heroRef} className="dark-linen hero">
          <div className="m-wrap hero-top">
            <div className="hero-copy">
              <span className="tag hero-tag">Sistema de Gestão para Ateliês</span>
              <EmbroideredTitle className="display" lines={HERO_LINES} play={embPlay} animated={animated} />
              <p className="hero-fade" style={{ margin: '26px 0 0', fontSize: 17, lineHeight: 1.75, color: 'rgba(247,240,230,.78)', maxWidth: 520, whiteSpace: 'pre-line' }}>
                {c.heroSubtitle}
              </p>
              <div className="hero-fade hero-buttons" style={{ display: 'flex', gap: 12, marginTop: 34, flexWrap: 'wrap' }}>
                <Link href="/cadastro" className="btn-primary" onClick={() => track('cta_click', { location: 'hero' })}>
                  Começar grátis <ArrowRight size={14} aria-hidden="true" />
                </Link>
                <a href="#como-funciona" className="btn-ghost">Ver como funciona</a>
              </div>
            </div>
            <div className="hero-machine">
              <SewingMachine ref={machine} animated={animated} onStitch={onStitch} />
            </div>
          </div>

          {/* prints reais do sistema */}
          <div ref={shotsRef} className="m-wrap" style={{ position: 'relative', paddingTop: 8, paddingBottom: 40, perspective: 1600 }}>
            <div className="shots-stage" style={{ position: 'relative', paddingBottom: 60, maxWidth: 980, margin: '0 auto' }}>
              <div className="m-frame shot-desk" style={{ transformOrigin: '50% 100%' }}>
                <div className="m-frame-bar" aria-hidden="true"><i /><i /><i /></div>
                <Image src="/screenshots/landing-os-desktop.webp" alt="Tela real de Ordens de Serviço: total, pendentes, em andamento, concluídas e atrasadas, com busca e lista de ordens" width={1598} height={870} sizes="(max-width: 1040px) 100vw, 980px" />
              </div>
              <div className="m-phone shot-mob">
                <span className="m-btn-side" style={{ left: -3, top: '18%', height: '7%' }} />
                <span className="m-btn-side" style={{ left: -3, top: '28%', height: '12%' }} />
                <span className="m-btn-side" style={{ right: -3, top: '24%', height: '16%' }} />
                <div className="m-screen">
                  <div className="m-status" aria-hidden="true">
                    <span>9:41</span>
                    <span className="m-island" />
                    <svg width="38" height="10" viewBox="0 0 38 10">
                      <rect x="0" y="6" width="2.4" height="4" rx=".6" fill="#111" /><rect x="3.4" y="4.5" width="2.4" height="5.5" rx=".6" fill="#111" /><rect x="6.8" y="3" width="2.4" height="7" rx=".6" fill="#111" /><rect x="10.2" y="1" width="2.4" height="9" rx=".6" fill="#111" />
                      <path d="M15.5 4.2a5.6 5.6 0 0 1 7.6 0M17 5.9a3.4 3.4 0 0 1 4.6 0" stroke="#111" strokeWidth="1.3" fill="none" strokeLinecap="round" /><circle cx="19.3" cy="8" r="1" fill="#111" />
                      <rect x="25.5" y="1.2" width="10.5" height="7.6" rx="2" stroke="#111" strokeOpacity=".45" fill="none" /><rect x="26.8" y="2.5" width="7.9" height="5" rx="1.1" fill="#111" /><rect x="36.6" y="3.7" width="1.2" height="2.6" rx=".5" fill="#111" fillOpacity=".45" />
                    </svg>
                  </div>
                  <Image src="/screenshots/landing-os-mobile.webp" alt="A mesma tela de Ordens de Serviço no celular" width={718} height={1332} sizes="230px" />
                  <span className="m-fade" aria-hidden="true" />
                  <span className="m-home" aria-hidden="true" />
                </div>
              </div>
            </div>
          </div>

          {/* números */}
          <div className="m-wrap" style={{ paddingBottom: 64 }}>
            <svg width="100%" height="6" style={{ display: 'block', marginBottom: 32, overflow: 'visible' }} aria-hidden="true">
              <line ref={goldStitch} x1="0" y1="3" x2="100%" y2="3" stroke="rgba(212,168,90,.7)" strokeWidth="2" strokeDasharray="11 7" strokeLinecap="round" />
            </svg>
            <div className="stats-grid">
              {STATS.map((s) => (
                <div key={s.desc} className="hero-stat" style={{ borderLeft: '1px solid rgba(212,168,90,.22)', paddingLeft: 24 }}>
                  <div className="display" style={{ fontSize: 'clamp(32px,4vw,48px)', color: 'var(--gold)', lineHeight: 1.1 }}>
                    <span className="hero-count" data-to={s.to}>{s.num}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(247,240,230,.66)', marginTop: 6 }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── COMO FUNCIONA ── */}
        <section id="como-funciona" className="linen m-section">
          <div className="m-wrap" style={{ maxWidth: 980 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: 'var(--gold)' }} aria-hidden="true">
              <span style={{ flex: 1, borderTop: '1px dashed rgba(180,130,60,.5)' }} />
              <Scissors size={18} />
              <span style={{ flex: 1, borderTop: '1px dashed rgba(180,130,60,.5)' }} />
            </div>
            <SewnTitle
              className="m-h2"
              style={{ margin: '18px 0 64px', color: 'var(--ink)' }}
              lines={['Três passos para organizar', <em key="e" style={{ color: 'var(--terra)' }}>tudo que importa</em>]}
            />
            <div ref={stepsRef} className="m-steps">
              <svg style={{ position: 'absolute', left: 23, top: 0, height: '100%', width: 4, overflow: 'visible' }} aria-hidden="true">
                <line x1="1" y1="0" x2="1" y2="100%" stroke="rgba(180,130,60,.3)" strokeWidth="2" strokeDasharray="8 7" />
              </svg>
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }} aria-hidden="true">
                <path ref={weaveRef} d="M24 0V10" fill="none" stroke="var(--terra)" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <svg ref={needleIconRef} className="m-steps-needle" width="44" height="12" viewBox="0 0 44 12" style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none', zIndex: 2, opacity: 0 }} aria-hidden="true">
                <path d={NEEDLE_PATH} fill="#8A7A6A" stroke="#2C1810" strokeWidth=".8" />
                <ellipse cx="8" cy="6" rx="3" ry="1" fill="#F7F0E6" />
              </svg>
              <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 28 }}>
                {steps.map((s) => (
                  <li key={s.n} className="m-step" style={{ position: 'relative' }}>
                    <span className="m-bubble display">{s.n}</span>
                    <div className="m-step-card" style={{ background: 'var(--card)', border: '1px solid rgba(212,168,90,.3)', borderRadius: 16, padding: '26px 28px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                        <h3 className="display" style={{ margin: 0, fontSize: 26, fontWeight: 500, color: 'var(--ink)' }}>{s.title}</h3>
                        {s.detail && <span style={{ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: '#8A4B2C', border: '1px solid rgba(200,113,74,.45)', padding: '4px 10px' }}>{s.detail}</span>}
                      </div>
                      <p style={{ margin: '12px 0 0', fontSize: 15, lineHeight: 1.75, color: 'var(--mid)' }}>{s.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* ── FUNCIONALIDADES ── */}
        <section id="funcionalidades" className="dark-linen m-section">
          <div className="m-wrap">
            <div style={{ textAlign: 'center' }}><span className="tag">Funcionalidades</span></div>
            <SewnTitle
              className="m-h2"
              style={{ margin: '20px 0 56px' }}
              lines={['Tudo que seu ateliê precisa,', <em key="e" style={{ color: 'var(--gold)' }}>nada que não precisa.</em>]}
            />
            <div className="m-feats">
              {FEATURES.map(({ Icon, title, desc }) => (
                <div key={title} className="m-feat">
                  <span className="m-ic"><Icon className="m-draw" size={24} strokeWidth={1.6} aria-hidden="true" /></span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 19, fontWeight: 500, color: 'var(--cream)' }}>{title}</h3>
                    <p style={{ margin: '8px 0 0', fontSize: 15, lineHeight: 1.7, color: 'rgba(247,240,230,.68)' }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── ANTES × DEPOIS ── */}
        <section className="linen m-section m-compare">
          <div className="m-wrap" style={{ maxWidth: 1120 }}>
            <SewnTitle
              className="m-h2"
              style={{ margin: '0 0 56px', color: 'var(--ink)' }}
              lines={[<>Antes <span style={{ color: 'rgba(44,24,16,.25)' }}>×</span> Depois</>]}
            />
            <div className="m-compare-grid">
              <div style={{ background: 'var(--card)', padding: 'clamp(28px,4vw,40px)', border: '1px solid rgba(212,168,90,.25)' }}>
                <p style={{ margin: '0 0 22px', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: '#A33A2A', fontWeight: 600 }}>Sem sistema</p>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {BEFORE.map(([t, d]) => (
                    <li key={t} className="m-li">
                      <X size={16} strokeWidth={2.2} style={{ color: '#A33A2A', flexShrink: 0, marginTop: 3 }} aria-hidden="true" />
                      <div>
                        <p style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 500, color: 'var(--ink)' }}>{t}</p>
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--mid)' }}>{d}</p>
                      </div>
                      <span className="m-strike" aria-hidden="true" />
                    </li>
                  ))}
                </ul>
              </div>
              <div className="dark-linen" style={{ padding: 'clamp(28px,4vw,40px)' }}>
                <p style={{ margin: '0 0 22px', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: '#E39B78', fontWeight: 600 }}>Com Meu Atelier Sistema</p>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {AFTER.map(([t, d]) => (
                    <li key={t} className="m-li m-after">
                      <Check size={16} strokeWidth={2.2} style={{ color: '#E39B78', flexShrink: 0, marginTop: 3 }} aria-hidden="true" />
                      <div>
                        <p style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 500 }}>{t}</p>
                        <p style={{ margin: 0, fontSize: 13, color: 'rgba(247,240,230,.66)' }}>{d}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── DEPOIMENTO NETE FASHION ── */}
        <section className="linen" style={{ padding: '0 0 clamp(80px,10vw,128px)' }}>
          <div className="m-wrap" style={{ maxWidth: 1000 }}>
            <SewnTitle
              className="m-h2"
              style={{ margin: '0 0 40px', fontSize: 'clamp(32px,4vw,52px)', color: 'var(--ink)' }}
              lines={[<>O que dizem nossas <em style={{ color: 'var(--terra)' }}>clientes</em></>]}
            />
            <figure className="m-quote" style={{ margin: 0, background: 'var(--card)', border: '1px solid rgba(212,168,90,.25)', padding: 'clamp(28px,4vw,48px)' }}>
              <div style={{ display: 'flex', gap: 4, color: 'var(--terra)' }} role="img" aria-label="5 de 5 estrelas">
                {[0, 1, 2, 3, 4].map((i) => (
                  <svg key={i} width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                ))}
              </div>
              <blockquote className="display m-quote-text" style={{ margin: '22px 0 28px', fontSize: 'clamp(22px,2.4vw,28px)', lineHeight: 1.5, fontStyle: 'italic', color: 'var(--ink)', fontWeight: 400 }}>
                &ldquo;Antes eu controlava tudo em caderno e muitas vezes esquecia de cobrar ou perdia o prazo de entrega. Com o sistema, tenho tudo organizado — clientes, pedidos, datas e valores. Agora consigo ver de cara o que está em aberto e o que já foi entregue. E a facilidade de enviar a ordem de serviço para o cliente, ele saber exatamente o que vai ser feito e acompanhar, faz toda a diferença. Não imagino trabalhar sem ele.&rdquo;
              </blockquote>
              <figcaption style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Image src="/nete-fashion.jpg" alt="NETE Fashion Atelier" width={56} height={56} style={{ borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(212,168,90,.4)' }} />
                <span>
                  <strong style={{ display: 'block', fontSize: 15, color: 'var(--ink)' }}>NETE Fashion Atelier</strong>
                  <span style={{ fontSize: 13, color: '#8A4B2C' }}>@netefashiion · Vila Velha, ES</span>
                </span>
              </figcaption>
            </figure>
          </div>
        </section>

        {/* ── DEPOIMENTOS (CMS) ── */}
        {testimonials.length > 0 && (
          <section className="linen" style={{ padding: '0 0 clamp(80px,10vw,128px)' }}>
            <div className="m-wrap" style={{ maxWidth: 1100 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 24 }}>
                {testimonials.map((t, i) => (
                  <figure key={i} style={{ margin: 0, background: 'var(--card)', padding: '32px 28px', border: '1px solid rgba(212,168,90,0.15)' }}>
                    <blockquote style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--mid)', margin: '0 0 24px', fontStyle: 'italic' }}>&ldquo;{t.text}&rdquo;</blockquote>
                    <figcaption>
                      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)', margin: '0 0 2px' }}>{t.name}</p>
                      <p style={{ fontSize: 12, color: '#8A4B2C', margin: 0 }}>{t.role}</p>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── FAQ (CMS) ── */}
        {faq.length > 0 && (
          <section className="dark-linen m-section">
            <div className="m-wrap" style={{ maxWidth: 820 }}>
              <SewnTitle
                className="m-h2"
                style={{ margin: '0 0 56px', fontSize: 'clamp(28px,4vw,52px)' }}
                lines={[<>Perguntas <em style={{ color: 'var(--gold)' }}>frequentes</em></>]}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'rgba(212,168,90,0.1)' }}>
                {faq.map((f, i) => (
                  <div key={i} style={{ background: 'var(--ink)', padding: '28px 32px' }}>
                    <p style={{ fontSize: 16, fontWeight: 500, color: 'var(--cream)', margin: '0 0 10px' }}>{f.question}</p>
                    <p style={{ fontSize: 14, lineHeight: 1.75, color: 'rgba(247,240,230,0.68)', margin: 0 }}>{f.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── PLANOS ── */}
        <section id="planos" className="dark-linen m-section">
          <div className="m-wrap" style={{ maxWidth: plans.length > 2 ? 1200 : 960 }}>
            <div style={{ textAlign: 'center' }}><span className="tag">Preços</span></div>
            <SewnTitle
              className="m-h2"
              style={{ margin: '20px 0 12px' }}
              lines={['Comece grátis.', <em key="e" style={{ color: 'var(--gold)' }}>Cresça no seu ritmo.</em>]}
            />
            <p style={{ margin: '0 0 52px', textAlign: 'center', color: 'rgba(247,240,230,.68)', fontSize: 15 }}>Sem cartão de crédito para começar.</p>
            <div className="m-plans">
              {plans.map((plan) => {
                const featured = plan.is_featured
                const mid = featured ? 'var(--mid)' : 'rgba(247,240,230,.6)'
                const whole = plan.price === 0 ? '0' : String(Math.floor(plan.price))
                const cents = plan.price === 0 ? null : Math.round((plan.price - Math.floor(plan.price)) * 100).toString().padStart(2, '0')
                return (
                  <article
                    key={plan.id}
                    className="m-plan"
                    style={featured
                      ? { background: 'var(--card)', color: 'var(--ink)', border: '1px solid rgba(200,113,74,.4)' }
                      : { background: 'rgba(247,240,230,.04)', border: '1px solid rgba(212,168,90,.2)' }}
                  >
                    {featured && <span aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--terra)', borderRadius: '20px 20px 0 0' }} />}
                    {plan.badge && (
                      <span style={{ position: 'absolute', top: 0, right: 24, background: 'var(--terra)', color: 'var(--card)', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: '0 0 8px 8px' }}>{plan.badge}</span>
                    )}
                    <p className="display" style={{ margin: 0, fontSize: 28 }}>{plan.name}</p>
                    <p style={{ margin: '10px 0 0' }}>
                      <span className="display m-plan-price" style={{ fontSize: 56, lineHeight: 1 }}>R$ {whole}</span>
                      <span style={{ fontSize: 14, color: mid }}>{cents ? `,${cents} /mês` : ' /mês'}</span>
                    </p>
                    <p style={{ margin: '4px 0 22px', fontSize: 13, color: mid, minHeight: 20 }}>{plan.annual_note || plan.description || ' '}</p>
                    <Link
                      href={plan.cta_url}
                      className={featured ? 'btn-primary' : 'btn-ghost'}
                      onClick={() => track('cta_click', { location: 'plans', plan: plan.slug })}
                    >
                      {plan.cta_text} {featured && <ArrowRight size={14} aria-hidden="true" />}
                    </Link>
                    <ul style={{ borderTop: `1px dashed ${featured ? 'rgba(200,113,74,.3)' : 'rgba(212,168,90,.25)'}` }}>
                      {plan.features.map((f, fi) => (
                        <li key={fi}>
                          {f.included
                            ? <Check size={14} strokeWidth={2.4} style={{ color: featured ? 'var(--terra)' : 'var(--gold)', flexShrink: 0, marginTop: 3 }} aria-hidden="true" />
                            : <X size={14} style={{ color: 'rgba(247,240,230,0.3)', flexShrink: 0, marginTop: 3 }} aria-label="Não incluso" />}
                          <span style={{ color: f.included ? (featured ? 'var(--mid)' : 'rgba(247,240,230,.78)') : 'rgba(247,240,230,.4)' }}>{f.text}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── CTA FINAL ── */}
        <section className="dark-linen" style={{ padding: 'clamp(80px,10vw,140px) 0', textAlign: 'center', borderTop: '1px solid rgba(212,168,90,.1)' }}>
          <div className="m-wrap">
            <span className="tag">Comece agora</span>
            <SewnTitle
              className="m-h2"
              style={{ margin: '24px 0', fontSize: 'clamp(44px,6vw,84px)', lineHeight: 1, letterSpacing: '-0.02em' }}
              lines={['O ateliê que você', 'sempre quis ter.']}
            />
            <div ref={ctaSewRef} style={{ position: 'relative', width: 'min(520px, 80%)', height: 24, margin: '-8px auto 28px' }}>
              <svg viewBox="0 0 520 24" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }} aria-hidden="true">
                <path ref={ctaPathRef} d="M0 12C70 2 130 22 200 12S330 2 400 12 480 18 520 12" fill="none" stroke="var(--terra)" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
              <svg ref={ctaNeedleRef} width="44" height="12" viewBox="0 0 44 12" style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: 0 }} aria-hidden="true">
                <path d={NEEDLE_PATH} fill="#D4A85A" />
                <ellipse cx="8" cy="6" rx="3" ry="1" fill="#2C1810" />
              </svg>
            </div>
            <p style={{ margin: '0 auto 40px', maxWidth: 380, fontSize: 16, color: 'rgba(247,240,230,.68)' }}>
              Plano gratuito para sempre. Sem surpresas.
            </p>
            <Link href="/cadastro" className="btn-primary" style={{ minHeight: 56, padding: '0 44px', fontSize: 14 }}
              onClick={() => track('cta_click', { location: 'bottom_cta' })}
            >
              Começar grátis <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ background: '#100a05', padding: '44px 20px', borderTop: '1px solid rgba(212,168,90,0.1)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, fontSize: 12, letterSpacing: '0.06em' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(247,240,230,.7)' }}>
              <Image src="/logo-icon.svg" alt="" width={28} height={28} style={{ borderRadius: 6 }} />
              <span className="display" style={{ fontSize: 17, letterSpacing: 0 }}>{c.footerTagline}</span>
            </div>

            <nav aria-label="Rodapé" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px 28px' }}>
              <Link href="/login" style={{ color: 'rgba(212,168,90,.85)', textDecoration: 'none' }}>Entrar</Link>
              <Link href="/cadastro" style={{ color: 'rgba(212,168,90,.85)', textDecoration: 'none' }}>Começar grátis</Link>
              <a href="mailto:eduallochio2@outlook.com" style={{ color: 'rgba(247,240,230,.6)', textDecoration: 'none' }}>Suporte</a>
              <a href="https://instagram.com/eduallochio" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(247,240,230,.6)', textDecoration: 'none' }}>@eduallochio</a>
            </nav>

            <nav aria-label="Legal" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px 24px' }}>
              {[
                { href: '/privacidade', label: 'Privacidade' },
                { href: '/termos', label: 'Termos' },
                { href: '/lgpd', label: 'LGPD' },
              ].map(l => (
                <Link key={l.href} href={l.href} style={{ color: 'rgba(247,240,230,.6)', textDecoration: 'none' }}>{l.label}</Link>
              ))}
              <button
                type="button"
                onClick={() => { localStorage.removeItem('cookie-consent'); localStorage.removeItem('cookie-consent-date'); window.location.reload() }}
                style={{ color: 'rgba(247,240,230,.6)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit', letterSpacing: 'inherit' }}
              >
                Cookies
              </button>
            </nav>

            {!motion.systemReduced && motion.ready && (
              <button type="button" className="m-motion-btn" aria-pressed={!motion.enabled} onClick={motion.toggle}>
                {motion.enabled ? 'Pausar animações' : 'Retomar animações'}
              </button>
            )}

            <p style={{ margin: 0, color: 'rgba(247,240,230,.5)' }}>
              © {new Date().getFullYear()} Meu Atelier Sistema · Desenvolvido por Eduardo Allochio
            </p>
          </div>
        </footer>
      </div>

      {/* ── BOTÃO WHATSAPP FLUTUANTE ── */}
      {c.whatsappPhone && (
        <a
          href={`https://wa.me/${c.whatsappPhone}?text=${encodeURIComponent('Olá! Tenho interesse no Meu Atelier Sistema.')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="wa-btn"
          title="Fale conosco no WhatsApp"
          aria-label="Fale conosco no WhatsApp"
          onClick={() => track('whatsapp_float_click')}
        >
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>
      )}
    </>
  )
}
