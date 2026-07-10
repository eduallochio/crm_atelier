'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle, FileText, X, Landmark, AlertCircle } from 'lucide-react'
import { Loader } from '@/components/ui/loader'
import { Header } from '@/components/layouts/header'
import { Button } from '@/components/ui/button'
import { useCashierSession, useCashierMovements, useCloseCashier } from '@/hooks/use-cashier'
import { AddMovementDialog } from '@/components/financeiro/add-movement-dialog'
import { CloseCashierDialog } from '@/components/financeiro/close-cashier-dialog'
import { MovementsTable } from '@/components/financeiro/movements-table'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

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
  const queryClient = useQueryClient()
  const [registeringId, setRegisteringId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'movimentos' | 'nao-lancadas'>('movimentos')

  const { data: naoLancadas = [], isLoading: loadingNaoLancadas } = useQuery({
    queryKey: ['orders-unlaunched'],
    queryFn: () => fetch('/api/orders/unlaunched').then(r => r.json()),
    enabled: !loadingSessao,
  })

  const handleRegisterInCashier = async (orderId: string) => {
    setRegisteringId(orderId)
    try {
      const res = await fetch(`/api/orders/${orderId}/register-cashier`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Erro ao lançar no caixa')
        return
      }
      toast.success('OS lançada no caixa com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['orders-unlaunched'] })
      queryClient.invalidateQueries({ queryKey: ['cashier-movements', sessaoId] })
    } catch {
      toast.error('Erro ao lançar no caixa')
    } finally {
      setRegisteringId(null)
    }
  }

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
      <Loader className="min-h-screen" text="Carregando..." />
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

          {/* Abas: Movimentos | OS não lançadas */}
          <div className="bg-card rounded-lg border border-border">
            <div className="flex border-b border-border">
              <button
                onClick={() => setActiveTab('movimentos')}
                className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'movimentos' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Movimentos
              </button>
              <button
                onClick={() => setActiveTab('nao-lancadas')}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'nao-lancadas' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                OS não lançadas
                {naoLancadas.length > 0 && (
                  <span className="bg-amber-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {naoLancadas.length}
                  </span>
                )}
              </button>
            </div>

            {activeTab === 'movimentos' && (
              <MovementsTable
                movements={movimentos || []}
                isLoading={loadingMovimentos}
              />
            )}

            {activeTab === 'nao-lancadas' && (
              <div>
                {loadingNaoLancadas ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">Carregando...</div>
                ) : naoLancadas.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    Todas as OS pagas já foram lançadas no caixa.
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    <div className="px-4 py-3 bg-amber-50 dark:bg-amber-950/30 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        Estas OS foram pagas mas o valor ainda não entrou no caixa. Clique em "Lançar" para registrar.
                      </p>
                    </div>
                    {naoLancadas.map((os: { id: string; numero: number | null; valorTotal: string | null; formaPagamento: string | null; dataConclusao: string | null; clienteNome: string | null }) => (
                      <div key={os.id} className="flex items-center justify-between px-4 py-3 hover:bg-accent/50">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            #{String(os.numero ?? 0).padStart(6, '0')} — {os.clienteNome || 'Cliente não informado'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {os.formaPagamento || 'Forma de pagamento não informada'}
                            {os.dataConclusao && ` · ${new Date(os.dataConclusao).toLocaleDateString('pt-BR')}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                            {(Number(os.valorTotal) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-violet-600 dark:text-violet-400 border-violet-300 dark:border-violet-700 hover:bg-violet-50 dark:hover:bg-violet-950/50"
                            onClick={() => handleRegisterInCashier(os.id)}
                            disabled={registeringId === os.id}
                          >
                            <Landmark className="h-3.5 w-3.5 mr-1.5" />
                            {registeringId === os.id ? 'Lançando...' : 'Lançar'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
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
