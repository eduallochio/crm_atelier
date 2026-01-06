'use client'

import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Header } from '@/components/layouts/header'
import { Button } from '@/components/ui/button'
import { OpenCashierForm } from '@/components/financeiro/open-cashier-form'
import { useCashier, useOpenCashier } from '@/hooks/use-cashier'

type OpenCashierData = {
  saldo_inicial: number
  observacoes?: string
}

export default function AbrirCaixaPage() {
  const router = useRouter()
  const params = useParams()
  const caixaId = params.id as string
  
  const { data: caixa, isLoading } = useCashier(caixaId)
  const openCashier = useOpenCashier()

  const handleSubmit = async (data: OpenCashierData) => {
    try {
      const sessao = await openCashier.mutateAsync({
        ...data,
        caixa_id: caixaId,
        status: 'aberto' as const,
      })
      router.push(`/financeiro/caixa/sessao/${sessao.id}`)
    } catch (error) {
      console.error('Erro ao abrir caixa:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
          <p className="mt-4 text-gray-500">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!caixa) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Caixa não encontrado</p>
          <Button onClick={() => router.push('/financeiro/caixa')}>
            Voltar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Header 
        title={`Abrir ${caixa.nome}`}
        description="Iniciar nova sessão de caixa"
        action={
          <Button variant="outline" onClick={() => router.push('/financeiro/caixa')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        }
      />

      <div className="p-6">
        <div className="max-w-2xl">
          <OpenCashierForm 
            caixa={{
              id: caixa.id || '',
              nome: caixa.nome,
              descricao: caixa.descricao,
              ativo: caixa.ativo,
            }}
            onSubmit={handleSubmit} 
            isLoading={openCashier.isPending} 
          />
        </div>
      </div>
    </div>
  )
}
