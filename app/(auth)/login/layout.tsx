import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata({
  path: '/login',
  title: 'Entrar - Meu Atelier Sistema',
  description: 'Acesse o Meu Atelier e veja as ordens, clientes e o caixa do seu ateliê.',
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
