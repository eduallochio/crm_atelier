'use client'

import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Header } from '@/components/layouts/header'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/ui/loader'
import { CashierForm } from '@/components/financeiro/cashier-form'
import { useCashier, useUpdateCashier } from '@/hooks/use-cashier'
import type { CashierInput } from '@/lib/validations/cashier'

export default function EditarCaixaPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const { data: caixa, isLoading } = useCashier(id)
  const updateCashier = useUpdateCashier()

  const handleSubmit = async (data: CashierInput) => {
    await updateCashier.mutateAsync({ id, input: data })
    router.push('/financeiro/caixa')
  }

  return (
    <div>
      <Header
        title="Editar Caixa"
        description="Alterar dados do caixa"
        action={
          <Button variant="outline" onClick={() => router.push('/financeiro/caixa')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        }
      />

      <div className="p-6">
        <div className="max-w-2xl">
          {isLoading ? (
            <Loader text="Carregando caixa..." />
          ) : caixa ? (
            <CashierForm
              initialData={{ nome: caixa.nome, descricao: caixa.descricao || '', chave_pix: caixa.chave_pix || '', ativo: caixa.ativo }}
              onSubmit={handleSubmit}
              isLoading={updateCashier.isPending}
            />
          ) : (
            <p className="text-muted-foreground">Caixa não encontrado.</p>
          )}
        </div>
      </div>
    </div>
  )
}
