'use client'

import Link from 'next/link'
import {
  Check, X, FileText, Wallet, Users, Scissors,
  BarChart3, ArrowRight, TrendingUp,
  Search, Bell, Shield,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import ScrollStack, { ScrollStackItem } from '@/components/landing/scroll-stack'
import SpotlightCard from '@/components/landing/spotlight-card'
import GlareHover from '@/components/landing/glare-hover'
import Aurora from '@/components/landing/aurora'
import BlurText from '@/components/landing/blur-text'
import ShinyText from '@/components/landing/shiny-text'
import StaggeredMenu from '@/components/landing/staggered-menu'
import CardSwap from '@/components/landing/card-swap'
import NavBar from '@/components/landing/nav-bar'
import type { PublicPlan } from '@/app/api/plans/route'

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
}

/* ─── helpers ──────────────────────────────────────────────────────────── */
function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, inView } = useInView()
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.8s ease ${delay}ms, transform 0.8s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

/* ─── Planos padrão (fallback se API falhar) ─────────────────────────────── */
const DEFAULT_PLANS: PublicPlan[] = [
  {
    id: 'free',
    slug: 'free',
    name: 'Grátis',
    description: 'Para começar sem compromisso',
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
      { text: 'Até 100 ordens de serviço', included: true },
      { text: 'Até 20 serviços cadastrados', included: true },
      { text: 'Controle financeiro básico', included: true },
      { text: 'Relatórios avançados', included: false },
      { text: 'Usuários adicionais', included: false },
      { text: 'Suporte prioritário', included: false },
    ],
  },
  {
    id: 'enterprise',
    slug: 'enterprise',
    name: 'Enterprise',
    description: 'Para ateliês em crescimento',
    price: 49.9,
    price_annual: null,
    annual_note: 'Ou R$ 479/ano — 2 meses grátis',
    badge: 'Mais popular',
    is_featured: true,
    cta_text: 'Começar agora',
    cta_url: '/cadastro',
    sort_order: 2,
    features: [
      { text: 'Clientes ilimitados', included: true },
      { text: 'Ordens de serviço ilimitadas', included: true },
      { text: 'Serviços ilimitados', included: true },
      { text: 'Controle financeiro completo', included: true },
      { text: 'Relatórios avançados', included: true },
      { text: 'Múltiplos usuários', included: true },
      { text: 'Suporte prioritário', included: true },
    ],
  },
]

/* ─── Page ──────────────────────────────────────────────────────────────── */
export default function HomePage() {
  const [scrolled, setScrolled]   = useState(false)
  const [menuOpen, setMenuOpen]   = useState(false)
  const [plans, setPlans]         = useState<PublicPlan[]>(DEFAULT_PLANS)
  const [cms, setCms]             = useState<LandingContent>({})

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    fetch('/api/plans').then((r) => r.ok ? r.json() : Promise.reject()).then((data) => { if (Array.isArray(data) && data.length > 0) setPlans(data) }).catch(() => {})
    fetch('/api/landing').then((r) => r.json()).then(setCms).catch(() => {})
  }, [])

  // CMS helpers with fallback
  const c = {
    heroTitle:    cms.hero_title    || 'Gerencie seu ateliê com eficiência',
    heroSubtitle: cms.hero_subtitle || 'Gerencie clientes, ordens de serviço e finanças em um único lugar.\nFeito especialmente para costureiras e proprietárias de ateliê.',
    ctaPrimary:   cms.hero_cta_primary   || 'Criar conta grátis',
    ctaSecondary: cms.hero_cta_secondary || 'Ver como funciona',
    statsOrgs:    cms.stats_orgs    || '500+',
    statsClients: cms.stats_clients || '10.000+',
    statsOrders:  cms.stats_orders  || '50.000+',
    footerTagline: cms.footer_tagline || 'Meu Atelier',
  }

  // fecha menu ao clicar fora
  useEffect(() => {
    if (!menuOpen) return
    const fn = () => setMenuOpen(false)
    document.addEventListener('click', fn)
    return () => document.removeEventListener('click', fn)
  }, [menuOpen])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        :root {
          --ink:   #2C1810;
          --cream: #F7F0E6;
          --terra: #C8714A;
          --gold:  #D4A85A;
          --mid:   #7a6a5a;
          --card:  #fff8f0;
          --dark:  #1a110a;
        }

        html { scroll-behavior: smooth; }
        body { font-family: 'DM Sans', sans-serif; margin: 0; overflow-x: hidden; }
        .display { font-family: 'Cormorant Garamond', Georgia, serif; }

        .linen {
          background-color: var(--cream);
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='4' height='4' fill='%23f7f0e6'/%3E%3Crect x='0' y='0' width='1' height='1' fill='%23e8d8c4' opacity='0.4'/%3E%3Crect x='2' y='2' width='1' height='1' fill='%23e8d8c4' opacity='0.4'/%3E%3C/svg%3E");
        }
        .dark-linen {
          background-color: var(--ink);
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='4' height='4' fill='%232C1810'/%3E%3Crect x='0' y='0' width='1' height='1' fill='%23ffffff' opacity='0.015'/%3E%3Crect x='2' y='2' width='1' height='1' fill='%23ffffff' opacity='0.015'/%3E%3C/svg%3E");
        }

        .gold-line { background: linear-gradient(90deg, transparent, var(--gold), transparent); height: 1px; }

        /* ── buttons ── */
        .btn-primary {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          padding: 14px 32px; border-radius: 2px;
          background: var(--terra); color: var(--cream);
          font-family: 'DM Sans', sans-serif; font-weight: 500; font-size: 14px;
          letter-spacing: 0.08em; text-transform: uppercase;
          transition: background 0.2s, transform 0.2s;
          border: none; cursor: pointer; text-decoration: none; white-space: nowrap;
        }
        .btn-primary:hover { background: #b85f38; transform: translateY(-1px); }
        .btn-ghost {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          padding: 13px 32px; border-radius: 2px;
          background: transparent; color: var(--cream);
          font-family: 'DM Sans', sans-serif; font-weight: 400; font-size: 14px;
          letter-spacing: 0.08em; text-transform: uppercase;
          transition: background 0.2s;
          border: 1px solid rgba(247,240,230,0.3); cursor: pointer; text-decoration: none; white-space: nowrap;
        }
        .btn-ghost:hover { background: rgba(247,240,230,0.08); }

        /* ── tags / labels ── */
        .tag {
          display: inline-block;
          padding: 4px 12px; border: 1px solid var(--gold);
          color: var(--gold); font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase;
          font-family: 'DM Sans', sans-serif;
        }
        .nav-link {
          color: rgba(247,240,230,0.6); font-size: 13px; letter-spacing: 0.06em;
          text-transform: uppercase; text-decoration: none; transition: color 0.2s;
        }
        .nav-link:hover { color: var(--cream); }

        /* ── cards ── */
        .feature-card {
          padding: 36px 28px;
          border: 1px solid rgba(212,168,90,0.2);
          transition: border-color 0.3s, transform 0.3s;
          height: 100%;
        }
        .feature-card:hover { border-color: rgba(212,168,90,0.6); transform: translateY(-4px); }

        .step-num {
          font-family: 'Cormorant Garamond', serif;
          font-size: 80px; line-height: 1; font-weight: 300;
          color: rgba(212,168,90,0.18); position: absolute; top: -20px; left: -8px;
          user-select: none;
        }

        /* ── animations ── */
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-anim-1 { animation: fade-in-up 0.9s ease 0.1s both; }
        .hero-anim-2 { animation: fade-in-up 0.9s ease 0.3s both; }
        .hero-anim-3 { animation: fade-in-up 0.9s ease 0.5s both; }
        .hero-anim-4 { animation: fade-in-up 0.9s ease 0.7s both; }
        .hero-anim-5 { animation: fade-in-up 0.9s ease 0.9s both; }

        @keyframes slow-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .float { animation: slow-float 6s ease-in-out infinite; }

        /* ── scissor divider ── */
        .scissor-divider {
          display: flex; align-items: center; gap: 16px;
          max-width: 400px; margin: 0 auto;
        }


        /* ── LAYOUT CLASSES ── */

        /* nav */
        .nav-links-desktop { display: flex; gap: 32px; align-items: center; }
        .nav-hamburger { display: none; background: none; border: none; cursor: pointer; color: var(--cream); padding: 4px; }

        /* hero grid */
        .hero-grid {
          display: grid;
          grid-template-columns: 1fr 1.55fr;
          gap: 48px;
          align-items: center;
        }
        /* o col do card swap precisa de overflow visível para os cards atrás aparecerem */
        .hero-mockup-col { display: block; overflow: visible; }

        /* stats */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0;
        }

        /* steps */
        .steps-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: rgba(212,168,90,0.2);
        }

        /* timeline (como funciona) */
        .timeline-wrapper { position: relative; display: flex; flex-direction: column; }
        .timeline-line {
          position: absolute; left: 35px; top: 52px; bottom: 52px; width: 1px;
          background: linear-gradient(to bottom, var(--terra), var(--gold), rgba(200,113,74,0.1));
        }
        .timeline-item { display: flex; align-items: flex-start; gap: 28px; padding: 16px 0; }
        .timeline-bubble {
          flex-shrink: 0; width: 70px; height: 70px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 600; letter-spacing: 0.05em;
          position: relative; z-index: 1; transition: all 0.3s;
        }
        .timeline-bubble-active {
          background: var(--terra); border: 2px solid var(--terra);
          color: var(--cream); box-shadow: 0 4px 20px rgba(200,113,74,0.35);
        }
        .timeline-bubble-default {
          background: var(--card); border: 2px solid rgba(200,113,74,0.3); color: var(--terra);
        }
        .timeline-card {
          flex: 1; background: var(--card); border: 1px solid rgba(200,113,74,0.12);
          border-radius: 20px; padding: 32px 36px; margin-bottom: 20px;
        }
        .timeline-card:last-child { margin-bottom: 0; }
        .timeline-card-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 16px; gap: 12px;
        }
        .timeline-card-title-row { display: flex; align-items: center; gap: 10px; }
        .timeline-badge {
          font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--terra); background: rgba(200,113,74,0.08);
          padding: 4px 10px; border-radius: 20px; white-space: nowrap; flex-shrink: 0;
        }

        @media (max-width: 768px) {
          .timeline-line { left: 24px; top: 40px; bottom: 40px; }
          .timeline-item { gap: 16px; padding: 12px 0; }
          .timeline-bubble { width: 48px; height: 48px; font-size: 11px; }
          .timeline-card { padding: 20px 18px; border-radius: 14px; margin-bottom: 12px; }
          .timeline-card-header { flex-direction: column; align-items: flex-start; gap: 8px; }
          .timeline-badge { align-self: flex-start; }
        }

        /* features */
        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: rgba(212,168,90,0.1);
        }

        /* comparison */
        .comparison-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1px;
          background: rgba(44,24,16,0.1);
        }

        /* plans */
        .plans-grid {
          display: grid;
          grid-template-columns: repeat(var(--plans-cols, 2), 1fr);
          gap: 20px;
        }
        .plan-card { padding: 44px 40px; }
        @media (max-width: 768px) {
          .plans-grid { --plans-cols: 1 !important; gap: 16px; }
          .plan-card { padding: 32px 24px !important; }
        }

        /* hero buttons */
        .hero-buttons { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }

        /* trust row */
        .trust-row { display: flex; gap: 32px; align-items: center; flex-wrap: wrap; }

        /* footer */
        .footer-inner {
          max-width: 1280px; margin: 0 auto;
          display: flex; justify-content: space-between; align-items: center;
          gap: 24px;
        }
        .footer-links { display: flex; gap: 32px; }

        /* section padding */
        .section-pad { padding: 100px 40px; }
        .section-pad-sm { padding: 80px 40px; }
        .hero-pad { padding-top: 140px; padding-bottom: 80px; padding-left: 40px; padding-right: 40px; }

        /* ── TABLET (≤ 1024px) ── */
        @media (max-width: 1024px) {
          .hero-grid { grid-template-columns: 1fr; gap: 48px; }
          .hero-mockup-col { max-width: 540px; margin: 0 auto; width: 100%; height: 380px !important; }
          .steps-grid { grid-template-columns: 1fr; }
          .features-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .hero-mockup-col { height: 300px !important; }
        }
        @media (max-width: 480px) {
          .hero-mockup-col { height: 240px !important; }
        }

        /* ── MOBILE (≤ 768px) ── */
        @media (max-width: 768px) {
          /* nav */
          .nav-links-desktop { display: none; }
          .nav-hamburger { display: flex; align-items: center; }

          /* hero */
          .hero-pad { padding-top: 110px; padding-bottom: 60px; padding-left: 20px; padding-right: 20px; }
          .hero-grid { gap: 40px; }
          .hero-buttons { flex-direction: column; align-items: stretch; }
          .hero-buttons .btn-primary,
          .hero-buttons .btn-ghost { text-align: center; }
          .trust-row { gap: 16px; }

          /* stats: 2x2 */
          .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 1px; background: rgba(212,168,90,0.15); }
          .stats-grid > div { padding: 20px 16px !important; border-left: none !important; }
          .stats-grid > div:nth-child(even) { border-left: 1px solid rgba(212,168,90,0.15) !important; }

          /* steps & features: single col */
          .steps-grid { gap: 1px; }
          .features-grid { grid-template-columns: 1fr; }

          /* comparison: single col */
          .comparison-grid { grid-template-columns: 1fr; }

          /* section padding */
          .section-pad { padding: 64px 20px; }
          .section-pad-sm { padding: 56px 20px; }

          /* footer */
          .footer-inner { flex-direction: column; align-items: center; text-align: center; gap: 16px; }
          .footer-links { gap: 20px; }

          /* nav bar padding */
          .nav-bar { padding: 16px 20px !important; }

          .comparison-card { padding: 28px 20px !important; }
        }

        /* ── SMALL MOBILE (≤ 400px) ── */
        @media (max-width: 400px) {
          .trust-row { flex-direction: column; align-items: flex-start; gap: 10px; }
          .footer-links { flex-wrap: wrap; justify-content: center; gap: 16px; }
        }
      `}</style>

      <div style={{ background: 'var(--ink)' }}>

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
        />

        {/* ── HERO ── */}
        <section className="dark-linen hero-pad" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>

          {/* Aurora background */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.55 }}>
            <Aurora
              colorStops={['#1a0a04', '#C8714A', '#3a1a08']}
              amplitude={1.2}
              blend={0.5}
              speed={0.6}
            />
          </div>

          <div style={{ maxWidth: 1280, margin: '0 auto', width: '100%', position: 'relative', zIndex: 1 }}>

            <div className="hero-anim-1" style={{ marginBottom: 16 }}>
              <span className="tag">
                <ShinyText
                  text="Sistema de Gestão para Ateliês"
                  color="rgba(212,168,90,0.7)"
                  shineColor="rgba(212,168,90,1)"
                  speed={4}
                  spread={90}
                />
              </span>
            </div>

            <div className="hero-anim-2" style={{ marginBottom: 16 }}>
              <h1 className="display" style={{
                fontSize: 'clamp(48px, 9vw, 112px)',
                fontWeight: 300, lineHeight: 1.0,
                color: 'var(--cream)',
                letterSpacing: '-0.02em',
                margin: 0,
              }}>
                <BlurText
                  text="Seu ateliê,"
                  as="span"
                  delay={60}
                  direction="bottom"
                  stepDuration={0.35}
                  style={{ display: 'block', color: 'var(--cream)' }}
                />
                <BlurText
                  text="organizado"
                  as="span"
                  delay={55}
                  direction="bottom"
                  stepDuration={0.38}
                  style={{ display: 'block', color: 'var(--terra)', fontStyle: 'italic' }}
                />
                <BlurText
                  text="como merece."
                  as="span"
                  delay={60}
                  direction="bottom"
                  stepDuration={0.35}
                  style={{ display: 'block', color: 'var(--cream)' }}
                />
              </h1>
            </div>

            <p className="hero-anim-3" style={{ fontSize: 16, lineHeight: 1.75, color: 'rgba(247,240,230,0.65)', maxWidth: 520, marginBottom: 40 }}>
              {c.heroSubtitle}
            </p>

            <div className="hero-grid">
              {/* espaço vazio para manter o grid 2 colunas */}
              <div />

              {/* card swap */}
              <div className="hero-anim-3 hero-mockup-col" style={{ position: 'relative', height: 120 }}>
                <CardSwap
                  width={580}
                  height={460}
                  cardDistance={60}
                  verticalDistance={70}
                  delay={4000}
                  pauseOnHover
                  skewAmount={6}
                  easing="elastic"
                />
              </div>
            </div>

            {/* stats strip */}
            <div style={{ marginTop: 0 }}>
              <div className="gold-line" style={{ marginBottom: 32 }} />
              <div className="stats-grid">
                {[
                  { num: '5h', desc: 'economizadas por semana' },
                  { num: '95%', desc: 'menos erros no caixa' },
                  { num: c.statsOrgs, desc: 'ateliês cadastrados' },
                  { num: 'R$ 0', desc: 'para começar hoje' },
                ].map((s, i) => (
                  <div key={i} style={{
                    paddingLeft: i === 0 ? 0 : 32,
                    paddingRight: 32,
                    borderLeft: i > 0 ? '1px solid rgba(212,168,90,0.2)' : 'none',
                  }}>
                    <div className="display" style={{ fontSize: 'clamp(32px,5vw,48px)', fontWeight: 300, color: 'var(--gold)', lineHeight: 1.1 }}>{s.num}</div>
                    <div style={{ fontSize: 13, color: 'rgba(247,240,230,0.5)', marginTop: 6, letterSpacing: '0.02em' }}>{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── COMO FUNCIONA ── */}
        <section id="como-funciona" className="linen section-pad">
          <div style={{ maxWidth: 900, margin: '0 auto' }}>

            <Reveal>
              <div className="scissor-divider" style={{ marginBottom: 16 }}>
                <div className="gold-line" style={{ flex: 1 }} />
                <Scissors size={16} style={{ color: 'var(--gold)' }} />
                <div className="gold-line" style={{ flex: 1 }} />
              </div>
              <h2 className="display" style={{ fontSize: 'clamp(32px,5vw,64px)', fontWeight: 300, color: 'var(--ink)', textAlign: 'center', marginBottom: 72, letterSpacing: '-0.01em' }}>
                Três passos para organizar<br />
                <em style={{ color: 'var(--terra)' }}>tudo que importa</em>
              </h2>
            </Reveal>

            {/* Timeline vertical */}
            <div className="timeline-wrapper">
              <div className="timeline-line" />

              {(() => {
                let cmsSteps: { step: number; title: string; description: string }[] = []
                try { cmsSteps = cms.how_it_works_json ? JSON.parse(cms.how_it_works_json) : [] } catch { /* */ }

                const defaultSteps = [
                  { n: '01', title: 'Crie sua conta', desc: 'Cadastro em menos de 2 minutos. Sem cartão de crédito. Configure o nome do seu ateliê e comece imediatamente.', icon: <Users size={20} />, detail: 'Grátis para começar' },
                  { n: '02', title: 'Cadastre seus dados', desc: 'Adicione clientes, serviços e preços. O sistema se adapta ao seu jeito de trabalhar, não o contrário.', icon: <Scissors size={20} />, detail: 'Importação facilitada' },
                  { n: '03', title: 'Gerencie com clareza', desc: 'Ordens de serviço, caixa, relatórios — tudo em uma tela. De qualquer dispositivo, a qualquer hora.', icon: <BarChart3 size={20} />, detail: 'Acesso em qualquer lugar' },
                ]

                const steps = cmsSteps.length > 0
                  ? cmsSteps.map((s, idx) => ({ n: String(s.step).padStart(2, '0'), title: s.title, desc: s.description, icon: [<Users size={20} key={0} />, <Scissors size={20} key={1} />, <BarChart3 size={20} key={2} />][idx] ?? <BarChart3 size={20} />, detail: '' }))
                  : defaultSteps

                return steps.map((step, i) => (
                  <Reveal key={i} delay={i * 120}>
                    <div className="timeline-item">
                      <div className={`timeline-bubble ${i === 0 ? 'timeline-bubble-active' : 'timeline-bubble-default'}`}>
                        {step.n}
                      </div>
                      <SpotlightCard className="timeline-card" spotlightColor="rgba(200,113,74,0.12)">
                        <div style={{ position: 'relative', zIndex: 1 }}>
                          <div className="timeline-card-header">
                            <div className="timeline-card-title-row">
                              <div style={{ color: 'var(--terra)' }}>{step.icon}</div>
                              <h3 className="display" style={{ fontSize: 22, fontWeight: 500, color: 'var(--ink)', margin: 0 }}>
                                {step.title}
                              </h3>
                            </div>
                            {step.detail && <span className="timeline-badge">{step.detail}</span>}
                          </div>
                          <p style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--mid)', margin: 0 }}>
                            {step.desc}
                          </p>
                        </div>
                      </SpotlightCard>
                    </div>
                  </Reveal>
                ))
              })()}
            </div>
          </div>
        </section>

        {/* ── FUNCIONALIDADES ── */}
        <section id="funcionalidades" className="dark-linen" style={{ padding: '100px 0 0' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 40px' }}>
            <Reveal>
              <span className="tag" style={{ display: 'block', textAlign: 'center', marginBottom: 20 }}>Funcionalidades</span>
              <h2 className="display" style={{ fontSize: 'clamp(32px,5vw,64px)', fontWeight: 300, color: 'var(--cream)', textAlign: 'center', marginBottom: 56, letterSpacing: '-0.01em' }}>
                Tudo que seu ateliê precisa,<br />
                <em style={{ color: 'var(--gold)' }}>nada que não precisa.</em>
              </h2>
            </Reveal>
          </div>

          {/* ScrollStack de funcionalidades */}
          <div style={{ maxWidth: 860, margin: '0 auto' }}>
            <ScrollStack
              useWindowScroll
              itemDistance={80}
              itemScale={0.04}
              itemStackDistance={28}
              stackPosition="18%"
              scaleEndPosition="8%"
              baseScale={0.82}
              blurAmount={1.2}
            >
              {[
                {
                  icon: <BarChart3 size={28} />,
                  title: 'Dashboard em tempo real',
                  desc: 'KPIs atualizados instantaneamente. Visualize receita, ordens em aberto e performance do seu ateliê de um relance.',
                  accent: '#C8714A',
                  bg: 'linear-gradient(135deg, #2a1a10 0%, #3a2015 100%)',
                  border: 'rgba(200,113,74,0.25)',
                },
                {
                  icon: <FileText size={28} />,
                  title: 'Ordens de serviço',
                  desc: 'Timeline completa por ordem. Status, histórico de alterações, anotações e fotos em um só lugar.',
                  accent: '#D4A85A',
                  bg: 'linear-gradient(135deg, #251a08 0%, #35250e 100%)',
                  border: 'rgba(212,168,90,0.25)',
                },
                {
                  icon: <Users size={28} />,
                  title: 'Gestão de clientes',
                  desc: 'Cadastro completo com histórico de compras, medidas, aniversários e preferências de cada cliente.',
                  accent: '#C8714A',
                  bg: 'linear-gradient(135deg, #2a1a10 0%, #3a2015 100%)',
                  border: 'rgba(200,113,74,0.25)',
                },
                {
                  icon: <Wallet size={28} />,
                  title: 'Controle financeiro',
                  desc: 'Caixa, contas a pagar e a receber com relatórios de fluxo de caixa mensais e metas de faturamento.',
                  accent: '#D4A85A',
                  bg: 'linear-gradient(135deg, #251a08 0%, #35250e 100%)',
                  border: 'rgba(212,168,90,0.25)',
                },
                {
                  icon: <Search size={28} />,
                  title: 'Busca global ⌘K',
                  desc: 'Encontre qualquer cliente, ordem ou serviço em segundos com busca inteligente em todo o sistema.',
                  accent: '#C8714A',
                  bg: 'linear-gradient(135deg, #2a1a10 0%, #3a2015 100%)',
                  border: 'rgba(200,113,74,0.25)',
                },
                {
                  icon: <Bell size={28} />,
                  title: 'Lembretes automáticos',
                  desc: 'Aniversários, ordens vencendo e contas a pagar — notificações sempre no momento certo.',
                  accent: '#D4A85A',
                  bg: 'linear-gradient(135deg, #251a08 0%, #35250e 100%)',
                  border: 'rgba(212,168,90,0.25)',
                },
                {
                  icon: <TrendingUp size={28} />,
                  title: 'Análises avançadas',
                  desc: 'Gráficos de evolução, comparativos mensais e serviços mais vendidos para decisões mais inteligentes.',
                  accent: '#C8714A',
                  bg: 'linear-gradient(135deg, #2a1a10 0%, #3a2015 100%)',
                  border: 'rgba(200,113,74,0.25)',
                },
                {
                  icon: <Shield size={28} />,
                  title: 'Dados seguros',
                  desc: 'Arquitetura multi-tenant com isolamento total entre ateliês. Conformidade com a LGPD.',
                  accent: '#D4A85A',
                  bg: 'linear-gradient(135deg, #251a08 0%, #35250e 100%)',
                  border: 'rgba(212,168,90,0.25)',
                },
              ].map((f, i) => (
                <ScrollStackItem key={i} itemClassName="">
                  <div style={{
                    background: f.bg,
                    border: `1px solid ${f.border}`,
                    borderRadius: 28,
                    padding: '48px 56px',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 20,
                  }}>
                    {/* número + ícone */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{
                        width: 52, height: 52, borderRadius: 14,
                        background: `${f.accent}22`,
                        border: `1px solid ${f.accent}44`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: f.accent,
                      }}>
                        {f.icon}
                      </div>
                      <span style={{
                        fontSize: 72, fontWeight: 700, lineHeight: 1,
                        color: 'rgba(247,240,230,0.04)',
                        fontVariantNumeric: 'tabular-nums',
                        userSelect: 'none',
                      }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </div>

                    {/* texto */}
                    <div>
                      <h3 style={{
                        fontSize: 'clamp(20px,2vw,26px)', fontWeight: 500,
                        color: 'var(--cream)', margin: '0 0 12px', letterSpacing: '-0.01em',
                      }}>
                        {f.title}
                      </h3>
                      <p style={{
                        fontSize: 16, lineHeight: 1.75,
                        color: 'rgba(247,240,230,0.55)', margin: 0, maxWidth: 520,
                      }}>
                        {f.desc}
                      </p>
                    </div>

                    {/* linha decorativa */}
                    <div style={{
                      marginTop: 'auto', height: 1,
                      background: `linear-gradient(90deg, ${f.accent}55, transparent)`,
                    }} />
                  </div>
                </ScrollStackItem>
              ))}
            </ScrollStack>
          </div>
        </section>

        {/* ── ANTES × DEPOIS ── */}
        <section className="linen section-pad">
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>

            <Reveal>
              <h2 className="display" style={{ fontSize: 'clamp(32px,5vw,64px)', fontWeight: 300, color: 'var(--ink)', textAlign: 'center', marginBottom: 56 }}>
                Antes <span style={{ color: 'rgba(0,0,0,0.15)' }}>×</span> Depois
              </h2>
            </Reveal>

            <div className="comparison-grid">
              <Reveal>
                <div className="comparison-card" style={{ background: 'var(--card)', padding: '40px', height: '100%' }}>
                  <p style={{ fontSize: 11, letterSpacing: '0.12em', color: '#c04040', textTransform: 'uppercase', marginBottom: 20 }}>Sem sistema</p>
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
                    {[
                      ['Planilhas desorganizadas', 'Dados espalhados, difícil de encontrar'],
                      ['Anotações em papel', 'Informações que somem ou se perdem'],
                      ['Caixa que não fecha', 'Sem controle preciso do que entrou e saiu'],
                      ['Horas perdidas buscando', 'Histórico de clientes inacessível'],
                      ['Decisões no escuro', 'Sem dados para analisar o negócio'],
                    ].map(([t, d]) => (
                      <li key={t} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                        <X size={16} style={{ color: '#c04040', flexShrink: 0, marginTop: 2 }} />
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)', marginBottom: 2, margin: '0 0 2px' }}>{t}</p>
                          <p style={{ fontSize: 13, color: 'var(--mid)', margin: 0 }}>{d}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>

              <Reveal delay={100}>
                <div className="comparison-card" style={{ background: '#2C1810', padding: '40px', height: '100%' }}>
                  <p style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--terra)', textTransform: 'uppercase', marginBottom: 20 }}>Com Meu Atelier</p>
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
                    {[
                      ['Tudo centralizado', 'Busca instantânea de qualquer informação'],
                      ['Histórico completo', 'Cada cliente com todos os detalhes salvos'],
                      ['Controle financeiro preciso', 'Sabe exatamente quanto entrou e saiu'],
                      ['5h economizadas por semana', 'Menos tempo em tarefas administrativas'],
                      ['Decisões baseadas em dados', 'Relatórios claros para crescer com confiança'],
                    ].map(([t, d]) => (
                      <li key={t} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                        <Check size={16} style={{ color: 'var(--terra)', flexShrink: 0, marginTop: 2 }} />
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--cream)', marginBottom: 2, margin: '0 0 2px' }}>{t}</p>
                          <p style={{ fontSize: 13, color: 'rgba(247,240,230,0.5)', margin: 0 }}>{d}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── DEPOIMENTOS (CMS) ── */}
        {(() => {
          let testimonials: { name: string; role: string; text: string }[] = []
          try { testimonials = cms.testimonials_json ? JSON.parse(cms.testimonials_json) : [] } catch { /* */ }
          if (testimonials.length === 0) return null
          return (
            <section className="linen section-pad">
              <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                <Reveal>
                  <h2 className="display" style={{ fontSize: 'clamp(28px,4vw,52px)', fontWeight: 300, color: 'var(--ink)', textAlign: 'center', marginBottom: 56 }}>
                    O que dizem nossas <em style={{ color: 'var(--terra)' }}>clientes</em>
                  </h2>
                </Reveal>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(testimonials.length, 3)}, 1fr)`, gap: 24 }}>
                  {testimonials.map((t, i) => (
                    <Reveal key={i} delay={i * 80}>
                      <div style={{ background: 'var(--card)', padding: '32px 28px', border: '1px solid rgba(212,168,90,0.15)', height: '100%' }}>
                        <p style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--mid)', margin: '0 0 24px', fontStyle: 'italic' }}>"{t.text}"</p>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)', margin: '0 0 2px' }}>{t.name}</p>
                          <p style={{ fontSize: 12, color: 'var(--terra)', margin: 0 }}>{t.role}</p>
                        </div>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            </section>
          )
        })()}

        {/* ── FAQ (CMS) ── */}
        {(() => {
          let faq: { question: string; answer: string }[] = []
          try { faq = cms.faq_json ? JSON.parse(cms.faq_json) : [] } catch { /* */ }
          if (faq.length === 0) return null
          return (
            <section className="dark-linen section-pad">
              <div style={{ maxWidth: 760, margin: '0 auto' }}>
                <Reveal>
                  <h2 className="display" style={{ fontSize: 'clamp(28px,4vw,52px)', fontWeight: 300, color: 'var(--cream)', textAlign: 'center', marginBottom: 56 }}>
                    Perguntas <em style={{ color: 'var(--gold)' }}>frequentes</em>
                  </h2>
                </Reveal>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'rgba(212,168,90,0.1)' }}>
                  {faq.map((f, i) => (
                    <Reveal key={i} delay={i * 60}>
                      <div style={{ background: 'rgba(247,240,230,0.03)', padding: '28px 32px' }}>
                        <p style={{ fontSize: 16, fontWeight: 500, color: 'var(--cream)', margin: '0 0 10px' }}>{f.question}</p>
                        <p style={{ fontSize: 14, lineHeight: 1.75, color: 'rgba(247,240,230,0.55)', margin: 0 }}>{f.answer}</p>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            </section>
          )
        })()}

        {/* ── PLANOS ── */}
        <section id="planos" className="dark-linen section-pad">
          <div style={{ maxWidth: plans.length > 2 ? 1200 : 900, margin: '0 auto' }}>

            <Reveal>
              <span className="tag" style={{ display: 'block', textAlign: 'center', marginBottom: 20 }}>Preços</span>
              <h2 className="display" style={{ fontSize: 'clamp(32px,5vw,64px)', fontWeight: 300, color: 'var(--cream)', textAlign: 'center', marginBottom: 12, letterSpacing: '-0.01em' }}>
                Comece grátis.<br />
                <em style={{ color: 'var(--gold)' }}>Cresça no seu ritmo.</em>
              </h2>
              <p style={{ textAlign: 'center', color: 'rgba(247,240,230,0.5)', marginBottom: 56, fontSize: 15 }}>Sem cartão de crédito para começar.</p>
            </Reveal>

            {plans.length > 0 ? (
              <div className="plans-grid" style={{ '--plans-cols': String(Math.min(plans.length, 3)) } as React.CSSProperties}>
                {plans.map((plan, idx) => {
                  const featured = plan.is_featured
                  const ink = featured ? 'var(--ink)' : 'var(--cream)'
                  const mid = featured ? 'var(--mid)' : 'rgba(247,240,230,0.4)'
                  const whole = plan.price === 0 ? '0' : String(Math.floor(plan.price))
                  const cents = plan.price === 0 ? null : Math.round((plan.price - Math.floor(plan.price)) * 100).toString().padStart(2, '0')

                  return (
                    <Reveal key={plan.id} delay={idx * 100}>
                      <GlareHover
                        glareColor={featured ? '#C8714A' : '#D4A85A'}
                        glareOpacity={featured ? 0.15 : 0.1}
                        glareAngle={-40}
                        glareSize={300}
                        style={{
                          background: featured ? 'var(--card)' : 'rgba(247,240,230,0.03)',
                          border: `1px solid ${featured ? 'rgba(200,113,74,0.35)' : 'rgba(212,168,90,0.12)'}`,
                          borderRadius: 20,
                          height: '100%',
                          position: 'relative',
                        }}
                      >
                        {/* barra topo destaque */}
                        {featured && (
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--terra)', borderRadius: '20px 20px 0 0' }} />
                        )}

                        {/* conteúdo com padding responsivo via classe */}
                        <div className="plan-card" style={{ position: 'relative', zIndex: 2, height: '100%' }}>
                          {plan.badge && (
                            <div style={{ position: 'absolute', top: -1, right: 20 }}>
                              <span style={{ background: 'var(--terra)', color: 'var(--cream)', fontSize: 10, padding: '4px 12px', letterSpacing: '0.12em', textTransform: 'uppercase', borderRadius: '0 0 8px 8px', display: 'block' }}>
                                {plan.badge}
                              </span>
                            </div>
                          )}

                          <p className="display" style={{ fontSize: 'clamp(22px,3vw,28px)', fontWeight: 300, color: ink, margin: '0 0 16px' }}>{plan.name}</p>

                          <div style={{ marginBottom: 4 }}>
                            <span className="display" style={{ fontSize: 'clamp(40px,5vw,56px)', fontWeight: 300, color: ink, lineHeight: 1 }}>R$ {whole}</span>
                            {cents
                              ? <span style={{ color: mid, fontSize: 14 }}>,{cents} /mês</span>
                              : <span style={{ color: mid, fontSize: 14 }}> /mês</span>
                            }
                          </div>

                          <p style={{ fontSize: 13, color: mid, marginBottom: 28, minHeight: 20 }}>
                            {plan.annual_note || plan.description || '\u00a0'}
                          </p>

                          <Link
                            href={plan.cta_url}
                            className={featured ? 'btn-primary' : 'btn-ghost'}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 32, textAlign: 'center' }}
                          >
                            {plan.cta_text} {featured && <ArrowRight size={14} />}
                          </Link>

                          <div style={{ height: 1, background: featured ? 'rgba(200,113,74,0.15)' : 'rgba(212,168,90,0.08)', marginBottom: 24 }} />

                          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 13 }}>
                            {plan.features.map((f, fi) => (
                              <li key={fi} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                {f.included
                                  ? <Check size={14} style={{ color: featured ? 'var(--terra)' : 'var(--gold)', flexShrink: 0, marginTop: 2 }} />
                                  : <X size={14} style={{ color: 'rgba(247,240,230,0.18)', flexShrink: 0, marginTop: 2 }} />
                                }
                                <span style={{
                                  fontSize: 13, lineHeight: 1.5,
                                  color: f.included
                                    ? (featured ? 'var(--mid)' : 'rgba(247,240,230,0.6)')
                                    : 'rgba(247,240,230,0.22)',
                                }}>{f.text}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </GlareHover>
                    </Reveal>
                  )
                })}
              </div>
            ) : (
              /* Skeleton enquanto carrega */
              <div className="plans-grid">
                {[0, 1].map((i) => (
                  <div key={i} style={{
                    background: 'rgba(247,240,230,0.04)', padding: 48,
                    border: '1px solid rgba(212,168,90,0.1)',
                    animation: 'pulse 2s ease infinite',
                    minHeight: 400,
                  }} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── CTA FINAL ── */}
        <section className="dark-linen section-pad" style={{ textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 'min(600px, 90vw)', height: 'min(600px, 90vw)', border: '1px solid rgba(212,168,90,0.06)', borderRadius: '50%', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 'min(400px, 60vw)', height: 'min(400px, 60vw)', border: '1px solid rgba(212,168,90,0.08)', borderRadius: '50%', pointerEvents: 'none' }} />

          <Reveal>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <span className="tag" style={{ marginBottom: 24, display: 'inline-block' }}>Comece agora</span>
              <h2 className="display" style={{ fontSize: 'clamp(36px,6vw,80px)', fontWeight: 300, color: 'var(--cream)', marginBottom: 24, letterSpacing: '-0.02em' }}>
                O ateliê que você<br />sempre quis ter.
              </h2>
              <p style={{ fontSize: 16, color: 'rgba(247,240,230,0.5)', maxWidth: 380, margin: '0 auto 40px' }}>
                Plano gratuito para sempre. Sem surpresas.
              </p>
              <Link href="/cadastro" className="btn-primary" style={{ fontSize: 15, padding: '18px 48px' }}>
                Criar conta grátis <ArrowRight size={16} />
              </Link>
            </div>
          </Reveal>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ background: '#100a05', padding: '32px 20px', borderTop: '1px solid rgba(212,168,90,0.1)' }}>
          <div className="footer-inner">
            <div className="display" style={{ fontSize: 18, color: 'rgba(247,240,230,0.4)', fontWeight: 300 }}>
              {c.footerTagline}
            </div>
            <div className="footer-links">
              {[
                { href: '/privacidade', label: 'Privacidade' },
                { href: '/termos', label: 'Termos' },
                { href: '/lgpd', label: 'LGPD' },
              ].map(l => (
                <Link key={l.href} href={l.href} style={{ fontSize: 12, color: 'rgba(247,240,230,0.3)', letterSpacing: '0.06em', textDecoration: 'none' }}>
                  {l.label}
                </Link>
              ))}
            </div>
            <p style={{ fontSize: 12, color: 'rgba(247,240,230,0.25)', margin: 0 }}>
              © {new Date().getFullYear()} Meu Atelier
            </p>
          </div>
        </footer>

      </div>
    </>
  )
}
