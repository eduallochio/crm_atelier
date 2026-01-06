'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle, FileText, X } from 'lucide-react'
import { Header } from '@/components/layouts/header'
import { Button } from '@/components/ui/button'
import { useCashierSession, useCashierMovements, useCloseCashier } from '@/hooks/use-cashier'
import { AddMovementDialog } from '@/components/financeiro/add-movement-dialog'
import { CloseCashierDialog } from '@/components/financeiro/close-cashier-dialog'
import { MovementsTable } from '@/components/financeiro/movements-table'

export default function SessaoCaixaPage() {
  const router = useRouter()
  const params = useParams()
  const sessaoId = params.id as string
  
  const [showAddMovement, setShowAddMovement] = useState(false)
  const [showCloseCashier, setShowCloseCashier] = useState(false)
  const [selectedType, setSelectedType] = useState<'entrada' | 'saida' | 'sangria' | 'reforco'>('entrada')

  const { data: sessao, isLoading: loadingSessao } = useCashierSession(sessaoId)
  const { data: movimentos, isLoading: loadingMovimentos } = useCashierMovements(sessaoId)
  const closeCashier = useCloseCashier()

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('pt-BR')
  }

  const handleAddMovement = (type: 'entrada' | 'saida' | 'sangria' | 'reforco') => {
    setSelectedType(type)
    setShowAddMovement(true)
  }

  const handleCloseCashier = async (data: {
    saldo_real: number
    conferencia: { dinheiro: number; pix: number; credito: number; debito: number; outros: number }
    observacoes_fechamento?: string
  }) => {
    try {
      await closeCashier.mutateAsync({
        sessaoId,
        ...data,
      })
      setShowCloseCashier(false)
      router.push('/financeiro/caixa')
    } catch (error) {
      console.error('Erro ao fechar caixa:', error)
    }
  }

  if (loadingSessao) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
          <p className="mt-4 text-gray-500">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!sessao) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Sessão não encontrada</p>
          <Button onClick={() => router.push('/financeiro/caixa')}>
            Voltar
          </Button>
        </div>
      </div>
    )
  }

  const entradas = movimentos?.filter(m => m.tipo === 'entrada').reduce((sum, m) => sum + m.valor, 0) || 0
  const saidas = movimentos?.filter(m => m.tipo === 'saida').reduce((sum, m) => sum + m.valor, 0) || 0
  const sangrias = movimentos?.filter(m => m.tipo === 'sangria').reduce((sum, m) => sum + m.valor, 0) || 0
  const reforcos = movimentos?.filter(m => m.tipo === 'reforco').reduce((sum, m) => sum + m.valor, 0) || 0
  
  const saldoAtual = sessao.saldo_inicial + entradas - saidas - sangrias + reforcos

  const isClosed = sessao.status === 'fechado'

  return (
    <>
      <div>
        <Header 
          title={sessao.org_cashiers?.nome || 'Caixa'}
          description={isClosed ? `Sessão fechada em ${sessao.data_fechamento ? formatDateTime(sessao.data_fechamento) : 'Data desconhecida'}` : `Sessão aberta em ${sessao.data_abertura ? formatDateTime(sessao.data_abertura) : 'Data desconhecida'}`}
          action={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push('/financeiro/caixa')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              {!isClosed && (
                <>
                  <Button variant="outline" onClick={() => router.push(`/financeiro/caixa/sessao/${sessaoId}/relatorio`)}>
                    <FileText className="h-4 w-4 mr-2" />
                    Relatório
                  </Button>
                  <Button variant="destructive" onClick={() => setShowCloseCashier(true)}>
                    <X className="h-4 w-4 mr-2" />
                    Fechar Caixa
                  </Button>
                </>
              )}
            </div>
          }
        />

        <div className="p-6 space-y-6">
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <ArrowUpCircle className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Saldo Inicial</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(sessao.saldo_inicial)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-50 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Entradas</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(entradas)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-50 rounded-lg">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Saídas</p>
                  <p className="text-xl font-bold text-red-600">
                    {formatCurrency(saidas)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <ArrowDownCircle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Sangrias</p>
                  <p className="text-xl font-bold text-orange-600">
                    {formatCurrency(sangrias)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <ArrowUpCircle className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Saldo Atual</p>
                  <p className="text-xl font-bold text-purple-600">
                    {formatCurrency(saldoAtual)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Botões de Ação Rápida */}
          {!isClosed && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button 
                className="h-20" 
                variant="outline"
                onClick={() => handleAddMovement('entrada')}
              >
                <div className="text-center">
                  <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-600" />
                  <p className="font-medium">Entrada</p>
                </div>
              </Button>

              <Button 
                className="h-20" 
                variant="outline"
                onClick={() => handleAddMovement('saida')}
              >
                <div className="text-center">
                  <TrendingDown className="h-6 w-6 mx-auto mb-2 text-red-600" />
                  <p className="font-medium">Saída</p>
                </div>
              </Button>

              <Button 
                className="h-20" 
                variant="outline"
                onClick={() => handleAddMovement('sangria')}
              >
                <div className="text-center">
                  <ArrowDownCircle className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                  <p className="font-medium">Sangria</p>
                </div>
              </Button>

              <Button 
                className="h-20" 
                variant="outline"
                onClick={() => handleAddMovement('reforco')}
              >
                <div className="text-center">
                  <ArrowUpCircle className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                  <p className="font-medium">Reforço</p>
                </div>
              </Button>
            </div>
          )}

          {/* Tabela de Movimentos */}
          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Movimentos</h3>
              <p className="text-sm text-gray-500">Todas as transações desta sessão</p>
            </div>
            
            <MovementsTable 
              movements={movimentos || []} 
              isLoading={loadingMovimentos}
            />
          </div>
        </div>
      </div>

      {showAddMovement && (
        <AddMovementDialog
          sessaoId={sessaoId}
          type={selectedType}
          onClose={() => setShowAddMovement(false)}
        />
      )}

      {showCloseCashier && sessao && sessao.id && (
        <CloseCashierDialog
          sessao={{
            id: sessao.id,
            caixa_id: sessao.caixa_id,
            saldo_inicial: sessao.saldo_inicial,
            status: sessao.status,
          }}
          saldoEsperado={saldoAtual}
          onClose={() => setShowCloseCashier(false)}
          onConfirm={handleCloseCashier}
          isLoading={closeCashier.isPending}
        />
      )}
    </>
  )
}
