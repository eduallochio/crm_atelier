import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata({
  path: '/cadastro',
  title: 'Criar conta grátis - Meu Atelier Sistema',
  description: 'Crie a conta do seu ateliê em menos de 2 minutos. Plano grátis para começar, sem cartão de crédito.',
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
