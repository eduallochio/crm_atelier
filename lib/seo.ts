import type { Metadata } from 'next'

export const SITE_URL = 'https://meuateliersistema.com.br'
export const SITE_NAME = 'Meu Atelier'
const OG_IMAGE = { url: '/og-image.png', width: 1200, height: 630, alt: 'Meu Atelier — sistema de gestão para ateliês de costura' }

/**
 * Metadados de uma página pública com o endereço canônico dela.
 * Sem isso a página herda o canônico "/" do layout raiz e o Google
 * a trata como cópia da página inicial.
 */
export function pageMetadata({ path, title, description, index = true }: {
  path: string
  title: string
  description: string
  index?: boolean
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: `${SITE_URL}${path}`, siteName: SITE_NAME, locale: 'pt_BR', type: 'website', images: [OG_IMAGE] },
    twitter: { card: 'summary_large_image', title, description, images: [OG_IMAGE.url] },
    robots: index ? { index: true, follow: true } : { index: false, follow: true },
  }
}
