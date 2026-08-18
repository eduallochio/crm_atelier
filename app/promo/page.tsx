import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '50% de Desconto no Plano Pro — Meu Atelier Sistema',
  description:
    '50% de desconto no primeiro mês do Plano Pro do Meu Atelier Sistema. Gerencie clientes, ordens de serviço, financeiro e estoque do seu ateliê em um só lugar.',
  openGraph: {
    title: '50% Off no Plano Pro — Meu Atelier Sistema',
    description:
      'Assine o Plano Pro com 50% de desconto no primeiro mês. Gestão completa para ateliês de costura e artesanato.',
    url: 'https://meuateliersistema.com.br/promo',
    type: 'website',
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
    title: '50% Off — Meu Atelier Sistema',
  },
  alternates: {
    canonical: 'https://meuateliersistema.com.br/promo',
  },
  robots: { index: true, follow: true },
}

const WA_LINK = 'https://wa.me/5527998714453?text=Ol%C3%A1%2C%20vim%20pela%20promo%C3%A7%C3%A3o%20de%2050%25%20do%20Meu%20Atelier%20Sistema%20e%20gostaria%20de%20saber%20mais!'

const features = [
  {
    title: 'Gestão de Clientes',
    desc: 'Cadastro completo com histórico de pedidos, endereço, telefone e anotações. Busca rápida e filtros por categoria.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    title: 'Ordens de Serviço',
    desc: 'Crie e acompanhe cada pedido com status, prazo de entrega, materiais e fotos. Histórico completo por cliente.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
  {
    title: 'Controle Financeiro',
    desc: 'Caixa diário, contas a pagar e receber, fluxo de caixa e relatórios. Saiba exatamente quanto seu ateliê fatura.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
  },
  {
    title: 'Estoque de Materiais',
    desc: 'Controle entradas e saídas de tecidos, linhas e aviamentos. Alertas de estoque mínimo para nunca faltar material.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
      </svg>
    ),
  },
  {
    title: 'Dashboard e Relatórios',
    desc: 'Visão geral do negócio com gráficos de faturamento, serviços mais vendidos e métricas de crescimento.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  {
    title: 'Catálogo de Serviços',
    desc: 'Monte sua tabela de preços com categorias, tempo estimado e custo de produção. Gere orçamentos em segundos.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
]

export default function PromoPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Offer',
    name: 'Plano Pro — 50% de desconto no primeiro mês',
    description: 'Sistema de gestão completo para ateliês de costura e artesanato.',
    url: 'https://meuateliersistema.com.br/promo',
    priceCurrency: 'BRL',
    price: '24.95',
    priceValidUntil: '2026-12-31',
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
        }
        @media (prefers-color-scheme: dark) {
          :root:not([data-theme="light"]) {
            --bg: #0D0A0A; --bg2: #161110; --surface: #1F1818;
            --text: #F5F0EE; --muted: #8A7F7E; --border: rgba(245,240,238,0.08);
          }
        }
        :root[data-theme="dark"] {
          --bg: #0D0A0A; --bg2: #161110; --surface: #1F1818;
          --text: #F5F0EE; --muted: #8A7F7E; --border: rgba(245,240,238,0.08);
        }
        body { font-family: 'DM Sans', sans-serif; background: var(--bg); color: var(--text); -webkit-font-smoothing: antialiased; }
        .promo-nav { display: flex; align-items: center; justify-content: space-between; padding: 18px 32px; border-bottom: 1px solid var(--border); background: var(--bg); position: sticky; top: 0; z-index: 10; }
        .promo-nav-brand { font-family: 'Playfair Display', serif; font-size: 17px; font-style: italic; color: var(--text); text-decoration: none; }
        .promo-badge { font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; background: var(--accent); color: #fff; padding: 4px 10px; border-radius: 20px; }
        .promo-hero { text-align: center; padding: 80px 24px 64px; max-width: 720px; margin: 0 auto; }
        .promo-eyebrow { display: inline-block; font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: var(--accent); margin-bottom: 28px; padding: 6px 16px; border: 1px solid rgba(200,37,58,0.3); border-radius: 20px; }
        .promo-disc-wrap { display: flex; align-items: center; justify-content: center; line-height: 1; margin-bottom: 16px; }
        .promo-disc-num { font-family: 'Playfair Display', serif; font-size: clamp(110px, 22vw, 180px); font-weight: 900; color: var(--accent); letter-spacing: -0.04em; line-height: 0.9; }
        .promo-disc-pct { font-family: 'Playfair Display', serif; font-size: clamp(48px, 10vw, 80px); font-weight: 700; color: var(--accent); align-self: flex-start; padding-top: clamp(20px, 4vw, 36px); }
        .promo-h1 { font-family: 'Playfair Display', serif; font-size: clamp(22px, 4vw, 32px); font-weight: 400; font-style: italic; color: var(--text); text-wrap: balance; margin-bottom: 12px; }
        .promo-detail { font-size: 15px; color: var(--muted); margin-bottom: 40px; }
        .promo-price-row { display: flex; align-items: baseline; justify-content: center; gap: 12px; margin-bottom: 36px; }
        .promo-old { font-size: 20px; color: var(--muted); text-decoration: line-through; }
        .promo-new { font-family: 'Playfair Display', serif; font-size: 42px; font-weight: 700; color: var(--accent); }
        .promo-period { font-size: 14px; color: var(--muted); }
        .promo-btn { display: inline-block; padding: 18px 48px; background: var(--accent); color: #fff; border-radius: 4px; font-size: 14px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; text-decoration: none; transition: background 0.2s; }
        .promo-btn:hover { background: var(--accent2); }
        .promo-note { margin-top: 14px; font-size: 12px; color: var(--muted); }
        .promo-divider { width: 40px; height: 2px; background: var(--accent); margin: 0 auto 64px; opacity: 0.3; }
        .promo-feats-wrap { max-width: 960px; margin: 0 auto; padding: 0 24px 80px; }
        .promo-section-label { text-align: center; font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted); margin-bottom: 48px; }
        .promo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; background: var(--border); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
        .promo-card { background: var(--surface); padding: 32px 28px; transition: background 0.15s; }
        .promo-card:hover { background: var(--bg2); }
        .promo-icon { width: 40px; height: 40px; margin-bottom: 20px; color: var(--accent); }
        .promo-feat-title { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; color: var(--text); margin-bottom: 10px; }
        .promo-feat-desc { font-size: 14px; color: var(--muted); line-height: 1.65; }
        .promo-proof { background: var(--bg2); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 64px 24px; text-align: center; margin-bottom: 80px; }
        .promo-proof-h { font-family: 'Playfair Display', serif; font-size: clamp(28px, 5vw, 44px); font-weight: 700; font-style: italic; color: var(--text); text-wrap: balance; max-width: 640px; margin: 0 auto 24px; }
        .promo-proof-h em { color: var(--accent); font-style: normal; }
        .promo-stats { display: flex; justify-content: center; gap: 64px; flex-wrap: wrap; margin-top: 40px; }
        .promo-stat-num { font-family: 'Playfair Display', serif; font-size: 40px; font-weight: 900; color: var(--text); display: block; line-height: 1; margin-bottom: 6px; }
        .promo-stat-label { font-size: 13px; color: var(--muted); }
        .promo-cta { text-align: center; padding: 0 24px 96px; max-width: 600px; margin: 0 auto; }
        .promo-cta-title { font-family: 'Playfair Display', serif; font-size: clamp(28px, 5vw, 40px); font-weight: 700; color: var(--text); text-wrap: balance; margin-bottom: 16px; }
        .promo-cta-sub { font-size: 15px; color: var(--muted); margin-bottom: 36px; line-height: 1.7; }
        .promo-coupon { display: inline-flex; align-items: center; gap: 12px; border: 1.5px dashed var(--accent); border-radius: 6px; padding: 14px 24px; margin-bottom: 32px; background: rgba(200,37,58,0.05); }
        .promo-coupon-label { font-size: 12px; color: var(--muted); letter-spacing: 0.06em; }
        .promo-coupon-code { font-size: 20px; font-weight: 700; color: var(--accent); letter-spacing: 0.12em; }
        .promo-wa-btn { display: inline-flex; align-items: center; gap: 10px; padding: 16px 32px; background: #25D366; color: #fff; border-radius: 4px; font-size: 14px; font-weight: 600; text-decoration: none; transition: background 0.2s; margin-top: 16px; }
        .promo-wa-btn:hover { background: #1EB757; }
        .promo-footer { border-top: 1px solid var(--border); padding: 28px 32px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
        .promo-footer-copy { font-size: 12px; color: var(--muted); }
        .promo-footer-links { display: flex; gap: 20px; }
        .promo-footer-links a { font-size: 12px; color: var(--muted); text-decoration: none; }
        .promo-footer-links a:hover { color: var(--text); }
        @media (max-width: 720px) {
          .promo-nav { padding: 14px 20px; }
          .promo-grid { grid-template-columns: 1fr; }
          .promo-stats { gap: 36px; }
          .promo-footer { flex-direction: column; align-items: center; text-align: center; }
        }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
      `}</style>

      {/* NAV */}
      <nav className="promo-nav">
        <Link href="/" className="promo-nav-brand">Meu Atelier Sistema</Link>
        <span className="promo-badge">Oferta por tempo limitado</span>
      </nav>

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
        <Link href="/cadastro" className="promo-btn">Começar agora</Link>
        <p className="promo-note">Sem cartão de crédito para começar · Plano gratuito disponível</p>
      </section>

      <div className="promo-divider" />

      {/* FEATURES */}
      <section className="promo-feats-wrap">
        <p className="promo-section-label">Tudo que seu ateliê precisa</p>
        <div className="promo-grid">
          {features.map((f) => (
            <div key={f.title} className="promo-card">
              <div className="promo-icon">{f.icon}</div>
              <h2 className="promo-feat-title">{f.title}</h2>
              <p className="promo-feat-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PROOF */}
      <section className="promo-proof">
        <p className="promo-proof-h">
          Tudo em um só lugar — do pedido ao <em>acabamento</em>
        </p>
        <p style={{ fontSize: 15, color: 'var(--muted)', maxWidth: 520, margin: '0 auto' }}>
          Chega de cadernos, planilhas e anotações espalhadas. O Meu Atelier Sistema centraliza toda a gestão do seu negócio, para você focar no que faz de melhor.
        </p>
        <div className="promo-stats">
          {[
            { num: 'Ilimitado', label: 'clientes cadastrados' },
            { num: '3', label: 'usuários por conta' },
            { num: '100%', label: 'na nuvem · acesse de qualquer lugar' },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <span className="promo-stat-num">{s.num}</span>
              <span className="promo-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="promo-cta">
        <h2 className="promo-cta-title">Use o cupom e comece hoje</h2>
        <p className="promo-cta-sub">
          Plano Pro por <strong style={{ color: 'var(--text)' }}>R$ 24,95</strong> no primeiro mês.
          Após isso, <strong style={{ color: 'var(--text)' }}>R$ 49,90/mês</strong> — cancele quando quiser, sem fidelidade.
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
        <p className="promo-note" style={{ marginTop: 16 }}>
          Desconto válido apenas na 1ª cobrança
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
