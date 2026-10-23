import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata({
  path: '/confirmar-email',
  title: 'Confirme seu e-mail - Meu Atelier Sistema',
  description: 'Confirme o e-mail para entrar no Meu Atelier.',
  index: false,
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
