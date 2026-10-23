'use client'

import { useRouter } from 'next/navigation'
import { CashierForm } from '@/components/financeiro/cashier-form'
import { CashierFrame } from '@/components/financeiro/finance-ui'
import { useCreateCashier } from '@/hooks/use-cashier'
import type { CashierInput } from '@/lib/validations/cashier'

export default function CadastroCaixaPage() {
  const router = useRouter()
  const createCashier = useCreateCashier()

  const handleSubmit = async (data: CashierInput) => {
    try {
      await createCashier.mutateAsync(data)
      router.push('/financeiro/caixa')
    } catch { /* o hook já mostra o erro */ }
  }

  return (
    <CashierFrame eyebrow="Novo caixa" title="Cadastrar caixa" desc="A gaveta do balcão, uma conta PIX ou outro lugar onde o dinheiro do ateliê entra e sai.">
      <CashierForm onSubmit={handleSubmit} isLoading={createCashier.isPending} />
    </CashierFrame>
  )
}
