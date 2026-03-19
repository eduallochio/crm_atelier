'use client'

import { useQuery } from '@tanstack/react-query'

interface FluxoCaixaItem {
  mes: string
  mesCompleto: string
  entradas: number
  saidas: number
  saldo: number
}

interface FinancialStats {
  saldoAtual: number
  saldoMes: number
  entradasMes: number
  saidasMes: number
  totalAReceber: number
  totalAPagar: number
  receitasAtrasadas: number
  despesasAtrasadas: number
  recebiveisVencendo: number
  pagaveisVencendo: number
  fluxoCaixa: FluxoCaixaItem[]
  [key: string]: unknown
}

export function useFinancialStats(period: string = 'thisMonth') {
  return useQuery<FinancialStats>({
    queryKey: ['financial-stats', period],
    queryFn: async () => {
      const res = await fetch(`/api/financial/stats?period=${period}`)
      if (!res.ok) throw new Error('Erro ao buscar estatísticas financeiras')
      return res.json()
    },
  })
}

export function useCashFlow() {
  return useQuery({
    queryKey: ['cash-flow'],
    queryFn: async () => {
      const res = await fetch(`/api/financial/stats`)
      if (!res.ok) throw new Error('Erro ao buscar fluxo de caixa')
      const data = await res.json()
      return data.fluxoCaixa as Array<{
        mes: string
        mesCompleto: string
        entradas: number
        saidas: number
        saldo: number
      }>
    },
  })
}

export function useExpensesByCategory() {
  return useQuery({
    queryKey: ['expenses-by-category'],
    queryFn: async () => {
      const res = await fetch('/api/financial/stats')
      if (!res.ok) throw new Error('Erro ao buscar despesas por categoria')
      const data = await res.json()
      return data.despesasPorCategoria as Array<{ nome: string; cor: string; total: number }>
    },
  })
}
