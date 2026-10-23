import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // área logada, painel e API não têm o que indexar
        disallow: [
          '/api/', '/admin', '/auth/', '/dashboard', '/clientes', '/servicos', '/ordens-servico',
          '/financeiro', '/estoque', '/fornecedores', '/configuracoes', '/profile', '/meus-dados', '/ajuda',
          '/esqueci-senha', '/redefinir-senha', '/confirmar-email', '/manutencao',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
