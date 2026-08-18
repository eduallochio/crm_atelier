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

export default function PromoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
