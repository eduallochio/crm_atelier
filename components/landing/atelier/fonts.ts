import { DM_Sans } from 'next/font/google'

/**
 * DM Sans da landing, servida pelo próprio site (next/font) em vez do @import
 * do Google: carrega antes, sem troca de fonte depois da pintura.
 * A Cormorant Garamond já vem do layout raiz (variável --font-cormorant).
 */
export const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-dm-sans',
  display: 'swap',
})
