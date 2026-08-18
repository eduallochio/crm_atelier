'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const WA_LINK = 'https://wa.me/5527998714453?text=Ol%C3%A1%2C%20vim%20pela%20promo%C3%A7%C3%A3o%20de%2050%25%20do%20Meu%20Atelier%20Sistema%20e%20gostaria%20de%20saber%20mais!'
const DEADLINE = new Date('2026-09-15T23:59:59')

const features = [
  {
    title: 'Gestão de Clientes',
    desc: 'Cadastro completo com histórico de pedidos, endereço, telefone e anotações. Busca rápida e filtros.',
    icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm8 2a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm1 8v-2a4 4 0 0 0-3-3.87',
  },
  {
    title: 'Ordens de Serviço',
    desc: 'Crie e acompanhe cada pedido com status, prazo de entrega, materiais e observações.',
    icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
  },
  {
    title: 'Controle Financeiro',
    desc: 'Caixa diário, contas a pagar e receber, fluxo de caixa. Saiba exatamente quanto fatura.',
    icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  },
  {
    title: 'Estoque de Materiais',
    desc: 'Controle entradas e saídas de tecidos e aviamentos. Alerta de estoque mínimo.',
    icon: 'M2 7h20v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zM16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2',
  },
  {
    title: 'Dashboard e Relatórios',
    desc: 'Gráficos de faturamento, serviços mais vendidos e métricas de crescimento do ateliê.',
    icon: 'M22 12h-4l-3 9L9 3l-3 9H2',
  },
  {
    title: 'Catálogo de Serviços',
    desc: 'Tabela de preços com categorias e tempo estimado. Gere orçamentos em segundos.',
    icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  },
]

const faqs = [
  {
    q: 'Preciso saber usar computador para usar o sistema?',
    a: 'Não. O Meu Atelier Sistema foi feito pensando em quem costura, não em quem programa. A tela é simples, direta e funciona no celular também.',
  },
  {
    q: 'Meus dados ficam seguros?',
    a: 'Sim. Seus dados ficam em servidores profissionais com criptografia e backup automático. Nenhum outro ateliê tem acesso às suas informações.',
  },
  {
    q: 'E se eu quiser cancelar?',
    a: 'Cancele quando quiser, sem multa e sem burocracia. Seus dados ficam disponíveis para exportar por 30 dias após o cancelamento.',
  },
  {
    q: 'O cupom funciona em qual momento?',
    a: 'Aplique o cupom PROMO50 na hora de assinar o Plano Pro. O desconto é aplicado automaticamente na primeira cobrança.',
  },
]

function Countdown() {
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0 })

  useEffect(() => {
    function calc() {
      const diff = DEADLINE.getTime() - Date.now()
      if (diff <= 0) return
      setTime({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      })
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [])

  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div className="countdown">
      {[{ v: pad(time.d), l: 'dias' }, { v: pad(time.h), l: 'horas' }, { v: pad(time.m), l: 'min' }, { v: pad(time.s), l: 'seg' }].map(({ v, l }) => (
        <div key={l} className="cd-cell">
          <span className="cd-num">{v}</span>
          <span className="cd-label">{l}</span>
        </div>
      ))}
    </div>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`faq-item ${open ? 'open' : ''}`}>
      <button className="faq-q" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>{q}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && <p className="faq-a">{a}</p>}
    </div>
  )
}

export default function PromoPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Offer',
    name: 'Plano Pro — 50% de desconto no primeiro mês',
    description: 'Sistema de gestão completo para ateliês de costura e artesanato.',
    url: 'https://meuateliersistema.com.br/promo',
    priceCurrency: 'BRL',
    price: '24.95',
    priceValidUntil: '2026-09-15',
    seller: { '@type': 'Organization', name: 'Meu Atelier Sistema', url: 'https://meuateliersistema.com.br' },
    eligibleCustomerType: 'https://schema.org/NewCustomer',
    availability: 'https://schema.org/InStock',
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #F7F3F1; --bg2: #EDE8E5; --surface: #FFFFFF;
          --accent: #C8253A; --accent2: #9E1B2C;
          --text: #1A0F0F; --muted: #7A6A68; --border: rgba(26,15,15,0.10);
          --green: #1A8A3C;
        }
        @media (prefers-color-scheme: dark) {
          :root:not([data-theme="light"]) {
            --bg: #0D0A0A; --bg2: #161110; --surface: #1F1818;
            --text: #F5F0EE; --muted: #8A7F7E; --border: rgba(245,240,238,0.08);
            --green: #2DB356;
          }
        }
        :root[data-theme="dark"] {
          --bg: #0D0A0A; --bg2: #161110; --surface: #1F1818;
          --text: #F5F0EE; --muted: #8A7F7E; --border: rgba(245,240,238,0.08);
          --green: #2DB356;
        }
        body { font-family: 'DM Sans', sans-serif; background: var(--bg); color: var(--text); -webkit-font-smoothing: antialiased; }

        /* NAV */
        .promo-nav { display: flex; align-items: center; justify-content: space-between; padding: 18px 32px; border-bottom: 1px solid var(--border); background: var(--bg); position: sticky; top: 0; z-index: 10; }
        .promo-nav-brand { font-family: 'Playfair Display', serif; font-size: 17px; font-style: italic; color: var(--text); text-decoration: none; }
        .promo-badge { font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; background: var(--accent); color: #fff; padding: 4px 10px; border-radius: 20px; }

        /* HERO */
        .promo-hero { text-align: center; padding: 72px 24px 56px; max-width: 720px; margin: 0 auto; }
        .promo-eyebrow { display: inline-block; font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: var(--accent); margin-bottom: 28px; padding: 6px 16px; border: 1px solid rgba(200,37,58,0.3); border-radius: 20px; }
        .promo-disc-wrap { display: flex; align-items: center; justify-content: center; line-height: 1; margin-bottom: 16px; }
        .promo-disc-num { font-family: 'Playfair Display', serif; font-size: clamp(100px, 20vw, 160px); font-weight: 900; color: var(--accent); letter-spacing: -0.04em; line-height: 0.9; }
        .promo-disc-pct { font-family: 'Playfair Display', serif; font-size: clamp(44px, 9vw, 72px); font-weight: 700; color: var(--accent); align-self: flex-start; padding-top: clamp(18px, 3.5vw, 32px); }
        .promo-h1 { font-family: 'Playfair Display', serif; font-size: clamp(20px, 3.5vw, 30px); font-weight: 400; font-style: italic; color: var(--text); text-wrap: balance; margin-bottom: 12px; }
        .promo-detail { font-size: 15px; color: var(--muted); margin-bottom: 32px; }
        .promo-price-row { display: flex; align-items: baseline; justify-content: center; gap: 12px; margin-bottom: 12px; }
        .promo-old { font-size: 20px; color: var(--muted); text-decoration: line-through; }
        .promo-new { font-family: 'Playfair Display', serif; font-size: 42px; font-weight: 700; color: var(--accent); }
        .promo-period { font-size: 14px; color: var(--muted); }
        .promo-annual-hint { font-size: 13px; color: var(--green); font-weight: 600; margin-bottom: 28px; }
        .promo-btn { display: inline-block; padding: 18px 48px; background: var(--accent); color: #fff; border-radius: 4px; font-size: 14px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; text-decoration: none; transition: background 0.2s; }
        .promo-btn:hover { background: var(--accent2); }
        .promo-note { margin-top: 14px; font-size: 12px; color: var(--muted); }

        /* COUNTDOWN */
        .urgency-bar { background: var(--accent); color: #fff; text-align: center; padding: 14px 24px; }
        .urgency-bar p { font-size: 13px; font-weight: 500; margin-bottom: 10px; letter-spacing: 0.04em; }
        .countdown { display: inline-flex; gap: 8px; justify-content: center; }
        .cd-cell { display: flex; flex-direction: column; align-items: center; background: rgba(255,255,255,0.18); border-radius: 4px; padding: 6px 12px; min-width: 52px; }
        .cd-num { font-family: 'Playfair Display', serif; font-size: 26px; font-weight: 900; line-height: 1; font-variant-numeric: tabular-nums; }
        .cd-label { font-size: 9px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; margin-top: 2px; opacity: 0.85; }

        /* DIVIDER */
        .promo-divider { width: 40px; height: 2px; background: var(--accent); margin: 0 auto 64px; opacity: 0.3; }

        /* FEATURES */
        .promo-feats-wrap { max-width: 960px; margin: 0 auto; padding: 0 24px 72px; }
        .promo-section-label { text-align: center; font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted); margin-bottom: 48px; }
        .promo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; background: var(--border); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
        .promo-card { background: var(--surface); padding: 32px 28px; transition: background 0.15s; }
        .promo-card:hover { background: var(--bg2); }
        .promo-icon { width: 36px; height: 36px; margin-bottom: 18px; color: var(--accent); }
        .promo-feat-title { font-family: 'Playfair Display', serif; font-size: 17px; font-weight: 700; color: var(--text); margin-bottom: 8px; }
        .promo-feat-desc { font-size: 13.5px; color: var(--muted); line-height: 1.65; }

        /* MOCKUP */
        .mockup-section { background: var(--bg2); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 72px 24px; text-align: center; }
        .mockup-section h2 { font-family: 'Playfair Display', serif; font-size: clamp(22px, 4vw, 34px); font-weight: 700; color: var(--text); margin-bottom: 8px; text-wrap: balance; }
        .mockup-section > p { font-size: 14px; color: var(--muted); margin-bottom: 48px; }
        /* browser chrome */
        .mockup-chrome { max-width: 900px; margin: 0 auto; border-radius: 12px; overflow: hidden; box-shadow: 0 24px 80px rgba(0,0,0,0.15); border: 1px solid var(--border); }
        .mockup-bar { background: var(--bg2); padding: 10px 16px; display: flex; align-items: center; gap: 6px; border-bottom: 1px solid var(--border); }
        .mockup-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .mockup-url { flex: 1; background: var(--bg); border-radius: 4px; padding: 4px 10px; font-size: 11px; color: var(--muted); text-align: center; margin: 0 12px; font-family: monospace; }
        /* app shell */
        .mk-shell { display: flex; min-height: 380px; background: var(--surface); overflow: hidden; }
        /* sidebar — oculta em mobile */
        .mk-sidebar { width: 190px; flex-shrink: 0; background: var(--bg); border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: 16px 0; }
        .mk-logo { padding: 0 16px 16px; border-bottom: 1px solid var(--border); margin-bottom: 12px; }
        .mk-logo-text { font-size: 12px; font-weight: 700; color: var(--text); letter-spacing: 0.04em; }
        .mk-logo-sub { font-size: 9px; color: var(--muted); margin-top: 1px; }
        .mk-nav-section { font-size: 9px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); padding: 8px 16px 4px; opacity: 0.6; }
        .mk-nav-item { display: flex; align-items: center; gap: 8px; padding: 7px 16px; font-size: 11.5px; color: var(--muted); cursor: default; }
        .mk-nav-item.active { background: rgba(200,37,58,0.10); color: var(--accent); border-right: 2px solid var(--accent); font-weight: 600; }
        .mk-nav-icon { width: 13px; height: 13px; flex-shrink: 0; }
        /* main content */
        .mk-main { flex: 1; overflow: hidden; display: flex; flex-direction: column; min-width: 0; }
        .mk-topbar { padding: 12px 18px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; background: var(--surface); }
        .mk-page-title { font-size: 14px; font-weight: 700; color: var(--text); }
        .mk-btn { background: var(--accent); color: #fff; font-size: 10px; font-weight: 600; padding: 5px 12px; border-radius: 6px; letter-spacing: 0.06em; display: flex; align-items: center; gap: 4px; }
        .mk-content { padding: 14px 18px; overflow: hidden; flex: 1; background: var(--bg); }
        /* stat cards — gradiente+glow igual ao sistema real */
        .mk-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 14px; }
        .mk-stat { border-radius: 14px; border: 1px solid var(--border); overflow: hidden; position: relative; padding: 11px 13px; background: var(--surface); }
        .mk-stat-glow { position: absolute; bottom: -8px; right: -8px; width: 40px; height: 40px; border-radius: 50%; opacity: 0.22; filter: blur(10px); pointer-events: none; }
        .mk-stat-overlay { position: absolute; inset: 0; opacity: 0.07; pointer-events: none; }
        .mk-stat-eyebrow { font-size: 8px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); margin-bottom: 5px; }
        .mk-stat-val { font-size: 17px; font-weight: 800; font-variant-numeric: tabular-nums; line-height: 1; }
        /* table */
        .mk-table-wrap { border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
        .mk-table { width: 100%; border-collapse: collapse; font-size: 11px; }
        .mk-table th { background: var(--bg2); padding: 7px 12px; text-align: left; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); border-bottom: 1px solid var(--border); }
        .mk-table td { padding: 8px 12px; border-bottom: 1px solid var(--border); color: var(--text); }
        .mk-table tr:last-child td { border-bottom: none; }
        .mk-badge { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 10px; font-size: 9px; font-weight: 700; gap: 3px; }
        .mk-badge-pend { background: rgba(200,37,58,0.12); color: var(--accent); }
        .mk-badge-prog { background: rgba(234,179,8,0.15); color: #9a7200; }
        .mk-badge-done { background: rgba(34,197,94,0.12); color: var(--green); }
        @media (prefers-color-scheme: dark) {
          :root:not([data-theme="light"]) .mk-badge-prog { color: #EAB308; }
        }
        :root[data-theme="dark"] .mk-badge-prog { color: #EAB308; }

        /* TESTIMONIAL */
        .testimonial-section { max-width: 800px; margin: 0 auto; padding: 72px 24px; text-align: center; }
        .testimonial-section .promo-section-label { margin-bottom: 40px; }
        .testimonial-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 40px; text-align: left; position: relative; }
        .testimonial-quote { font-family: 'Playfair Display', serif; font-size: clamp(18px, 2.5vw, 22px); font-style: italic; color: var(--text); line-height: 1.6; margin-bottom: 28px; text-wrap: balance; }
        .testimonial-quote::before { content: '"'; font-size: 80px; color: var(--accent); opacity: 0.2; position: absolute; top: 8px; left: 28px; font-style: normal; line-height: 1; pointer-events: none; }
        .testimonial-author { display: flex; align-items: center; gap: 14px; }
        .testimonial-avatar { width: 64px; height: 64px; border-radius: 50%; object-fit: cover; flex-shrink: 0; border: 2px solid var(--border); }
        .testimonial-avatar-fallback { width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, var(--accent) 0%, #7A1524 100%); display: flex; align-items: center; justify-content: center; font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; color: #fff; flex-shrink: 0; }
        .testimonial-name { font-weight: 600; font-size: 15px; color: var(--text); }
        .testimonial-insta { font-size: 13px; color: var(--accent); margin-top: 1px; text-decoration: none; }
        .testimonial-insta:hover { text-decoration: underline; }
        .testimonial-loc { font-size: 12px; color: var(--muted); margin-top: 2px; }
        .testimonial-stars { display: flex; gap: 3px; margin-bottom: 4px; }

        /* GUARANTEE */
        .guarantee-bar { border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); background: var(--bg2); padding: 36px 24px; text-align: center; }
        .guarantee-inner { display: inline-flex; align-items: center; gap: 20px; max-width: 560px; text-align: left; }
        .guarantee-icon { width: 56px; height: 56px; flex-shrink: 0; background: rgba(26,138,60,0.12); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--green); }
        .guarantee-title { font-weight: 700; font-size: 16px; color: var(--text); margin-bottom: 4px; }
        .guarantee-desc { font-size: 13px; color: var(--muted); line-height: 1.5; }

        /* PRICING */
        .pricing-section { max-width: 800px; margin: 0 auto; padding: 72px 24px; text-align: center; }
        .pricing-section h2 { font-family: 'Playfair Display', serif; font-size: clamp(22px, 4vw, 32px); font-weight: 700; color: var(--text); margin-bottom: 8px; }
        .pricing-section > p { font-size: 14px; color: var(--muted); margin-bottom: 40px; }
        .pricing-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .pricing-card { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 32px 28px; text-align: left; position: relative; }
        .pricing-card.highlighted { border-color: var(--accent); border-width: 2px; }
        .pricing-tag { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: var(--accent); color: #fff; font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; padding: 3px 12px; border-radius: 20px; white-space: nowrap; }
        .pricing-label { font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); margin-bottom: 16px; }
        .pricing-price { font-family: 'Playfair Display', serif; font-size: 36px; font-weight: 900; color: var(--text); line-height: 1; }
        .pricing-price span { font-size: 15px; font-weight: 400; color: var(--muted); }
        .pricing-old { font-size: 14px; color: var(--muted); text-decoration: line-through; margin-top: 4px; }
        .pricing-saving { font-size: 13px; color: var(--green); font-weight: 600; margin-top: 4px; }
        .pricing-desc { font-size: 13px; color: var(--muted); margin-top: 12px; line-height: 1.5; }
        .pricing-divider { border: none; border-top: 1px solid var(--border); margin: 20px 0; }

        /* FAQ */
        .faq-section { max-width: 680px; margin: 0 auto; padding: 0 24px 72px; }
        .faq-item { border-bottom: 1px solid var(--border); }
        .faq-q { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 18px 0; background: none; border: none; cursor: pointer; text-align: left; font-size: 15px; font-weight: 500; color: var(--text); font-family: inherit; }
        .faq-q:hover { color: var(--accent); }
        .faq-a { font-size: 14px; color: var(--muted); line-height: 1.7; padding-bottom: 18px; }

        /* CTA */
        .promo-cta { text-align: center; padding: 0 24px 96px; max-width: 600px; margin: 0 auto; }
        .promo-cta-title { font-family: 'Playfair Display', serif; font-size: clamp(26px, 5vw, 38px); font-weight: 700; color: var(--text); text-wrap: balance; margin-bottom: 14px; }
        .promo-cta-sub { font-size: 15px; color: var(--muted); margin-bottom: 32px; line-height: 1.7; }
        .promo-coupon { display: inline-flex; align-items: center; gap: 12px; border: 1.5px dashed var(--accent); border-radius: 6px; padding: 14px 24px; margin-bottom: 28px; background: rgba(200,37,58,0.05); }
        .promo-coupon-label { font-size: 12px; color: var(--muted); letter-spacing: 0.06em; }
        .promo-coupon-code { font-size: 20px; font-weight: 700; color: var(--accent); letter-spacing: 0.12em; }
        .promo-wa-btn { display: inline-flex; align-items: center; gap: 10px; padding: 16px 32px; background: #25D366; color: #fff; border-radius: 4px; font-size: 14px; font-weight: 600; text-decoration: none; transition: background 0.2s; margin-top: 14px; }
        .promo-wa-btn:hover { background: #1EB757; }
        .promo-note { margin-top: 12px; font-size: 12px; color: var(--muted); }

        /* FOOTER */
        .promo-footer { border-top: 1px solid var(--border); padding: 28px 32px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
        .promo-footer-copy { font-size: 12px; color: var(--muted); }
        .promo-footer-links { display: flex; gap: 20px; }
        .promo-footer-links a { font-size: 12px; color: var(--muted); text-decoration: none; }
        .promo-footer-links a:hover { color: var(--text); }

        @media (max-width: 720px) {
          .promo-nav { padding: 14px 20px; }
          .promo-grid { grid-template-columns: 1fr; }
          .mk-stats { grid-template-columns: repeat(2, 1fr); }
          .mk-sidebar { display: none; }
          .mk-table th:nth-child(3), .mk-table td:nth-child(3),
          .mk-table th:nth-child(4), .mk-table td:nth-child(4) { display: none; }
          .pricing-cards { grid-template-columns: 1fr; }
          .guarantee-inner { flex-direction: column; text-align: center; }
          .promo-footer { flex-direction: column; align-items: center; text-align: center; }
          .countdown { gap: 5px; }
          .cd-cell { min-width: 44px; padding: 5px 8px; }
          .cd-num { font-size: 22px; }
          .testimonial-card { padding: 28px 20px; }
        }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
      `}</style>

      {/* NAV */}
      <nav className="promo-nav">
        <Link href="/" className="promo-nav-brand">Meu Atelier Sistema</Link>
        <span className="promo-badge">Oferta por tempo limitado</span>
      </nav>

      {/* URGENCY BAR */}
      <div className="urgency-bar">
        <p>⏰ Promoção encerra em</p>
        <Countdown />
      </div>

      {/* HERO */}
      <section className="promo-hero">
        <span className="promo-eyebrow">Promoção de lançamento</span>
        <div className="promo-disc-wrap">
          <span className="promo-disc-num">50</span>
          <span className="promo-disc-pct">%</span>
        </div>
        <h1 className="promo-h1">de desconto no primeiro mês do Plano Pro</h1>
        <p className="promo-detail">
          Gerencie seu ateliê com profissionalismo. <strong>Cancele quando quiser.</strong>
        </p>
        <div className="promo-price-row">
          <span className="promo-old">R$ 49,90</span>
          <span className="promo-new">R$ 24,95</span>
          <span className="promo-period">/1º mês</span>
        </div>
        <p className="promo-annual-hint">💡 Ou assine anual por R$ 498/ano e economize R$ 100</p>
        <Link href="/cadastro" className="promo-btn">Começar agora com 50% off</Link>
        <p className="promo-note">Sem cartão de crédito para começar · 7 dias de garantia</p>
      </section>

      <div className="promo-divider" />

      {/* FEATURES */}
      <section className="promo-feats-wrap">
        <p className="promo-section-label">Tudo que seu ateliê precisa</p>
        <div className="promo-grid">
          {features.map((f) => (
            <div key={f.title} className="promo-card">
              <svg className="promo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d={f.icon} />
              </svg>
              <h2 className="promo-feat-title">{f.title}</h2>
              <p className="promo-feat-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MOCKUP */}
      <section className="mockup-section">
        <h2>Veja como é simples de usar</h2>
        <p>Interface limpa, direto ao ponto — feita para quem trabalha com costura, não com tecnologia</p>
        <div className="mockup-chrome">
          {/* browser bar */}
          <div className="mockup-bar">
            <div className="mockup-dot" style={{ background: '#FF5F57' }} />
            <div className="mockup-dot" style={{ background: '#FEBC2E' }} />
            <div className="mockup-dot" style={{ background: '#28C840' }} />
            <div className="mockup-url">meuateliersistema.com.br/ordens-servico</div>
          </div>
          {/* app shell */}
          <div className="mk-shell">
            {/* sidebar */}
            <div className="mk-sidebar">
              <div className="mk-logo">
                <div className="mk-logo-text">Meu Atelier</div>
                <div className="mk-logo-sub">Plano Pro</div>
              </div>
              {[
                { label: 'Principal', items: [{ name: 'Dashboard', active: false }] },
                { label: 'Gestão', items: [
                  { name: 'Clientes', active: false },
                  { name: 'Serviços', active: false },
                  { name: 'Ordens de Serviço', active: true },
                ]},
                { label: 'Financeiro', items: [{ name: 'Financeiro', active: false }] },
              ].map(sec => (
                <div key={sec.label}>
                  <div className="mk-nav-section">{sec.label}</div>
                  {sec.items.map(item => (
                    <div key={item.name} className={`mk-nav-item${item.active ? ' active' : ''}`}>
                      <svg className="mk-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {item.name === 'Dashboard' && <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>}
                        {item.name === 'Clientes' && <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></>}
                        {item.name === 'Serviços' && <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5zM16 8L2 22M17.5 15H9"/>}
                        {item.name === 'Ordens de Serviço' && <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>}
                        {item.name === 'Financeiro' && <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>}
                      </svg>
                      {item.name}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            {/* main */}
            <div className="mk-main">
              <div className="mk-topbar">
                <div className="mk-page-title">Ordens de Serviço</div>
                <div className="mk-btn">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Nova OS
                </div>
              </div>
              <div className="mk-content">
                {/* stat cards com gradiente+glow igual ao sistema real */}
                <div className="mk-stats">
                  {[
                    { label: 'Pendentes', val: '8', color: '#EAB308', bg: 'rgba(234,179,8,0.08)' },
                    { label: 'Em Andamento', val: '5', color: '#3B82F6', bg: 'rgba(59,130,246,0.08)' },
                    { label: 'Concluídas', val: '38', color: '#22C55E', bg: 'rgba(34,197,94,0.08)' },
                    { label: 'Atrasadas', val: '2', color: '#C8253A', bg: 'rgba(200,37,58,0.08)' },
                  ].map(s => (
                    <div key={s.label} className="mk-stat" style={{ background: s.bg }}>
                      <div className="mk-stat-overlay" style={{ background: s.color }} />
                      <div className="mk-stat-glow" style={{ background: s.color }} />
                      <div className="mk-stat-eyebrow">{s.label}</div>
                      <div className="mk-stat-val" style={{ color: s.color }}>{s.val}</div>
                    </div>
                  ))}
                </div>
                {/* table */}
                <div className="mk-table-wrap">
                  <table className="mk-table">
                    <thead>
                      <tr><th>#</th><th>Cliente</th><th>Serviço</th><th>Entrega</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      <tr><td style={{color:'#fff'}}>#000042</td><td>Ana Souza</td><td>Vestido de noiva</td><td>20/08</td><td><span className="mk-badge mk-badge-prog">● Em andamento</span></td></tr>
                      <tr><td style={{color:'#fff'}}>#000041</td><td>Carla Mendes</td><td>Calça jeans — ajuste</td><td>18/08</td><td><span className="mk-badge mk-badge-pend">● Pendente</span></td></tr>
                      <tr><td style={{color:'#fff'}}>#000040</td><td>Joana Lima</td><td>Blusa bordada</td><td>15/08</td><td><span className="mk-badge mk-badge-done">● Concluída</span></td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="testimonial-section">
        <p className="promo-section-label">Quem já usa</p>
        <div className="testimonial-card">
          <div className="testimonial-stars">
            {[...Array(5)].map((_, i) => (
              <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#C8253A" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            ))}
          </div>
          <p className="testimonial-quote">
            Antes eu controlava tudo em caderno e muitas vezes esquecia de cobrar ou perdia o prazo de entrega. Com o sistema, tenho tudo organizado — clientes, pedidos, datas e valores. Agora consigo ver de cara o que está em aberto e o que já foi entregue. Não imagino trabalhar sem ele.
          </p>
          <div className="testimonial-author">
            <img
              src="/nete-fashion.jpg"
              alt="NETE Fashion Atelier"
              className="testimonial-avatar"
              onError={(e) => {
                const el = e.currentTarget
                el.style.display = 'none'
                const fb = el.nextElementSibling as HTMLElement | null
                if (fb) fb.style.display = 'flex'
              }}
            />
            <div className="testimonial-avatar-fallback" style={{ display: 'none' }}>N</div>
            <div>
              <div className="testimonial-name">NETE Fashion Atelier</div>
              <a
                href="https://www.instagram.com/netefashiion/"
                target="_blank"
                rel="noopener noreferrer"
                className="testimonial-insta"
              >@netefashiion</a>
              <div className="testimonial-loc">Vila Velha, ES</div>
            </div>
          </div>
        </div>
      </section>

      {/* GUARANTEE */}
      <div className="guarantee-bar">
        <div className="guarantee-inner">
          <div className="guarantee-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>
            </svg>
          </div>
          <div>
            <div className="guarantee-title">7 dias de garantia total</div>
            <div className="guarantee-desc">Se em 7 dias você não gostar, devolvemos o valor pago sem perguntas. Zero risco para você começar.</div>
          </div>
        </div>
      </div>

      {/* PRICING ANCHOR */}
      <section className="pricing-section">
        <h2>Escolha como quer assinar</h2>
        <p>Ambos incluem todas as funcionalidades do Plano Pro</p>
        <div className="pricing-cards">
          <div className="pricing-card highlighted">
            <div className="pricing-tag">🔥 Com cupom PROMO50</div>
            <div className="pricing-label">Mensal</div>
            <div className="pricing-price">R$ 24,95 <span>/1º mês</span></div>
            <div className="pricing-old">de R$ 49,90/mês</div>
            <div className="pricing-saving">Economize R$ 24,95 agora</div>
            <hr className="pricing-divider" />
            <div className="pricing-desc">Após o 1º mês, R$ 49,90/mês. Cancele quando quiser.</div>
          </div>
          <div className="pricing-card">
            <div className="pricing-label">Anual</div>
            <div className="pricing-price">R$ 498 <span>/ano</span></div>
            <div className="pricing-saving">Economize R$ 100 comparado ao mensal</div>
            <hr className="pricing-divider" />
            <div className="pricing-desc">Equivale a R$ 41,50/mês. Pagamento único anual.</div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq-section">
        <p className="promo-section-label" style={{ textAlign: 'center', marginBottom: 32 }}>Perguntas frequentes</p>
        {faqs.map((f) => <FaqItem key={f.q} q={f.q} a={f.a} />)}
      </section>

      {/* CTA FINAL */}
      <section className="promo-cta">
        <h2 className="promo-cta-title">Comece agora com 50% off</h2>
        <p className="promo-cta-sub">
          Use o cupom abaixo na assinatura do Plano Pro.
          Primeiro mês por <strong style={{ color: 'var(--text)' }}>R$ 24,95</strong>. Depois R$ 49,90/mês.
        </p>
        <div className="promo-coupon">
          <span className="promo-coupon-label">Cupom</span>
          <span className="promo-coupon-code">PROMO50</span>
        </div>
        <br />
        <Link href="/cadastro" className="promo-btn">Criar conta e usar cupom</Link>
        <br />
        <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="promo-wa-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
          </svg>
          Falar com suporte no WhatsApp
        </a>
        <p className="promo-note" style={{ marginTop: 14 }}>
          Desconto válido apenas na 1ª cobrança · Garantia de 7 dias
        </p>
      </section>

      {/* FOOTER */}
      <footer className="promo-footer">
        <p className="promo-footer-copy">© {new Date().getFullYear()} Meu Atelier Sistema · Eduardo Allochio</p>
        <div className="promo-footer-links">
          <Link href="/termos">Termos</Link>
          <Link href="/privacidade">Privacidade</Link>
          <a href="https://instagram.com/eduallochio" target="_blank" rel="noopener noreferrer">@eduallochio</a>
        </div>
      </footer>
    </>
  )
}
