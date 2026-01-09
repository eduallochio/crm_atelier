import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  Check, 
  X, 
  Sparkles, 
  TrendingUp, 
  Search, 
  BarChart3,
  Sun,
  Moon,
  Bell,
  Calendar,
  FileText,
  Wallet,
  Users,
  Scissors,
  Zap,
  Shield,
  Clock
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-linear-to-r from-blue-50 via-white to-blue-50 overflow-x-hidden">
      {/* Hero Section com gradiente animado */}
      <div className="relative flex flex-col items-center justify-center px-4 py-16 sm:py-24 overflow-hidden">
        {/* Background decorativo animado */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        <div className="w-full max-w-6xl text-center space-y-8 relative z-10">
          {/* Badge de destaque */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-sm text-blue-700 font-medium mb-4 animate-fade-in">
            <Sparkles className="h-4 w-4" />
            <span>Novo: Tema Escuro e Busca Global (⌘K)</span>
          </div>

          <div className="space-y-4 animate-fade-in-up">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight bg-linear-to-r from-gray-900 via-blue-800 to-gray-900 bg-clip-text text-transparent">
              CRM Atelier
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Sistema completo de gestão para ateliês de costura e artesanato
            </p>
            <p className="text-sm sm:text-base text-gray-500 max-w-2xl mx-auto">
              Simplifique sua rotina com dashboard inteligente, controle financeiro e muito mais
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up animation-delay-200">
            <Link href="/cadastro">
              <Button size="lg" className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                <Zap className="h-4 w-4 mr-2" />
                Começar Gratuitamente
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto hover:bg-gray-50 transition-all duration-300 hover:scale-105">
                Fazer Login
              </Button>
            </Link>
          </div>

          {/* Badge de confiança */}
          <div className="flex flex-wrap justify-center items-center gap-6 pt-8 text-sm text-gray-500 animate-fade-in-up animation-delay-400">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span>Grátis para sempre</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span>Sem cartão de crédito</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span>Setup em 2 minutos</span>
            </div>
          </div>

          {/* Features Cards com efeito glassmorphism */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 animate-fade-in-up animation-delay-600">
            <div className="group p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 hover:shadow-2xl hover:scale-105 transition-all duration-500 hover:bg-linear-to-br hover:from-blue-50 hover:to-white">
              <div className="h-12 w-12 bg-linear-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-gray-900 group-hover:text-blue-700 transition-colors">Ordens de Serviço</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Gerencie todos os trabalhos com timeline, status e histórico completo de alterações
              </p>
            </div>
            <div className="group p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 hover:shadow-2xl hover:scale-105 transition-all duration-500 hover:bg-linear-to-br hover:from-green-50 hover:to-white">
              <div className="h-12 w-12 bg-linear-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-gray-900 group-hover:text-green-700 transition-colors">Gestão de Clientes</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Cadastro completo com histórico, aniversários e lembretes automáticos
              </p>
            </div>
            <div className="group p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 hover:shadow-2xl hover:scale-105 transition-all duration-500 hover:bg-linear-to-br hover:from-purple-50 hover:to-white">
              <div className="h-12 w-12 bg-linear-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-gray-900 group-hover:text-purple-700 transition-colors">Controle Financeiro</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Caixa, contas a pagar/receber e relatórios financeiros em tempo real
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section - Funcionalidades Detalhadas */}
      <div className="px-4 py-16 sm:py-24 bg-linear-to-b from-white via-gray-50 to-white relative overflow-hidden">
        {/* Decoração de fundo */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                Recursos Completos
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Funcionalidades que Facilitam seu Dia a Dia
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Desenvolvido especialmente para ateliês, com recursos que você realmente precisa
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Dashboard Inteligente */}
            <div className="group bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all duration-300 hover:-translate-y-1">
              <div className="h-14 w-14 bg-linear-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <BarChart3 className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-semibold text-xl mb-3 text-gray-900">Dashboard Inteligente</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                KPIs em tempo real com animações, gráficos de receita, top serviços e métricas de performance
              </p>
            </div>

            {/* Busca Global */}
            <div className="group bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-indigo-200 transition-all duration-300 hover:-translate-y-1">
              <div className="h-14 w-14 bg-linear-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Search className="h-7 w-7 text-white" />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-semibold text-xl text-gray-900">Busca Global</h3>
                <kbd className="px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-100 border border-gray-300 rounded">⌘K</kbd>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                Encontre clientes, ordens e serviços instantaneamente com busca inteligente por qualquer campo
              </p>
            </div>

            {/* Tema Claro/Escuro */}
            <div className="group bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-amber-200 transition-all duration-300 hover:-translate-y-1">
              <div className="h-14 w-14 bg-linear-to-br from-amber-400 to-amber-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg relative overflow-hidden">
                <Sun className="h-7 w-7 text-white absolute transition-all duration-500 group-hover:translate-y-10" />
                <Moon className="h-6 w-6 text-white absolute translate-y-10 transition-all duration-500 group-hover:translate-y-0" />
              </div>
              <h3 className="font-semibold text-xl mb-3 text-gray-900">Modo Claro/Escuro</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Interface adaptável com tema claro, escuro ou automático para conforto visual em qualquer horário
              </p>
            </div>

            {/* Lembretes e Notificações */}
            <div className="group bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-rose-200 transition-all duration-300 hover:-translate-y-1">
              <div className="h-14 w-14 bg-linear-to-br from-rose-500 to-rose-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg relative">
                <Bell className="h-7 w-7 text-white group-hover:animate-wiggle" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-ping"></span>
              </div>
              <h3 className="font-semibold text-xl mb-3 text-gray-900">Lembretes Automáticos</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Aniversários de clientes, ordens pendentes e alertas financeiros no sidebar para não perder nada
              </p>
            </div>

            {/* Timeline de Ordens */}
            <div className="group bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-cyan-200 transition-all duration-300 hover:-translate-y-1">
              <div className="h-14 w-14 bg-linear-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Clock className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-semibold text-xl mb-3 text-gray-900">Timeline Completa</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Acompanhe o histórico completo de cada ordem: criação, alterações de status, pagamentos e anotações
              </p>
            </div>

            {/* Catálogo de Serviços */}
            <div className="group bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-emerald-200 transition-all duration-300 hover:-translate-y-1">
              <div className="h-14 w-14 bg-linear-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Scissors className="h-7 w-7 text-white group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <h3 className="font-semibold text-xl mb-3 text-gray-900">Catálogo Inteligente</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Serviços com preços, categorias, histórico de alterações e análise dos mais vendidos
              </p>
            </div>

            {/* Análises e Relatórios */}
            <div className="group bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-violet-200 transition-all duration-300 hover:-translate-y-1">
              <div className="h-14 w-14 bg-linear-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-semibold text-xl mb-3 text-gray-900">Análises Avançadas</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Gráficos de evolução, comparativos de períodos e identificação de tendências de crescimento
              </p>
            </div>

            {/* Histórico Completo */}
            <div className="group bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-orange-200 transition-all duration-300 hover:-translate-y-1">
              <div className="h-14 w-14 bg-linear-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Calendar className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-semibold text-xl mb-3 text-gray-900">Histórico de Alterações</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Rastreie todas as mudanças em clientes, serviços e ordens com registro de data, hora e responsável
              </p>
            </div>

            {/* Multi-organização */}
            <div className="group bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-teal-200 transition-all duration-300 hover:-translate-y-1">
              <div className="h-14 w-14 bg-linear-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-semibold text-xl mb-3 text-gray-900">Multi-Organização</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Dados isolados por organização com segurança RLS, permissões e controle de acesso granular
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="px-4 py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Escolha o Plano Ideal
            </h2>
            <p className="text-lg text-gray-600">
              Comece grátis e escale conforme seu negócio cresce
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Plano Free */}
            <div className="group bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-blue-400 hover:shadow-xl transition-all duration-500 hover:-translate-y-2">
              <div className="mb-6 mt-2">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-gray-900">R$ 0</span>
                  <span className="text-gray-600">/mês</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">Para começar</p>
              </div>

              <Link href="/cadastro">
                <Button variant="outline" className="w-full mb-6">
                  Começar Grátis
                </Button>
              </Link>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Até 50 clientes</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Até 2 usuários</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">100 ordens/mês</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">500 MB armazenamento</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Dashboard básico</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Controle de caixa</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Contas a pagar/receber</span>
                </div>
                <div className="flex items-start gap-3">
                  <X className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-500">Relatórios avançados</span>
                </div>
                <div className="flex items-start gap-3">
                  <X className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-500">Exportação de dados</span>
                </div>
                <div className="flex items-start gap-3">
                  <X className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-500">Automações</span>
                </div>
              </div>
            </div>

            {/* Plano Pro */}
            <div className="group bg-linear-to-b from-blue-50 to-white border-2 border-blue-500 rounded-2xl p-8 relative shadow-xl hover:shadow-2xl transform scale-105 hover:scale-110 transition-all duration-500 hover:-translate-y-2">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-linear-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold px-4 py-1 rounded-full shadow-lg whitespace-nowrap">
                ⭐ Mais Popular
              </div>

              <div className="mb-6 mt-2">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-gray-900">R$ 59,90</span>
                  <span className="text-gray-600">/mês</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">ou R$ 599/ano (2 meses grátis)</p>
              </div>

              <Link href="/cadastro">
                <Button className="w-full mb-6 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <Zap className="h-4 w-4 mr-2" />
                  Começar Teste Grátis
                </Button>
              </Link>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700 font-medium">Até 200 clientes</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700 font-medium">Até 5 usuários</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700 font-medium">1.000 ordens/mês</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700 font-medium">5 GB armazenamento</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700 font-medium">Tudo do plano Free +</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Relatórios avançados</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Exportação Excel/PDF</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Dashboards personalizados</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Lembretes automáticos</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Campos customizados</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Suporte prioritário (12h)</span>
                </div>
              </div>
            </div>

            {/* Plano Enterprise - Em Desenvolvimento */}
            {/* <div className="group relative bg-linear-to-b from-purple-50 via-white to-gray-50 border-2 border-purple-300 rounded-2xl p-8 hover:shadow-xl hover:border-purple-400 transition-all duration-500 hover:-translate-y-2 overflow-hidden">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-purple-200/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </div>
              
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-linear-to-r from-purple-600 via-pink-600 to-purple-600 text-white text-xs font-semibold px-4 py-1 rounded-full flex items-center gap-1 shadow-lg whitespace-nowrap">
                <Sparkles className="h-3 w-3" />
                Em Desenvolvimento
              </div>

              <div className="mb-6 mt-2">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-gray-900">R$ 149,90</span>
                  <span className="text-gray-600">/mês</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">ou R$ 1.499/ano (2 meses grátis)</p>
              </div>

              <Button variant="outline" className="w-full mb-6" disabled>
                Em Breve
              </Button>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700 font-medium">Clientes ilimitados</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700 font-medium">Usuários ilimitados</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700 font-medium">Ordens ilimitadas</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700 font-medium">50 GB armazenamento</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700 font-medium">Tudo do plano Pro +</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">WhatsApp Business API</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">API REST completa</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Múltiplas filiais</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">White Label</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Automações avançadas</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Suporte 24/7</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Gerente de conta dedicado</span>
                </div>
              </div>
            </div> */}
          </div>

          <div className="text-center mt-12">
            <p className="text-sm text-gray-600">
              Todos os planos incluem 14 dias de teste grátis • Sem cartão de crédito • Cancele quando quiser
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="px-4 py-16 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-blue-100 text-sm">Uptime</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">&lt;100ms</div>
              <div className="text-blue-100 text-sm">Tempo de Resposta</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-blue-100 text-sm">Suporte (Enterprise)</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">SSL</div>
              <div className="text-blue-100 text-sm">Segurança Avançada</div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="px-4 py-16 sm:py-24 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Perguntas Frequentes
            </h2>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2 text-gray-900">
                Preciso de cartão de crédito para começar?
              </h3>
              <p className="text-gray-600">
                Não! O plano Free é 100% gratuito e não requer cartão de crédito. Você pode começar a usar agora mesmo.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2 text-gray-900">
                O que acontece se eu atingir o limite de clientes?
              </h3>
              <p className="text-gray-600">
                Implementamos soft delete: clientes arquivados ainda contam no limite. Você pode fazer upgrade do plano ou restaurar clientes arquivados. Isso preserva seu histórico e evita perda de dados.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2 text-gray-900">
                Posso cancelar a qualquer momento?
              </h3>
              <p className="text-gray-600">
                Sim! Não há multa ou fidelidade. Seus dados ficam disponíveis por 30 dias após cancelamento para exportação.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2 text-gray-900">
                Meus dados são seguros?
              </h3>
              <p className="text-gray-600">
                Sim! Usamos Supabase com criptografia SSL/TLS, Row Level Security (RLS) para isolamento de dados e backup automático. Estamos em conformidade com a LGPD.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2 text-gray-900">
                Quando o plano Enterprise estará disponível?
              </h3>
              <p className="text-gray-600">
                Estamos desenvolvendo ativamente! Recursos como WhatsApp API, múltiplas filiais e white label estarão disponíveis em breve. Entre em contato para saber mais.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2 text-gray-900">
                Posso testar o plano Pro gratuitamente?
              </h3>
              <p className="text-gray-600">
                Sim! Todos os planos pagos incluem 14 dias de teste grátis, sem necessidade de cartão de crédito.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="px-4 py-16 sm:py-24 bg-linear-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Pronto para Transformar seu Ateliê?
          </h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Junte-se a centenas de ateliês que já otimizaram sua gestão com o CRM Atelier
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/cadastro">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Começar Grátis Agora
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white/10">
                Já tenho conta
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-4 py-12 bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-semibold mb-4">CRM Atelier</h3>
              <p className="text-sm">
                Sistema completo de gestão para ateliês de costura e artesanato
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/cadastro" className="hover:text-white transition-colors">Começar Grátis</Link></li>
                <li><Link href="/#pricing" className="hover:text-white transition-colors">Preços</Link></li>
                <li><Link href="/#features" className="hover:text-white transition-colors">Funcionalidades</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/#faq" className="hover:text-white transition-colors">FAQ</Link></li>
                <li><a href="mailto:suporte@crmatelier.com.br" className="hover:text-white transition-colors">Contato</a></li>
                <li><Link href="/docs" className="hover:text-white transition-colors">Documentação</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/termos" className="hover:text-white transition-colors">Termos de Uso</Link></li>
                <li><Link href="/privacidade" className="hover:text-white transition-colors">Privacidade</Link></li>
                <li><Link href="/lgpd" className="hover:text-white transition-colors">LGPD</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} CRM Atelier. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
