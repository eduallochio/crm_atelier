'use client'

import { useParams, useRouter } from 'next/navigation'
import { Loader } from '@/components/ui/loader'
import { CashierForm } from '@/components/financeiro/cashier-form'
import { CashierFrame } from '@/components/financeiro/finance-ui'
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
    <CashierFrame eyebrow="Editar caixa" title={caixa?.nome || 'Caixa'} desc="Nome, descrição, chave PIX e se o caixa está ativo.">
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
    </CashierFrame>
  )
}
