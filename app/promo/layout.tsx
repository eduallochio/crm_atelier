import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '2 Meses pelo Preço de 1 no Plano Pro — Meu Atelier Sistema',
  description:
    '2 meses pelo preço de 1 no Plano Pro do Meu Atelier Sistema. Gerencie clientes, ordens de serviço, financeiro e estoque do seu ateliê em um só lugar.',
  openGraph: {
    title: '2 Meses pelo Preço de 1 — Meu Atelier Sistema',
    description:
      'Use o cupom PROMO50 e ganhe 2 meses de Plano Pro pelo preço de 1. Gestão completa para ateliês de costura e artesanato.',
    url: 'https://meuateliersistema.com.br/promo',
    type: 'website',
    locale: 'pt_BR',
    images: [
      {
        url: 'https://meuateliersistema.com.br/og-promo.png',
        width: 1200,
        height: 630,
        alt: '2 meses pelo preço de 1 no Plano Pro — Meu Atelier Sistema',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '2 Meses pelo Preço de 1 — Meu Atelier Sistema',
    images: ['https://meuateliersistema.com.br/og-promo.png'],
  },
  alternates: {
    canonical: 'https://meuateliersistema.com.br/promo',
  },
  robots: { index: true, follow: true },
}

export default function PromoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
