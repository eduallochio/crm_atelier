'use client'

import { useRouter } from 'next/navigation'
import { Plus, DollarSign, Clock, CheckCircle, AlertCircle, Calendar, ArrowLeft } from 'lucide-react'
import { Header } from '@/components/layouts/header'
import { Button } from '@/components/ui/button'
import { useCashiers, useCashierSessions } from '@/hooks/use-cashier'

export default function CaixaPage() {
  const router = useRouter()
  const { data: caixas, isLoading: loadingCaixas } = useCashiers()
  const { data: sessoes } = useCashierSessions()

  const sessoesAbertas = sessoes?.filter((s) => s.status === 'aberto') || []
  const sessoesFechadas = sessoes?.filter((s) => s.status === 'fechado').slice(0, 5) || []

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('pt-BR')
  }

  return (
    <div>
      <Header 
        title="Caixa"
        description="Gestão de caixas e movimentações"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/financeiro')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <Button onClick={() => router.push('/financeiro/caixa/cadastro')}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Caixa
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Caixas Cadastrados</p>
                <p className="text-2xl font-bold text-gray-900">
                  {caixas?.length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-50 rounded-lg">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Caixas Abertos</p>
                <p className="text-2xl font-bold text-green-600">
                  {sessoesAbertas.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Sessões Fechadas Hoje</p>
                <p className="text-2xl font-bold text-purple-600">
                  {sessoesFechadas.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total de Sessões</p>
                <p className="text-2xl font-bold text-orange-600">
                  {sessoes?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Caixas Abertos */}
        {sessoesAbertas.length > 0 && (
          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Caixas Abertos</h3>
              <p className="text-sm text-gray-500">Sessões em andamento</p>
            </div>
            <div className="divide-y">
              {sessoesAbertas.map((sessao) => (
                <div key={sessao.id} className="p-4 hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/financeiro/caixa/sessao/${sessao.id}`)}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">
                          {sessao.org_cashiers?.nome || 'Caixa'}
                        </h4>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          Aberto
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Aberto em {sessao.data_abertura ? formatDateTime(sessao.data_abertura) : 'Data desconhecida'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Saldo Inicial</p>
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(sessao.saldo_inicial)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lista de Caixas */}
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Meus Caixas</h3>
            <p className="text-sm text-gray-500">Gerenciar caixas cadastrados</p>
          </div>
          
          {loadingCaixas ? (
            <div className="p-8 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
              <p className="mt-4 text-gray-500">Carregando caixas...</p>
            </div>
          ) : caixas && caixas.length > 0 ? (
            <div className="divide-y">
              {caixas.map((caixa) => {
                const sessaoAberta = sessoesAbertas.find((s) => s.caixa_id === caixa.id)
                
                return (
                  <div key={caixa.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">{caixa.nome}</h4>
                          {caixa.ativo ? (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                              Ativo
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                              Inativo
                            </span>
                          )}
                          {sessaoAberta && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                              Em uso
                            </span>
                          )}
                        </div>
                        {caixa.descricao && (
                          <p className="text-sm text-gray-500 mt-1">{caixa.descricao}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {sessaoAberta ? (
                          <Button
                            size="sm"
                            onClick={() => router.push(`/financeiro/caixa/sessao/${sessaoAberta.id}`)}
                          >
                            Ver Sessão
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => router.push(`/financeiro/caixa/abrir/${caixa.id}`)}
                          >
                            Abrir Caixa
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/financeiro/caixa/${caixa.id}/editar`)}
                        >
                          Editar
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Nenhum caixa cadastrado</p>
              <Button onClick={() => router.push('/financeiro/caixa/cadastro')}>
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Primeiro Caixa
              </Button>
            </div>
          )}
        </div>

        {/* Últimas Sessões Fechadas */}
        {sessoesFechadas.length > 0 && (
          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Últimas Sessões Fechadas</h3>
              <p className="text-sm text-gray-500">Histórico recente</p>
            </div>
            <div className="divide-y">
              {sessoesFechadas.map((sessao) => (
                <div 
                  key={sessao.id} 
                  className="p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/financeiro/caixa/sessao/${sessao.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">
                          {sessao.org_cashiers?.nome || 'Caixa'}
                        </h4>
                        {sessao.diferenca && sessao.diferenca !== 0 ? (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                            Com diferença
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            Fechado OK
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Fechado em {sessao.data_fechamento ? formatDateTime(sessao.data_fechamento) : 'Data desconhecida'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Saldo Final</p>
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(sessao.saldo_real || 0)}
                      </p>
                      {sessao.diferenca && sessao.diferenca !== 0 && (
                        <p className={`text-sm font-medium ${sessao.diferenca > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {sessao.diferenca > 0 ? '+' : ''}{formatCurrency(sessao.diferenca)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
