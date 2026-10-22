import type { Metadata } from 'next'
import { SITE_NAME, SITE_URL } from '@/lib/seo'

const TITLE = '2 meses pelo preço de 1 no Plano Pro — Meu Atelier Sistema'
const DESCRIPTION =
  'Cupom PROMO50: 2 meses do Plano Pro do Meu Atelier por R$ 49,90. Clientes, ordens de serviço, financeiro e estoque do seu ateliê em um só lugar.'
const OG = {
  url: `${SITE_URL}/og-promo.jpg`,
  width: 1200,
  height: 630,
  alt: '2 meses pelo preço de 1 no Plano Pro do Meu Atelier, com o cupom PROMO50',
}

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: '2 meses pelo preço de 1 — Meu Atelier Sistema',
    description: 'Use o cupom PROMO50 e ganhe 2 meses de Plano Pro pelo preço de 1. Gestão completa para ateliês de costura e artesanato.',
    url: `${SITE_URL}/promo`,
    siteName: SITE_NAME,
    type: 'website',
    locale: 'pt_BR',
    images: [OG],
  },
  twitter: {
    card: 'summary_large_image',
    title: '2 meses pelo preço de 1 — Meu Atelier Sistema',
    description: 'Use o cupom PROMO50 e ganhe 2 meses de Plano Pro pelo preço de 1.',
    images: [OG.url],
  },
  alternates: { canonical: '/promo' },
  // quando o prazo passa, a tela de oferta encerrada marca a página como noindex
  robots: { index: true, follow: true },
}

export default function PromoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
