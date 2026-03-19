'use client'

import { useRouter } from 'next/navigation'
import { Plus, DollarSign, Clock, CheckCircle, AlertCircle, Calendar, ArrowLeft } from 'lucide-react'
import { Loader } from '@/components/ui/loader'
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
      />

      <div className="p-6 space-y-6">
        {/* Barra de Ações */}
        <div className="flex items-center justify-between bg-card rounded-lg border border-border p-4">
          <Button variant="outline" onClick={() => router.push('/financeiro')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <Button onClick={() => router.push('/financeiro/caixa/cadastro')}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Caixa
          </Button>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 dark:bg-blue-950/50 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Caixas Cadastrados</p>
                <p className="text-2xl font-bold text-foreground">
                  {caixas?.length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-50 dark:bg-green-950/50 rounded-lg">
                <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Caixas Abertos</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {sessoesAbertas.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-50 dark:bg-purple-950/50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sessões Fechadas Hoje</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {sessoesFechadas.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-50 dark:bg-orange-950/50 rounded-lg">
                <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Sessões</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {sessoes?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Caixas Abertos */}
        {sessoesAbertas.length > 0 && (
          <div className="bg-card rounded-lg border border-border">
            <div className="p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Caixas Abertos</h3>
              <p className="text-sm text-muted-foreground">Sessões em andamento</p>
            </div>
            <div className="divide-y divide-border">
              {sessoesAbertas.map((sessao) => (
                <div key={sessao.id} className="p-4 hover:bg-accent/50 cursor-pointer" onClick={() => router.push(`/financeiro/caixa/sessao/${sessao.id}`)}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-foreground">
                          {sessao.org_cashiers?.nome || 'Caixa'}
                        </h4>
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-400 text-xs font-medium rounded-full">
                          Aberto
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Aberto em {sessao.data_abertura ? formatDateTime(sessao.data_abertura) : 'Data desconhecida'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Saldo Inicial</p>
                      <p className="text-lg font-bold text-foreground">
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
        <div className="bg-card rounded-lg border border-border">
          <div className="p-4 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">Meus Caixas</h3>
            <p className="text-sm text-muted-foreground">Gerenciar caixas cadastrados</p>
          </div>
          
          {loadingCaixas ? (
            <Loader text="Carregando caixas..." />
          ) : caixas && caixas.length > 0 ? (
            <div className="divide-y divide-border">
              {caixas.map((caixa) => {
                const sessaoAberta = sessoesAbertas.find((s) => s.caixa_id === caixa.id)
                
                return (
                  <div key={caixa.id} className="p-4 hover:bg-accent/50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-foreground">{caixa.nome}</h4>
                          {caixa.ativo ? (
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-400 text-xs font-medium rounded-full">
                              Ativo
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-muted text-muted-foreground text-xs font-medium rounded-full">
                              Inativo
                            </span>
                          )}
                          {sessaoAberta && (
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-400 text-xs font-medium rounded-full">
                              Em uso
                            </span>
                          )}
                        </div>
                        {caixa.descricao && (
                          <p className="text-sm text-muted-foreground mt-1">{caixa.descricao}</p>
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
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Nenhum caixa cadastrado</p>
              <Button onClick={() => router.push('/financeiro/caixa/cadastro')}>
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Primeiro Caixa
              </Button>
            </div>
          )}
        </div>

        {/* Últimas Sessões Fechadas */}
        {sessoesFechadas.length > 0 && (
          <div className="bg-card rounded-lg border border-border">
            <div className="p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Últimas Sessões Fechadas</h3>
              <p className="text-sm text-muted-foreground">Histórico recente</p>
            </div>
            <div className="divide-y divide-border">
              {sessoesFechadas.map((sessao) => (
                <div 
                  key={sessao.id} 
                  className="p-4 hover:bg-accent/50 cursor-pointer"
                  onClick={() => router.push(`/financeiro/caixa/sessao/${sessao.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-foreground">
                          {sessao.org_cashiers?.nome || 'Caixa'}
                        </h4>
                        {sessao.diferenca && sessao.diferenca !== 0 ? (
                          <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-950/50 text-yellow-800 dark:text-yellow-400 text-xs font-medium rounded-full">
                            Com diferença
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-400 text-xs font-medium rounded-full">
                            Fechado OK
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Fechado em {sessao.data_fechamento ? formatDateTime(sessao.data_fechamento) : 'Data desconhecida'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Saldo Final</p>
                      <p className="text-lg font-bold text-foreground">
                        {formatCurrency(sessao.saldo_real || 0)}
                      </p>
                      {sessao.diferenca && sessao.diferenca !== 0 && (
                        <p className={`text-sm font-medium ${sessao.diferenca > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
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
