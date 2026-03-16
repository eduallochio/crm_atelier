'use client'

import Link from 'next/link'
import {
  Check, X, FileText, Wallet, Users, Scissors,
  BarChart3, ArrowRight, Clock, TrendingUp,
  Search, Bell, Shield, Menu, X as XIcon,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
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

/* ─── Dashboard mockup ─────────────────────────────────────────────────── */
function DashMockup() {
  return (
    <div className="relative">
      <div className="absolute -inset-px rounded-2xl" style={{ background: 'linear-gradient(135deg,#d4a85a55,transparent 60%)' }} />
      <div className="relative rounded-2xl overflow-hidden border" style={{ borderColor: '#3a2a1a' }}>
        {/* browser bar */}
        <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: '#1a110a' }}>
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
          <div className="ml-3 flex items-center gap-1.5 rounded px-3 py-1 text-[10px]" style={{ background: '#2C1810', color: '#a07850' }}>
            <Shield className="h-2.5 w-2.5" />
            meuatelier.com.br/dashboard
          </div>
        </div>
        {/* content */}
        <div className="p-4" style={{ background: '#f7f0e6' }}>
          <div className="grid grid-cols-2 gap-2 mb-3 sm:grid-cols-4">
            {[
              { label: 'Clientes', value: '156', sub: '+12%', color: '#c8714a' },
              { label: 'Ordens', value: '23', sub: '+5', color: '#c8714a' },
              { label: 'Receita', value: 'R$ 8,4k', sub: '+18%', color: '#2a7a4a' },
              { label: 'Caixa', value: 'R$ 1,2k', sub: '12 mov.', color: '#7a6a5a' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl p-3 shadow-sm" style={{ background: '#fff8f0' }}>
                <p className="text-[9px] mb-1" style={{ color: '#7a6a5a' }}>{s.label}</p>
                <p className="text-sm font-bold" style={{ color: '#2C1810', fontFamily: 'serif' }}>{s.value}</p>
                <p className="text-[8px] mt-0.5 font-medium" style={{ color: s.color }}>{s.sub}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl p-3 shadow-sm" style={{ background: '#fff8f0' }}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-semibold" style={{ color: '#2C1810' }}>Receita — Últimos 6 Meses</span>
              <span className="text-[9px]" style={{ color: '#a07850' }}>2025</span>
            </div>
            <div className="h-20 flex items-end gap-1">
              {[55, 72, 60, 85, 68, 92].map((h, i) => (
                <div key={i} className="flex-1 rounded-t" style={{
                  height: `${h}%`,
                  background: i === 5 ? '#c8714a' : '#d4a85a55',
                }} />
              ))}
            </div>
            <div className="flex justify-between mt-1">
              {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'].map(m => (
                <span key={m} className="text-[8px]" style={{ color: '#a07850' }}>{m}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Page ──────────────────────────────────────────────────────────────── */
export default function HomePage() {
  const [scrolled, setScrolled]   = useState(false)
  const [menuOpen, setMenuOpen]   = useState(false)
  const [plans, setPlans]         = useState<PublicPlan[]>([])
  const [cms, setCms]             = useState<LandingContent>({})

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    fetch('/api/plans').then((r) => r.json()).then(setPlans).catch(() => {})
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

        /* ── mobile menu overlay ── */
        .mobile-menu {
          position: fixed; inset: 0; z-index: 200;
          background: rgba(26,17,10,0.97);
          display: flex; flex-direction: column;
          padding: 80px 32px 48px;
          transform: translateX(100%);
          transition: transform 0.35s cubic-bezier(0.4,0,0.2,1);
        }
        .mobile-menu.open { transform: translateX(0); }
        .mobile-menu .nav-link {
          font-size: 22px; letter-spacing: 0.04em; padding: 14px 0;
          border-bottom: 1px solid rgba(212,168,90,0.1);
          color: rgba(247,240,230,0.75);
          display: block;
        }

        /* ── LAYOUT CLASSES ── */

        /* nav */
        .nav-links-desktop { display: flex; gap: 32px; align-items: center; }
        .nav-hamburger { display: none; background: none; border: none; cursor: pointer; color: var(--cream); padding: 4px; }

        /* hero grid */
        .hero-grid {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 80px;
          align-items: center;
        }
        .hero-mockup-col { display: block; }

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
          grid-template-columns: 1fr 1fr;
          gap: 1px;
          background: rgba(212,168,90,0.15);
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
          .hero-mockup-col { max-width: 540px; margin: 0 auto; width: 100%; }
          .steps-grid { grid-template-columns: 1fr; }
          .features-grid { grid-template-columns: repeat(2, 1fr); }
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

          /* comparison & plans: single col */
          .comparison-grid { grid-template-columns: 1fr; }
          .plans-grid { grid-template-columns: 1fr; }

          /* section padding */
          .section-pad { padding: 64px 20px; }
          .section-pad-sm { padding: 56px 20px; }

          /* footer */
          .footer-inner { flex-direction: column; align-items: center; text-align: center; gap: 16px; }
          .footer-links { gap: 20px; }

          /* nav bar padding */
          .nav-bar { padding: 16px 20px !important; }

          /* plans card padding */
          .plan-card { padding: 36px 24px !important; }
          .comparison-card { padding: 28px 20px !important; }
        }

        /* ── SMALL MOBILE (≤ 400px) ── */
        @media (max-width: 400px) {
          .trust-row { flex-direction: column; align-items: flex-start; gap: 10px; }
          .footer-links { flex-wrap: wrap; justify-content: center; gap: 16px; }
        }
      `}</style>

      <div style={{ background: 'var(--ink)' }}>

        {/* ── MOBILE MENU ── */}
        <div
          className={`mobile-menu ${menuOpen ? 'open' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setMenuOpen(false)}
            style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: 'var(--cream)', cursor: 'pointer', padding: 8 }}
          >
            <XIcon size={24} />
          </button>
          <div className="display" style={{ fontSize: 24, fontWeight: 600, color: 'var(--cream)', marginBottom: 40, letterSpacing: '0.05em' }}>
            Meu <span style={{ color: 'var(--terra)' }}>Atelier</span>
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 40 }}>
            {[
              { href: '#funcionalidades', label: 'Funcionalidades' },
              { href: '#como-funciona', label: 'Como funciona' },
              { href: '#planos', label: 'Planos' },
              { href: '/login', label: 'Entrar' },
            ].map(l => (
              <a key={l.href} href={l.href} className="nav-link" onClick={() => setMenuOpen(false)}>
                {l.label}
              </a>
            ))}
          </nav>
          <Link href="/cadastro" className="btn-primary" style={{ textAlign: 'center' }}>
            Começar grátis <ArrowRight size={15} />
          </Link>
        </div>

        {/* ── NAV ── */}
        <nav
          className="nav-bar"
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
            padding: '20px 40px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: scrolled ? 'rgba(26,17,10,0.92)' : 'transparent',
            backdropFilter: scrolled ? 'blur(12px)' : 'none',
            borderBottom: scrolled ? '1px solid rgba(212,168,90,0.15)' : 'none',
            transition: 'all 0.4s ease',
          }}
        >
          <div className="display" style={{ fontSize: 22, fontWeight: 600, color: 'var(--cream)', letterSpacing: '0.05em' }}>
            Meu <span style={{ color: 'var(--terra)' }}>Atelier</span>
          </div>

          {/* desktop links */}
          <div className="nav-links-desktop">
            <a href="#funcionalidades" className="nav-link">Funcionalidades</a>
            <a href="#como-funciona" className="nav-link">Como funciona</a>
            <a href="#planos" className="nav-link">Planos</a>
            <Link href="/login" className="nav-link">Entrar</Link>
            <Link href="/cadastro" className="btn-primary" style={{ padding: '10px 22px', fontSize: 12 }}>
              Começar grátis
            </Link>
          </div>

          {/* hamburger */}
          <button
            className="nav-hamburger"
            onClick={(e) => { e.stopPropagation(); setMenuOpen(o => !o) }}
            aria-label="Abrir menu"
          >
            <Menu size={24} />
          </button>
        </nav>

        {/* ── HERO ── */}
        <section className="dark-linen hero-pad" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', width: '100%' }}>

            <div className="hero-anim-1" style={{ marginBottom: 24 }}>
              <span className="tag">Sistema de Gestão para Ateliês</span>
            </div>

            <div className="hero-anim-2" style={{ marginBottom: 40 }}>
              <h1 className="display" style={{
                fontSize: 'clamp(48px, 9vw, 112px)',
                fontWeight: 300, lineHeight: 1.0,
                color: 'var(--cream)',
                letterSpacing: '-0.02em',
                margin: 0,
              }}>
                Seu ateliê,<br />
                <em style={{ color: 'var(--terra)', fontStyle: 'italic' }}>organizado</em><br />
                como merece.
              </h1>
            </div>

            <div className="hero-grid">
              {/* copy */}
              <div>
                <p className="hero-anim-3" style={{ fontSize: 16, lineHeight: 1.75, color: 'rgba(247,240,230,0.65)', maxWidth: 420, marginBottom: 36 }}>
                  {c.heroSubtitle}
                </p>

                <div className="hero-buttons hero-anim-4" style={{ marginBottom: 48 }}>
                  <Link href="/cadastro" className="btn-primary">
                    {c.ctaPrimary} <ArrowRight size={15} />
                  </Link>
                  <a href="#como-funciona" className="btn-ghost">
                    {c.ctaSecondary}
                  </a>
                </div>

                <div className="trust-row hero-anim-5">
                  {['Plano gratuito para sempre', 'LGPD em conformidade', '99.9% uptime'].map(t => (
                    <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--terra)', flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: 'rgba(247,240,230,0.45)', letterSpacing: '0.04em' }}>{t}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* mockup */}
              <div className="float hero-anim-3 hero-mockup-col" style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: -40, right: -20, width: 1, height: 180, background: 'linear-gradient(to bottom, transparent, var(--gold), transparent)', display: 'none' }} />
                <DashMockup />
              </div>
            </div>

            {/* stats strip */}
            <div style={{ marginTop: 64 }}>
              <div className="gold-line" style={{ marginBottom: 32 }} />
              <div className="stats-grid">
                {[
                  { num: '5h', desc: 'economizadas por semana' },
                  { num: '95%', desc: 'menos erros no caixa' },
                  { num: c.statsOrgs, desc: 'ateliês cadastrados' },
                  { num: 'R$ 0', desc: 'para começar hoje' },
                ].map((s, i) => (
                  <div key={i} style={{
                    padding: '0 24px',
                    borderLeft: i > 0 ? '1px solid rgba(212,168,90,0.2)' : 'none',
                  }}>
                    <div className="display" style={{ fontSize: 'clamp(32px,5vw,48px)', fontWeight: 300, color: 'var(--gold)', lineHeight: 1.1 }}>{s.num}</div>
                    <div style={{ fontSize: 13, color: 'rgba(247,240,230,0.5)', marginTop: 4 }}>{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── COMO FUNCIONA ── */}
        <section id="como-funciona" className="linen section-pad">
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>

            <Reveal>
              <div className="scissor-divider" style={{ marginBottom: 16 }}>
                <div className="gold-line" style={{ flex: 1 }} />
                <Scissors size={16} style={{ color: 'var(--gold)' }} />
                <div className="gold-line" style={{ flex: 1 }} />
              </div>
              <h2 className="display" style={{ fontSize: 'clamp(32px,5vw,64px)', fontWeight: 300, color: 'var(--ink)', textAlign: 'center', marginBottom: 56, letterSpacing: '-0.01em' }}>
                Três passos para organizar<br />
                <em style={{ color: 'var(--terra)' }}>tudo que importa</em>
              </h2>
            </Reveal>

            <div className="steps-grid">
              {(() => {
                let cmsSteps: { step: number; title: string; description: string }[] = []
                try { cmsSteps = cms.how_it_works_json ? JSON.parse(cms.how_it_works_json) : [] } catch { /* */ }

                const defaultSteps = [
                  { n: '01', title: 'Crie sua conta', desc: 'Cadastro em menos de 2 minutos. Sem cartão de crédito. Configure o nome do seu ateliê e comece imediatamente.', icon: <Users size={20} style={{ color: 'var(--terra)' }} /> },
                  { n: '02', title: 'Cadastre seus dados', desc: 'Adicione clientes, serviços e preços. O sistema se adapta ao seu jeito de trabalhar, não o contrário.', icon: <Scissors size={20} style={{ color: 'var(--terra)' }} /> },
                  { n: '03', title: 'Gerencie com clareza', desc: 'Ordens de serviço, caixa, relatórios — tudo em uma tela. De qualquer dispositivo, a qualquer hora.', icon: <BarChart3 size={20} style={{ color: 'var(--terra)' }} /> },
                ]

                const steps = cmsSteps.length > 0
                  ? cmsSteps.map((s) => ({ n: String(s.step).padStart(2, '0'), title: s.title, desc: s.description, icon: <BarChart3 size={20} style={{ color: 'var(--terra)' }} /> }))
                  : defaultSteps

                return steps.map((step, i) => (
                  <Reveal key={i} delay={i * 100}>
                    <div style={{ background: 'var(--card)', padding: '44px 36px', position: 'relative', overflow: 'hidden', height: '100%' }}>
                      <span className="step-num">{step.n}</span>
                      <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ marginBottom: 20 }}>{step.icon}</div>
                        <h3 className="display" style={{ fontSize: 26, fontWeight: 400, color: 'var(--ink)', marginBottom: 14, margin: '0 0 14px' }}>{step.title}</h3>
                        <p style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--mid)', margin: 0 }}>{step.desc}</p>
                      </div>
                    </div>
                  </Reveal>
                ))
              })()}
            </div>
          </div>
        </section>

        {/* ── FUNCIONALIDADES ── */}
        <section id="funcionalidades" className="dark-linen section-pad">
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>

            <Reveal>
              <span className="tag" style={{ display: 'block', textAlign: 'center', marginBottom: 20 }}>Funcionalidades</span>
              <h2 className="display" style={{ fontSize: 'clamp(32px,5vw,64px)', fontWeight: 300, color: 'var(--cream)', textAlign: 'center', marginBottom: 56, letterSpacing: '-0.01em' }}>
                Tudo que seu ateliê precisa,<br />
                <em style={{ color: 'var(--gold)' }}>nada que não precisa.</em>
              </h2>
            </Reveal>

            <div className="features-grid">
              {(() => {
                // Use CMS features if available, otherwise use hardcoded defaults
                let cmsFeatures: { title: string; description: string }[] = []
                try { cmsFeatures = cms.features_json ? JSON.parse(cms.features_json) : [] } catch { /* */ }

                if (cmsFeatures.length > 0) {
                  return cmsFeatures.map((f, i) => (
                    <Reveal key={i} delay={i * 50}>
                      <div className="feature-card" style={{ background: 'rgba(247,240,230,0.03)' }}>
                        <div style={{ color: 'var(--terra)', marginBottom: 16 }}><BarChart3 size={22} /></div>
                        <h3 style={{ fontSize: 16, fontWeight: 500, color: 'var(--cream)', marginBottom: 10, margin: '0 0 10px' }}>{f.title}</h3>
                        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(247,240,230,0.5)', margin: 0 }}>{f.description}</p>
                      </div>
                    </Reveal>
                  ))
                }

                return [
                  { icon: <BarChart3 size={22} />, title: 'Dashboard em tempo real', desc: 'KPIs atualizados instantaneamente. Visualize receita, ordens em aberto e performance de um relance.' },
                  { icon: <FileText size={22} />, title: 'Ordens de serviço', desc: 'Timeline completa por ordem. Status, histórico de alterações, anotações e fotos em um só lugar.' },
                  { icon: <Users size={22} />, title: 'Gestão de clientes', desc: 'Cadastro completo com histórico de compras, medidas, aniversários e preferências.' },
                  { icon: <Wallet size={22} />, title: 'Controle financeiro', desc: 'Caixa, contas a pagar e a receber com relatórios de fluxo de caixa mensais.' },
                  { icon: <Search size={22} />, title: 'Busca global ⌘K', desc: 'Encontre qualquer cliente, ordem ou serviço em segundos com busca inteligente.' },
                  { icon: <Bell size={22} />, title: 'Lembretes automáticos', desc: 'Aniversários, ordens vencendo e contas a pagar — notificações no painel.' },
                  { icon: <TrendingUp size={22} />, title: 'Análises avançadas', desc: 'Gráficos de evolução, comparativos mensais e serviços mais vendidos.' },
                  { icon: <Clock size={22} />, title: 'Histórico completo', desc: 'Cada alteração registrada com data, hora e responsável. Nada se perde.' },
                  { icon: <Shield size={22} />, title: 'Dados seguros', desc: 'Arquitetura multi-tenant com isolamento total. Conformidade com LGPD.' },
                ].map((f, i) => (
                  <Reveal key={i} delay={i * 50}>
                    <div className="feature-card" style={{ background: 'rgba(247,240,230,0.03)' }}>
                      <div style={{ color: 'var(--terra)', marginBottom: 16 }}>{f.icon}</div>
                      <h3 style={{ fontSize: 16, fontWeight: 500, color: 'var(--cream)', marginBottom: 10, margin: '0 0 10px' }}>{f.title}</h3>
                      <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(247,240,230,0.5)', margin: 0 }}>{f.desc}</p>
                    </div>
                  </Reveal>
                ))
              })()}
            </div>
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
              <div className="plans-grid" style={{ gridTemplateColumns: `repeat(${Math.min(plans.length, 3)}, 1fr)` }}>
                {plans.map((plan, idx) => {
                  const featured = plan.is_featured
                  const ink = featured ? 'var(--ink)' : 'var(--cream)'
                  const mid = featured ? 'var(--mid)' : 'rgba(247,240,230,0.4)'
                  const whole = plan.price === 0 ? '0' : String(Math.floor(plan.price))
                  const cents = plan.price === 0 ? null : Math.round((plan.price - Math.floor(plan.price)) * 100).toString().padStart(2, '0')

                  return (
                    <Reveal key={plan.id} delay={idx * 100}>
                      <div className="plan-card" style={{
                        background: featured ? 'var(--card)' : 'rgba(247,240,230,0.03)',
                        padding: 48, height: '100%', position: 'relative',
                      }}>
                        {featured && (
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--terra)' }} />
                        )}
                        {plan.badge && (
                          <div style={{ position: 'absolute', top: 16, right: 16 }}>
                            <span style={{ background: 'var(--terra)', color: 'var(--cream)', fontSize: 10, padding: '4px 10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                              {plan.badge}
                            </span>
                          </div>
                        )}
                        <p className="display" style={{ fontSize: 28, fontWeight: 300, color: ink, marginBottom: 4, margin: '0 0 4px' }}>{plan.name}</p>
                        <div style={{ marginBottom: plan.annual_note ? 4 : 8 }}>
                          <span className="display" style={{ fontSize: 52, fontWeight: 300, color: ink }}>R$ {whole}</span>
                          {cents
                            ? <span style={{ color: mid, fontSize: 14 }}>,{cents} /mês</span>
                            : <span style={{ color: mid, fontSize: 14 }}> /mês</span>
                          }
                        </div>
                        <p style={{ fontSize: 13, color: mid, marginBottom: 28 }}>
                          {plan.annual_note || plan.description || '\u00a0'}
                        </p>
                        <Link
                          href={plan.cta_url}
                          className={featured ? 'btn-primary' : 'btn-ghost'}
                          style={{ display: 'block', textAlign: 'center', marginBottom: 32 }}
                        >
                          {plan.cta_text} {featured && <ArrowRight size={14} />}
                        </Link>
                        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {plan.features.map((f, fi) => (
                            <li key={fi} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                              {f.included
                                ? <Check size={14} style={{ color: featured ? 'var(--terra)' : 'var(--gold)', flexShrink: 0 }} />
                                : <X size={14} style={{ color: 'rgba(247,240,230,0.2)', flexShrink: 0 }} />
                              }
                              <span style={{
                                fontSize: 13,
                                color: f.included
                                  ? (featured ? 'var(--mid)' : 'rgba(247,240,230,0.6)')
                                  : 'rgba(247,240,230,0.25)',
                              }}>{f.text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
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
