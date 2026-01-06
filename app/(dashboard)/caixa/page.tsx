import { Header } from '@/components/layouts/header'

export default function CaixaPage() {
  return (
    <div>
      <Header 
        title="Caixa"
        description="Controle de fluxo de caixa"
      />
      <div className="p-4 sm:p-6 lg:p-8">
        <p className="text-gray-500">Módulo de caixa em desenvolvimento...</p>
      </div>
    </div>
  )
}
