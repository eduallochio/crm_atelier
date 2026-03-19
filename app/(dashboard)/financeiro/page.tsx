'use client'

import { useState } from 'react'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  AlertCircle,
  Calendar,
  Receipt,
  CreditCard,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react'
import { Loader } from '@/components/ui/loader'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Header } from '@/components/layouts/header'
import { Button } from '@/components/ui/button'
import { useFinancialStats } from '@/hooks/use-financial-stats'

export default function FinanceiroPage() {
  const [dateFilter, setDateFilter] = useState<'7days' | '30days' | 'thisMonth' | 'lastMonth' | 'all'>('thisMonth')
  const { data: stats, isLoading } = useFinancialStats(dateFilter)

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  if (isLoading) {
    return (
      <div>
        <Header 
          title="Financeiro"
          description="Controle financeiro do ateliê"
        />
        <Loader text="Carregando dados financeiros..." />
      </div>
    )
  }

  return (
    <div>
      <Header 
        title="Financeiro"
        description="Controle financeiro do ateliê"
      />
      
      <div className="p-6 space-y-6">
        {/* Filtros de Período */}
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-foreground">Período:</span>
            <Button
              variant={dateFilter === '7days' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateFilter('7days')}
            >
              Últimos 7 dias
            </Button>
            <Button
              variant={dateFilter === '30days' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateFilter('30days')}
            >
              Últimos 30 dias
            </Button>
            <Button
              variant={dateFilter === 'thisMonth' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateFilter('thisMonth')}
            >
              Este mês
            </Button>
            <Button
              variant={dateFilter === 'lastMonth' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateFilter('lastMonth')}
            >
              Mês passado
            </Button>
            <Button
              variant={dateFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateFilter('all')}
            >
              Tudo
            </Button>
          </div>
        </div>
        
        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Saldo Atual */}
          <div className="relative bg-card rounded-2xl overflow-hidden border border-border/60 shadow-sm hover:shadow-md transition-all duration-200">
            <div className={`absolute top-0 left-0 right-0 h-[3px] ${(stats?.saldoAtual || 0) >= 0 ? 'bg-green-500' : 'bg-red-500'}`} />
            <div className="p-5 pt-6">
              <div className="flex items-start justify-between mb-3">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Saldo Atual</p>
                <div className={`p-2 rounded-xl shadow-sm ${(stats?.saldoAtual || 0) >= 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                  <Wallet className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
              <p className={`text-2xl font-bold ${(stats?.saldoAtual || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(stats?.saldoAtual || 0)}
              </p>
              <div className="h-px bg-border/50 mt-3 mb-2" />
              <p className="text-[11px] text-muted-foreground">Receitas − Despesas</p>
            </div>
          </div>

          {/* A Receber */}
          <div className="relative bg-card rounded-2xl overflow-hidden border border-border/60 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-blue-500" />
            <div className="p-5 pt-6">
              <div className="flex items-start justify-between mb-3">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">A Receber</p>
                <div className="p-2 rounded-xl bg-blue-500 shadow-sm">
                  <ArrowUpCircle className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(stats?.totalAReceber || 0)}
              </p>
              {(stats?.receitasAtrasadas || 0) > 0 && (
                <>
                  <div className="h-px bg-border/50 mt-3 mb-2" />
                  <p className="text-[11px] text-red-500 dark:text-red-400">{formatCurrency(stats?.receitasAtrasadas || 0)} em atraso</p>
                </>
              )}
            </div>
          </div>

          {/* A Pagar */}
          <div className="relative bg-card rounded-2xl overflow-hidden border border-border/60 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-orange-500" />
            <div className="p-5 pt-6">
              <div className="flex items-start justify-between mb-3">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">A Pagar</p>
                <div className="p-2 rounded-xl bg-orange-500 shadow-sm">
                  <ArrowDownCircle className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {formatCurrency(stats?.totalAPagar || 0)}
              </p>
              {(stats?.despesasAtrasadas || 0) > 0 && (
                <>
                  <div className="h-px bg-border/50 mt-3 mb-2" />
                  <p className="text-[11px] text-red-500 dark:text-red-400">{formatCurrency(stats?.despesasAtrasadas || 0)} em atraso</p>
                </>
              )}
            </div>
          </div>

          {/* Saldo do Mês */}
          <div className="relative bg-card rounded-2xl overflow-hidden border border-border/60 shadow-sm hover:shadow-md transition-all duration-200">
            <div className={`absolute top-0 left-0 right-0 h-[3px] ${(stats?.saldoMes || 0) >= 0 ? 'bg-green-500' : 'bg-red-500'}`} />
            <div className="p-5 pt-6">
              <div className="flex items-start justify-between mb-3">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Saldo do Mês</p>
                <div className={`p-2 rounded-xl shadow-sm ${(stats?.saldoMes || 0) >= 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                  <Calendar className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
              <p className={`text-2xl font-bold ${(stats?.saldoMes || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(stats?.saldoMes || 0)}
              </p>
              <div className="h-px bg-border/50 mt-3 mb-2" />
              <p className="text-[11px] text-muted-foreground">Entradas: {formatCurrency(stats?.entradasMes || 0)}</p>
            </div>
          </div>
        </div>

        {/* Alertas */}
        {((stats?.recebiveisVencendo || 0) > 0 || (stats?.pagaveisVencendo || 0) > 0) && (
          <Alert variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Contas Vencendo nos Próximos 7 Dias</AlertTitle>
            <AlertDescription>
              <div className="space-y-1">
                {(stats?.recebiveisVencendo || 0) > 0 && (
                  <p>• {stats?.recebiveisVencendo} conta(s) a receber</p>
                )}
                {(stats?.pagaveisVencendo || 0) > 0 && (
                  <p>• {stats?.pagaveisVencendo} conta(s) a pagar</p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Gráfico de Fluxo de Caixa */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Fluxo de Caixa (Últimos 6 Meses)</h3>
          <div className="space-y-3">
            {stats?.fluxoCaixa?.map((item, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-20 text-sm text-muted-foreground font-medium">
                  {item.mes}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 bg-muted rounded-full h-6 relative overflow-hidden">
                      <div 
                        className="absolute left-0 top-0 h-full bg-green-500 dark:bg-green-600 transition-all"
                        style={{ width: `${Math.min((item.entradas / Math.max(...(stats.fluxoCaixa?.map(f => Math.max(f.entradas, f.saidas)) || [1]))) * 100, 100)}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-foreground">
                        {formatCurrency(item.entradas)}
                      </span>
                    </div>
                    <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-6 relative overflow-hidden">
                      <div 
                        className="absolute left-0 top-0 h-full bg-red-500 dark:bg-red-600 transition-all"
                        style={{ width: `${Math.min((item.saidas / Math.max(...(stats.fluxoCaixa?.map(f => Math.max(f.entradas, f.saidas)) || [1]))) * 100, 100)}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-foreground">
                        {formatCurrency(item.saidas)}
                      </span>
                    </div>
                    <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <div className={`w-24 text-right text-sm font-semibold ${
                  item.saldo >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {formatCurrency(item.saldo)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            href="/financeiro/receber"
            className="bg-card rounded-lg border border-border p-6 hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-950/70 transition-colors">
                <Receipt className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Contas a Receber</h4>
                <p className="text-sm text-muted-foreground">Gerenciar recebimentos</p>
              </div>
            </div>
          </a>

          <a
            href="/financeiro/pagar"
            className="bg-card rounded-lg border border-border p-6 hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-50 dark:bg-orange-950/50 rounded-lg group-hover:bg-orange-100 dark:group-hover:bg-orange-950/70 transition-colors">
                <CreditCard className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Contas a Pagar</h4>
                <p className="text-sm text-muted-foreground">Gerenciar pagamentos</p>
              </div>
            </div>
          </a>

          <a
            href="/financeiro/fluxo-caixa"
            className="bg-card rounded-lg border border-border p-6 hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-50 dark:bg-green-950/50 rounded-lg group-hover:bg-green-100 dark:group-hover:bg-green-950/70 transition-colors">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Fluxo de Caixa</h4>
                <p className="text-sm text-muted-foreground">Visualizar transações</p>
              </div>
            </div>
          </a>

          <a
            href="/financeiro/caixa"
            className="bg-card rounded-lg border border-border p-6 hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-50 dark:bg-purple-950/50 rounded-lg group-hover:bg-purple-100 dark:group-hover:bg-purple-950/70 transition-colors">
                <Wallet className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Caixa</h4>
                <p className="text-sm text-muted-foreground">Controle de caixa</p>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}
