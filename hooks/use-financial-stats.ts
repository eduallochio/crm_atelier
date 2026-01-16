'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Receivable, Payable, Transaction } from '@/lib/validations/financial'

const supabase = createClient()

export function useFinancialStats() {
  return useQuery({
    queryKey: ['financial-stats'],
    queryFn: async () => {
      // Buscar todas as contas a receber
      const { data: receivables } = await supabase
        .from('org_receivables')
        .select('*')

      // Buscar todas as contas a pagar
      const { data: payables } = await supabase
        .from('org_payables')
        .select('*')

      // Buscar todas as transações
      const { data: transactions } = await supabase
        .from('org_transactions')
        .select('*')

      // Calcular receitas
      const totalRecebido = (receivables as Receivable[])
        ?.filter(r => r.status === 'recebido')
        .reduce((sum, r) => sum + r.valor, 0) || 0

      const totalAReceber = (receivables as Receivable[])
        ?.filter(r => r.status === 'pendente')
        .reduce((sum, r) => sum + r.valor, 0) || 0

      const receitasAtrasadas = (receivables as Receivable[])
        ?.filter(r => r.status === 'atrasado')
        .reduce((sum, r) => sum + r.valor, 0) || 0

      // Calcular despesas
      const totalPago = (payables as Payable[])
        ?.filter(p => p.status === 'pago')
        .reduce((sum, p) => sum + p.valor, 0) || 0

      const totalAPagar = (payables as Payable[])
        ?.filter(p => p.status === 'pendente')
        .reduce((sum, p) => sum + p.valor, 0) || 0

      const despesasAtrasadas = (payables as Payable[])
        ?.filter(p => p.status === 'atrasado')
        .reduce((sum, p) => sum + p.valor, 0) || 0

      // Calcular saldo (receitas - despesas)
      const saldoAtual = totalRecebido - totalPago
      const saldoProjetado = (totalRecebido + totalAReceber) - (totalPago + totalAPagar)

      // Transações do mês atual
      const dataAtual = new Date()
      const primeiroDiaMes = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1)
      const ultimoDiaMes = new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 0)

      const transacoesMesAtual = (transactions as Transaction[])?.filter(t => {
        const dataTransacao = new Date(t.data_transacao)
        return dataTransacao >= primeiroDiaMes && dataTransacao <= ultimoDiaMes
      })

      // Receivables recebidos no mês (ordens concluídas e pagas)
      const receivablesMes = (receivables as Receivable[])?.filter(r => {
        if (r.status !== 'recebido' || !r.data_recebimento) return false
        const dataRecebimento = new Date(r.data_recebimento)
        return dataRecebimento >= primeiroDiaMes && dataRecebimento <= ultimoDiaMes
      })

      // Payables pagos no mês
      const payablesMes = (payables as Payable[])?.filter(p => {
        if (p.status !== 'pago' || !p.data_pagamento) return false
        const dataPagamento = new Date(p.data_pagamento)
        return dataPagamento >= primeiroDiaMes && dataPagamento <= ultimoDiaMes
      })

      const entradasMes = (transacoesMesAtual
        ?.filter(t => t.tipo === 'entrada')
        .reduce((sum, t) => sum + t.valor, 0) || 0) +
        (receivablesMes?.reduce((sum, r) => sum + r.valor, 0) || 0)

      const saidasMes = (transacoesMesAtual
        ?.filter(t => t.tipo === 'saida')
        .reduce((sum, t) => sum + t.valor, 0) || 0) +
        (payablesMes?.reduce((sum, p) => sum + p.valor, 0) || 0)

      const saldoMes = entradasMes - saidasMes

      // Contas vencendo nos próximos 7 dias
      const hoje = new Date()
      const daquiA7Dias = new Date()
      daquiA7Dias.setDate(hoje.getDate() + 7)

      const recebiveisVencendo = (receivables as Receivable[])
        ?.filter(r => {
          if (r.status !== 'pendente') return false
          const dataVenc = new Date(r.data_vencimento)
          return dataVenc >= hoje && dataVenc <= daquiA7Dias
        }).length || 0

      const pagaveisVencendo = (payables as Payable[])
        ?.filter(p => {
          if (p.status !== 'pendente') return false
          const dataVenc = new Date(p.data_vencimento)
          return dataVenc >= hoje && dataVenc <= daquiA7Dias
        }).length || 0

      // Fluxo de caixa dos últimos 6 meses
      const fluxoCaixa = []
      for (let i = 5; i >= 0; i--) {
        const data = new Date()
        data.setMonth(data.getMonth() - i)
        const mes = data.toLocaleString('pt-BR', { month: 'short', year: 'numeric' })
        
        const primeirodia = new Date(data.getFullYear(), data.getMonth(), 1)
        const ultimoDia = new Date(data.getFullYear(), data.getMonth() + 1, 0)

        const transacoesMes = (transactions as Transaction[])?.filter(t => {
          const dataTransacao = new Date(t.data_transacao)
          return dataTransacao >= primeirodia && dataTransacao <= ultimoDia
        })

        // Receivables recebidos no mês
        const receivablesMesFluxo = (receivables as Receivable[])?.filter(r => {
          if (r.status !== 'recebido' || !r.data_recebimento) return false
          const dataRecebimento = new Date(r.data_recebimento)
          return dataRecebimento >= primeirodia && dataRecebimento <= ultimoDia
        })

        // Payables pagos no mês
        const payablesMesFluxo = (payables as Payable[])?.filter(p => {
          if (p.status !== 'pago' || !p.data_pagamento) return false
          const dataPagamento = new Date(p.data_pagamento)
          return dataPagamento >= primeirodia && dataPagamento <= ultimoDia
        })

        const entradas = (transacoesMes
          ?.filter(t => t.tipo === 'entrada')
          .reduce((sum, t) => sum + t.valor, 0) || 0) +
          (receivablesMesFluxo?.reduce((sum, r) => sum + r.valor, 0) || 0)

        const saidas = (transacoesMes
          ?.filter(t => t.tipo === 'saida')
          .reduce((sum, t) => sum + t.valor, 0) || 0) +
          (payablesMesFluxo?.reduce((sum, p) => sum + p.valor, 0) || 0)

        fluxoCaixa.push({
          mes,
          entradas,
          saidas,
          saldo: entradas - saidas,
        })
      }

      return {
        // Receitas
        totalRecebido,
        totalAReceber,
        receitasAtrasadas,

        // Despesas
        totalPago,
        totalAPagar,
        despesasAtrasadas,

        // Saldos
        saldoAtual,
        saldoProjetado,

        // Mês atual
        entradasMes,
        saidasMes,
        saldoMes,

        // Alertas
        recebiveisVencendo,
        pagaveisVencendo,

        // Fluxo de caixa
        fluxoCaixa,
      }
    },
  })
}

export function useCashFlow(months: number = 6) {
  return useQuery({
    queryKey: ['cash-flow', months],
    queryFn: async () => {
      const { data: transactions } = await supabase
        .from('org_transactions')
        .select('*')
        .order('data_transacao', { ascending: true })

      const { data: receivables } = await supabase
        .from('org_receivables')
        .select('*')

      const { data: payables } = await supabase
        .from('org_payables')
        .select('*')

      const fluxoCaixa = []
      
      for (let i = months - 1; i >= 0; i--) {
        const data = new Date()
        data.setMonth(data.getMonth() - i)
        
        const primeirodia = new Date(data.getFullYear(), data.getMonth(), 1)
        const ultimoDia = new Date(data.getFullYear(), data.getMonth() + 1, 0)

        const transacoesMes = (transactions as Transaction[])?.filter(t => {
          const dataTransacao = new Date(t.data_transacao)
          return dataTransacao >= primeirodia && dataTransacao <= ultimoDia
        })

        // Receivables recebidos no mês
        const receivablesMes = (receivables as Receivable[])?.filter(r => {
          if (r.status !== 'recebido' || !r.data_recebimento) return false
          const dataRecebimento = new Date(r.data_recebimento)
          return dataRecebimento >= primeirodia && dataRecebimento <= ultimoDia
        })

        // Payables pagos no mês
        const payablesMes = (payables as Payable[])?.filter(p => {
          if (p.status !== 'pago' || !p.data_pagamento) return false
          const dataPagamento = new Date(p.data_pagamento)
          return dataPagamento >= primeirodia && dataPagamento <= ultimoDia
        })

        const entradas = (transacoesMes
          ?.filter(t => t.tipo === 'entrada')
          .reduce((sum, t) => sum + t.valor, 0) || 0) +
          (receivablesMes?.reduce((sum, r) => sum + r.valor, 0) || 0)

        const saidas = (transacoesMes
          ?.filter(t => t.tipo === 'saida')
          .reduce((sum, t) => sum + t.valor, 0) || 0) +
          (payablesMes?.reduce((sum, p) => sum + p.valor, 0) || 0)

        fluxoCaixa.push({
          mes: data.toLocaleString('pt-BR', { month: 'short', year: 'numeric' }),
          mesCompleto: data.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }),
          entradas,
          saidas,
          saldo: entradas - saidas,
        })
      }

      return fluxoCaixa
    },
  })
}

export function useExpensesByCategory() {
  return useQuery({
    queryKey: ['expenses-by-category'],
    queryFn: async () => {
      const { data: payables } = await supabase
        .from('org_payables')
        .select('*, category:org_financial_categories(*)')
        .eq('status', 'pago')

      const despesasPorCategoria = new Map<string, { nome: string; total: number; cor: string }>()

      payables?.forEach((payable: Payable & { category?: { nome: string; cor: string } }) => {
        const categoria = payable.category?.nome || 'Sem categoria'
        const cor = payable.category?.cor || '#gray'
        
        const existing = despesasPorCategoria.get(categoria) || {
          nome: categoria,
          total: 0,
          cor,
        }
        
        existing.total += payable.valor
        despesasPorCategoria.set(categoria, existing)
      })

      return Array.from(despesasPorCategoria.values()).sort((a, b) => b.total - a.total)
    },
  })
}
