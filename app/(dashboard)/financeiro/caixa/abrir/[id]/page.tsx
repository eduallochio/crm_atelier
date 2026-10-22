'use client'

import { useParams, useRouter } from 'next/navigation'
import { Loader } from '@/components/ui/loader'
import { OpenCashierForm } from '@/components/financeiro/open-cashier-form'
import { CashierFrame } from '@/components/financeiro/finance-ui'
import { useCashier, useOpenCashier } from '@/hooks/use-cashier'

type OpenCashierData = {
  saldo_inicial: number
  observacoes?: string
}

export default function AbrirCaixaPage() {
  const router = useRouter()
  const caixaId = useParams().id as string
  const { data: caixa, isLoading } = useCashier(caixaId)
  const openCashier = useOpenCashier()

  const handleSubmit = async (data: OpenCashierData) => {
    try {
      const sessao = await openCashier.mutateAsync({ ...data, caixa_id: caixaId, status: 'aberto' as const })
      router.push(`/financeiro/caixa/sessao/${sessao.id}`)
    } catch { /* o hook já mostra o erro */ }
  }

  return (
    <CashierFrame eyebrow="Abrir caixa" title={caixa ? `Abrir ${caixa.nome}` : 'Abrir caixa'} desc="Conte o dinheiro que já está na gaveta: é o saldo inicial do dia.">
      {isLoading ? (
        <Loader text="Carregando..." />
      ) : caixa ? (
        <OpenCashierForm
          caixa={{ id: caixa.id || '', nome: caixa.nome, descricao: caixa.descricao, ativo: caixa.ativo }}
          onSubmit={handleSubmit}
          isLoading={openCashier.isPending}
        />
      ) : (
        <p className="text-muted-foreground">Caixa não encontrado.</p>
      )}
    </CashierFrame>
  )
}
