import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata({
  path: '/esqueci-senha',
  title: 'Recuperar senha - Meu Atelier Sistema',
  description: 'Receba um link por e-mail para criar uma nova senha.',
  index: false,
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
