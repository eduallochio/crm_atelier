import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-linear-to-b from-blue-50 to-white p-4">
      <div className="w-full max-w-2xl text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900">
            CRM Atelier
          </h1>
          <p className="text-xl text-gray-600">
            Sistema completo de gestão para ateliês de costura e artesanato
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/cadastro">
            <Button size="lg" className="w-full sm:w-auto">
              Começar Gratuitamente
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Fazer Login
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16">
          <div className="p-6 bg-white rounded-lg shadow-sm border">
            <h3 className="font-semibold text-lg mb-2">✂️ Ordens de Serviço</h3>
            <p className="text-gray-600 text-sm">
              Gerencie todos os trabalhos do seu ateliê em um só lugar
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm border">
            <h3 className="font-semibold text-lg mb-2">👥 Clientes</h3>
            <p className="text-gray-600 text-sm">
              Cadastro completo com histórico de serviços
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm border">
            <h3 className="font-semibold text-lg mb-2">💰 Financeiro</h3>
            <p className="text-gray-600 text-sm">
              Controle financeiro e fluxo de caixa integrado
            </p>
          </div>
        </div>

        <div className="pt-8 text-sm text-gray-500">
          <p>Plano gratuito: até 50 clientes • Sem cartão de crédito</p>
        </div>
      </div>
    </div>
  )
}
