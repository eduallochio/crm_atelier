import { DM_Sans } from 'next/font/google'

/**
 * DM Sans da landing, servida pelo próprio site (next/font) em vez do @import
 * do Google: carrega antes, sem troca de fonte depois da pintura.
 * A Cormorant Garamond já vem do layout raiz (variável --font-cormorant).
 */
export const dmSans = DM_Sans({
  subsets: ['latin'],
  // Apenas os pesos realmente usados na landing (400 texto, 500 destaques) —
  // Turbopack no Next.js 16.1 quebra o build com múltiplos weights numa
  // única declaração next/font/google (mesmo bug contornado para a
  // Cormorant Garamond em app/layout.tsx)
  weight: ['400', '500'],
  variable: '--font-dm-sans',
  display: 'swap',
})
// nudge para invalidar cache de build da Vercel com módulo de fonte Turbopack obsoleto
