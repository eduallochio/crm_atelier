import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

// área logada, painel e API não têm o que indexar
const DISALLOW = [
  '/api/', '/admin', '/auth/', '/dashboard', '/clientes', '/servicos', '/ordens-servico',
  '/financeiro', '/estoque', '/fornecedores', '/configuracoes', '/profile', '/meus-dados', '/ajuda',
  '/esqueci-senha', '/redefinir-senha', '/confirmar-email', '/manutencao',
]

// Bots de agentes de IA que buscam/citam o site em respostas (não só
// treinamento) — liberados explicitamente além do `*` genérico, para
// sinalizar intenção clara de ser encontrado por buscas feitas dentro de
// assistentes de IA, a mesma origem de tráfego vista em /admin/analytics
const AI_USER_AGENTS = [
  'GPTBot', 'ChatGPT-User', 'OAI-SearchBot', // OpenAI
  'ClaudeBot', 'Claude-User', 'Claude-SearchBot', // Anthropic
  'PerplexityBot', 'Perplexity-User', // Perplexity
  'Google-Extended', // Gemini/Google AI
  'Bingbot', // Copilot usa o índice do Bing
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: DISALLOW,
      },
      ...AI_USER_AGENTS.map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow: DISALLOW,
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
