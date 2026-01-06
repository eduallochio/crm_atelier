import { Header } from '@/components/layouts/header'

export default function FinanceiroPage() {
  return (
    <div>
      <Header 
        title="Financeiro"
        description="Controle financeiro do ateliê"
      />
      <div className="p-4 sm:p-6 lg:p-8">
        <p className="text-gray-500">Módulo financeiro em desenvolvimento...</p>
      </div>
    </div>
  )
}
