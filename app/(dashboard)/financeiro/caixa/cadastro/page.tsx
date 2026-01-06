'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Header } from '@/components/layouts/header'
import { Button } from '@/components/ui/button'
import { CashierForm } from '@/components/financeiro/cashier-form'
import { useCreateCashier } from '@/hooks/use-cashier'
import { toast } from 'sonner'

export default function CadastroCaixaPage() {
  const router = useRouter()
  const createCashier = useCreateCashier()

  const handleSubmit = async (data: any) => {
    try {
      await createCashier.mutateAsync(data)
      router.push('/financeiro/caixa')
    } catch (error) {
      console.error('Erro ao criar caixa:', error)
    }
  }

  return (
    <div>
      <Header 
        title="Novo Caixa"
        description="Cadastrar novo caixa/PDV"
        action={
          <Button variant="outline" onClick={() => router.push('/financeiro/caixa')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        }
      />

      <div className="p-6">
        <div className="max-w-2xl">
          <CashierForm onSubmit={handleSubmit} isLoading={createCashier.isPending} />
        </div>
      </div>
    </div>
  )
}
