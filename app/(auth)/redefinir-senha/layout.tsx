import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata({
  path: '/redefinir-senha',
  title: 'Nova senha - Meu Atelier Sistema',
  description: 'Crie uma nova senha para a sua conta.',
  index: false,
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
