'use client'

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
import { useEffect, useState } from 'react'

export default function HomePage() {
  const [showStickyCTA, setShowStickyCTA] = useState(false)
  const [confettiTriggered, setConfettiTriggered] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      // Mostra o CTA fixo após rolar 800px
      setShowStickyCTA(window.scrollY > 800)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const triggerConfetti = () => {
    if (confettiTriggered) return
    setConfettiTriggered(true)
    
    // Criar confetes
    const colors = ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B']
    const confettiCount = 50
    
    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div')
      confetti.style.position = 'fixed'
      confetti.style.width = '10px'
      confetti.style.height = '10px'
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
      confetti.style.left = Math.random() * 100 + '%'
      confetti.style.top = '-10px'
      confetti.style.opacity = '1'
      confetti.style.transform = 'rotate(0deg)'
      confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0'
      confetti.style.zIndex = '9999'
      confetti.style.pointerEvents = 'none'
      confetti.style.animation = `confetti ${2 + Math.random() * 2}s linear forwards`
      
      document.body.appendChild(confetti)
      
      setTimeout(() => confetti.remove(), 4000)
    }
    
    setTimeout(() => setConfettiTriggered(false), 4000)
  }
  return (
    <div className="min-h-screen bg-linear-to-r from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 overflow-x-hidden">
      {/* Hero Section com gradiente animado */}
      <div className="relative flex flex-col items-center justify-center px-4 py-12 sm:py-16 lg:py-20 overflow-hidden">
        {/* Background decorativo animado */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        <div className="w-full max-w-7xl mx-auto relative z-10">
          {/* Grid Layout: Texto à esquerda, Mockups à direita */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            
            {/* Left Column - Texto e CTAs */}
            <div className="space-y-6 lg:text-left text-center">
              {/* Badge de destaque com oferta */}
              <div className="flex flex-col sm:flex-row items-center lg:items-start lg:justify-start justify-center gap-3 animate-fade-in">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-linear-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-full text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  <span className="text-green-700">🎉 Lançamento: Plano Free 100% gratuito para sempre!</span>
                </div>
              </div>

              <div className="space-y-4 animate-fade-in-up">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-gray-900 dark:text-gray-100 leading-tight">
                  Seu Ateliê Merece um{' '}
                  <span className="bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Sistema Profissional
                  </span>
                </h1>
                <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-xl lg:mx-0 mx-auto leading-relaxed">
                  Gerencie clientes, ordens de serviço e finanças em um único lugar.
                </p>
                <p className="text-base text-gray-500 dark:text-gray-500 max-w-xl lg:mx-0 mx-auto">
                  <span className="font-semibold text-blue-600 dark:text-blue-400">✨ Simples, rápido e 100% gratuito para começar</span>
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 lg:justify-start justify-center items-center animate-fade-in-up animation-delay-300">
                <Link href="/cadastro" onClick={triggerConfetti}>
                  <Button size="lg" className="w-full sm:w-auto text-base px-8 py-5 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700">
                    <Zap className="h-5 w-5 mr-2" />
                    <span className="font-bold">Começar Grátis Agora</span>
                  </Button>
                </Link>
                <Link href="#demo">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-6 py-5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 hover:scale-105 border-2 hover:border-blue-300 dark:hover:border-blue-600">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Ver Demo
                  </Button>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap lg:justify-start justify-center items-center gap-3 animate-fade-in-up animation-delay-400">
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 backdrop-blur-sm rounded-full shadow-sm border border-green-200 dark:border-green-800">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">100% Seguro</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 backdrop-blur-sm rounded-full shadow-sm border border-blue-200 dark:border-blue-800">
                  <Check className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-400">LGPD</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-900/20 backdrop-blur-sm rounded-full shadow-sm border border-purple-200 dark:border-purple-800">
                  <Clock className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-400">99.9%</span>
                </div>
              </div>

            </div>

            {/* Right Column - Device Mockups */}
            <div className="relative animate-fade-in-up animation-delay-200 lg:order-last order-first">
              {/* Container dos dispositivos */}
              <div className="relative h-[400px] sm:h-[500px] lg:h-[600px]">
                
                {/* Laptop/Notebook Mockup */}
                <div className="absolute top-0 left-0 right-0 z-10 transform perspective-1000 animate-float">
                  <div className="relative transform hover:scale-[1.02] transition-transform duration-500">
                    {/* Glow effect */}
                    <div className="absolute -inset-4 bg-linear-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                    
                    {/* Laptop frame */}
                    <div className="relative bg-gradient-to-b from-gray-800 via-gray-900 to-black rounded-t-2xl p-2 shadow-2xl">
                      {/* Screen bezel com bordas metálicas */}
                      <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-t-xl p-3 border border-gray-700 shadow-inner">
                        {/* Camera e sensores */}
                        <div className="flex justify-center items-center gap-2 mb-2">
                          <div className="h-0.5 w-8 bg-gray-800 rounded-full"></div>
                          <div className="h-1.5 w-1.5 rounded-full bg-gray-700 ring-1 ring-gray-600 shadow-inner"></div>
                          <div className="h-0.5 w-8 bg-gray-800 rounded-full"></div>
                        </div>
                        
                        {/* Screen content - Dashboard com reflexo de tela */}
                        <div className="relative bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-2xl">
                          {/* Reflexo de tela realista */}
                          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none z-10"></div>
                          <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-gradient-to-br from-white/5 to-transparent pointer-events-none z-10 rounded-lg"></div>
                          {/* Browser bar */}
                          <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex gap-1.5">
                              <div className="h-2 w-2 rounded-full bg-red-500"></div>
                              <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                              <div className="h-2 w-2 rounded-full bg-green-500"></div>
                            </div>
                            <div className="flex-1 bg-white dark:bg-gray-900 rounded px-2 py-1 text-[8px] text-gray-500 flex items-center gap-1">
                              <Shield className="h-2 w-2" />
                              <span>crmatelier.com.br/dashboard</span>
                            </div>
                          </div>
                          
                          {/* Dashboard content */}
                          <div className="p-4 bg-linear-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/30 dark:to-purple-950/30 h-64 sm:h-80">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-4 gap-2 mb-3">
                              <div className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm">
                                <div className="text-[8px] text-gray-600 dark:text-gray-400 mb-1">Clientes</div>
                                <div className="text-sm font-bold text-gray-900 dark:text-gray-100">156</div>
                                <div className="text-[7px] text-green-600">+12%</div>
                              </div>
                              <div className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm">
                                <div className="text-[8px] text-gray-600 dark:text-gray-400 mb-1">Ordens</div>
                                <div className="text-sm font-bold text-gray-900 dark:text-gray-100">23</div>
                                <div className="text-[7px] text-green-600">+5</div>
                              </div>
                              <div className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm">
                                <div className="text-[8px] text-gray-600 dark:text-gray-400 mb-1">Receita</div>
                                <div className="text-sm font-bold text-gray-900 dark:text-gray-100">8.4k</div>
                                <div className="text-[7px] text-green-600">+18%</div>
                              </div>
                              <div className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm">
                                <div className="text-[8px] text-gray-600 dark:text-gray-400 mb-1">Caixa</div>
                                <div className="text-sm font-bold text-gray-900 dark:text-gray-100">1.2k</div>
                                <div className="text-[7px] text-gray-600 dark:text-gray-400">12x</div>
                              </div>
                            </div>
                            
                            {/* Chart */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm h-40 sm:h-52">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[9px] font-semibold text-gray-900 dark:text-gray-100">Últimos 6 Meses</span>
                                <Calendar className="h-2.5 w-2.5 text-gray-400" />
                              </div>
                              <div className="h-28 sm:h-40 flex items-end gap-1">
                                {[65, 59, 80, 81, 56, 85].map((height, i) => (
                                  <div 
                                    key={i} 
                                    className="flex-1 bg-linear-to-t from-blue-600 to-indigo-500 rounded-t transition-all hover:from-blue-700 hover:to-indigo-600" 
                                    style={{ height: `${height}%` }}
                                  ></div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Laptop base com teclado */}
                      <div className="bg-gradient-to-b from-gray-800 via-gray-850 to-gray-900 rounded-b-2xl border-t border-gray-700 shadow-xl">
                        {/* Teclado estilizado */}
                        <div className="px-4 py-2 flex flex-col gap-1">
                          {/* Linhas do teclado */}
                          <div className="flex gap-0.5 justify-center">
                            {[...Array(14)].map((_, i) => (
                              <div key={i} className="h-1.5 w-3 bg-gray-950 rounded-sm border border-gray-800"></div>
                            ))}
                          </div>
                          <div className="flex gap-0.5 justify-center">
                            {[...Array(13)].map((_, i) => (
                              <div key={i} className="h-1.5 w-3 bg-gray-950 rounded-sm border border-gray-800"></div>
                            ))}
                          </div>
                          {/* Trackpad */}
                          <div className="mt-2 mx-auto h-6 w-20 bg-gray-850 rounded-lg border border-gray-700 shadow-inner"></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Laptop shadow/stand com perspectiva */}
                    <div className="relative mt-1">
                      <div className="h-1 bg-gradient-to-b from-gray-700 to-transparent rounded-b-3xl mx-8 shadow-2xl opacity-60"></div>
                      <div className="absolute inset-0 bg-black/20 blur-xl rounded-full mx-4"></div>
                    </div>
                  </div>
                </div>

                {/* Mobile Phone Mockup */}
                <div className="absolute bottom-0 right-0 sm:right-8 lg:right-12 z-20 transform hover:scale-105 transition-transform duration-500 animate-float-delayed">
                  {/* Glow effect */}
                  <div className="absolute -inset-3 bg-linear-to-r from-purple-600 via-pink-600 to-purple-600 rounded-3xl blur-xl opacity-30 group-hover:opacity-40 transition-opacity"></div>
                  
                  {/* Phone frame com bordas metálicas */}
                  <div className="relative bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-[2.5rem] p-2 shadow-2xl w-40 sm:w-48">
                    {/* Botões laterais */}
                    <div className="absolute left-0 top-20 w-0.5 h-8 bg-gradient-to-b from-gray-700 to-gray-800 rounded-r-sm"></div>
                    <div className="absolute left-0 top-32 w-0.5 h-6 bg-gradient-to-b from-gray-700 to-gray-800 rounded-r-sm"></div>
                    <div className="absolute right-0 top-24 w-0.5 h-12 bg-gradient-to-b from-gray-700 to-gray-800 rounded-l-sm"></div>
                    
                    {/* Screen bezel */}
                    <div className="bg-black rounded-[2.2rem] p-1.5 border border-gray-800">
                      {/* Notch realista com câmera e sensores */}
                      <div className="flex justify-center mb-0.5">
                        <div className="bg-black rounded-full px-4 py-1.5 flex items-center gap-1.5 shadow-lg">
                          <div className="h-1 w-1 rounded-full bg-blue-900 ring-1 ring-blue-800"></div>
                          <div className="h-1 w-1 rounded-full bg-gray-800"></div>
                          <div className="h-1.5 w-8 rounded-full bg-gray-900"></div>
                        </div>
                      </div>
                      
                      {/* Phone screen content com reflexo */}
                      <div className="relative bg-white dark:bg-gray-900 rounded-[1.5rem] overflow-hidden shadow-2xl h-72 sm:h-96">
                        {/* Reflexo de tela do celular */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/10 pointer-events-none z-10 rounded-[1.5rem]"></div>
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/10 to-transparent pointer-events-none z-10 rounded-tl-3xl rounded-br-[1.5rem]"></div>
                        {/* Mobile header */}
                        <div className="bg-linear-to-r from-blue-600 to-indigo-600 px-3 py-3 text-white">
                          <div className="flex items-center justify-between mb-2">
                            <Bell className="h-3 w-3" />
                            <span className="text-[9px] font-bold">Dashboard</span>
                            <Search className="h-3 w-3" />
                          </div>
                        </div>
                        
                        {/* Mobile dashboard content */}
                        <div className="p-3 bg-gray-50 dark:bg-gray-950 h-full overflow-hidden">
                          {/* Mobile stats - 2x2 grid */}
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 shadow-sm">
                              <Users className="h-3 w-3 text-blue-600 mb-1" />
                              <div className="text-xs font-bold text-gray-900 dark:text-gray-100">156</div>
                              <div className="text-[7px] text-gray-600 dark:text-gray-400">Clientes</div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 shadow-sm">
                              <FileText className="h-3 w-3 text-purple-600 mb-1" />
                              <div className="text-xs font-bold text-gray-900 dark:text-gray-100">23</div>
                              <div className="text-[7px] text-gray-600 dark:text-gray-400">Ordens</div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 shadow-sm">
                              <TrendingUp className="h-3 w-3 text-green-600 mb-1" />
                              <div className="text-xs font-bold text-gray-900 dark:text-gray-100">R$ 8.4k</div>
                              <div className="text-[7px] text-gray-600 dark:text-gray-400">Receita</div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 shadow-sm">
                              <Wallet className="h-3 w-3 text-orange-600 mb-1" />
                              <div className="text-xs font-bold text-gray-900 dark:text-gray-100">R$ 1.2k</div>
                              <div className="text-[7px] text-gray-600 dark:text-gray-400">Caixa</div>
                            </div>
                          </div>
                          
                          {/* Mobile chart */}
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 shadow-sm">
                            <div className="text-[8px] font-semibold text-gray-900 dark:text-gray-100 mb-2">Receita Mensal</div>
                            <div className="h-20 flex items-end gap-1">
                              {[65, 59, 80, 81, 56, 85].map((height, i) => (
                                <div 
                                  key={i} 
                                  className="flex-1 bg-linear-to-t from-purple-600 to-pink-500 rounded-t" 
                                  style={{ height: `${height}%` }}
                                ></div>
                              ))}
                            </div>
                          </div>

                          {/* Mobile list items */}
                          <div className="mt-3 space-y-2">
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                <Users className="h-3 w-3 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[8px] font-medium text-gray-900 dark:text-gray-100 truncate">Maria Silva</div>
                                <div className="text-[7px] text-gray-500 dark:text-gray-400">Cliente ativo</div>
                              </div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                                <FileText className="h-3 w-3 text-purple-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[8px] font-medium text-gray-900 dark:text-gray-100 truncate">OS #1234</div>
                                <div className="text-[7px] text-gray-500 dark:text-gray-400">Em andamento</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Features Cards logo abaixo dos mockups - Layout responsivo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 lg:mt-24 animate-fade-in-up animation-delay-600">
            <div className="group p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-2xl hover:scale-105 transition-all duration-500 hover:bg-linear-to-br hover:from-blue-50 hover:to-white dark:hover:from-blue-950 dark:hover:to-gray-800">
              <div className="h-12 w-12 bg-linear-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">Ordens de Serviço</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                Gerencie todos os trabalhos com timeline, status e histórico completo de alterações
              </p>
            </div>
            <div className="group p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-2xl hover:scale-105 transition-all duration-500 hover:bg-linear-to-br hover:from-green-50 hover:to-white dark:hover:from-green-950 dark:hover:to-gray-800">
              <div className="h-12 w-12 bg-linear-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100 group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors">Gestão de Clientes</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                Cadastro completo com histórico, aniversários e lembretes automáticos
              </p>
            </div>
            <div className="group p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-2xl hover:scale-105 transition-all duration-500 hover:bg-linear-to-br hover:from-purple-50 hover:to-white dark:hover:from-purple-950 dark:hover:to-gray-800">
              <div className="h-12 w-12 bg-linear-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100 group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">Controle Financeiro</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                Caixa, contas a pagar/receber e relatórios financeiros em tempo real
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Como Funciona Section */}
      <div className="px-4 py-16 sm:py-24 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <span className="px-4 py-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-sm font-semibold">
                Simples e Rápido
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Como Funciona
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Em apenas 3 passos você está pronto para gerenciar seu ateliê
            </p>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-linear-to-b from-blue-200 via-purple-200 to-pink-200"></div>

            {/* Steps */}
            <div className="space-y-12 md:space-y-20">
              {/* Step 1 */}
              <div className="relative md:grid md:grid-cols-2 md:gap-8 items-center">
                <div className="md:text-right mb-8 md:mb-0">
                  <div className="inline-block md:block mb-4">
                    <div className="h-16 w-16 bg-linear-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto md:ml-auto md:mr-0">
                      <span className="text-2xl font-bold text-white">1</span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">Crie sua Conta</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-md mx-auto md:ml-auto md:mr-0">
                    Cadastro rápido em menos de 2 minutos. Sem cartão de crédito, sem compromisso. Configure o nome do seu ateliê e já está pronto para começar.
                  </p>
                </div>
                <div className="bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-2xl p-8 border border-blue-100 dark:border-blue-900 shadow-lg">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-inner">
                    <div className="space-y-3">
                      <div className="h-3 bg-linear-to-r from-blue-400 to-blue-500 rounded w-3/4"></div>
                      <div className="h-3 bg-linear-to-r from-blue-300 to-blue-400 rounded w-1/2"></div>
                      <div className="h-10 bg-linear-to-r from-blue-600 to-indigo-600 rounded flex items-center justify-center text-white text-sm font-semibold">
                        Criar Conta →
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative md:grid md:grid-cols-2 md:gap-8 items-center">
                <div className="md:order-2 mb-8 md:mb-0">
                  <div className="inline-block md:block mb-4">
                    <div className="h-16 w-16 bg-linear-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto md:mr-auto md:ml-0">
                      <span className="text-2xl font-bold text-white">2</span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">Cadastre seus Dados</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-md mx-auto md:mr-auto md:ml-0">
                    Adicione seus clientes, serviços e preços. Importe de planilhas ou cadastre manualmente. O sistema se adapta ao seu jeito de trabalhar.
                  </p>
                </div>
                <div className="md:order-1 bg-linear-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-2xl p-8 border border-purple-100 dark:border-purple-900 shadow-lg">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-inner">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-purple-600" />
                        <div className="h-2 bg-purple-200 rounded flex-1"></div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Scissors className="h-5 w-5 text-purple-600" />
                        <div className="h-2 bg-purple-200 rounded flex-1"></div>
                      </div>
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-purple-600" />
                        <div className="h-2 bg-purple-200 rounded flex-1"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative md:grid md:grid-cols-2 md:gap-8 items-center">
                <div className="md:text-right mb-8 md:mb-0">
                  <div className="inline-block md:block mb-4">
                    <div className="h-16 w-16 bg-linear-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto md:ml-auto md:mr-0">
                      <span className="text-2xl font-bold text-white">3</span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">Comece a Gerenciar</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-md mx-auto md:ml-auto md:mr-0">
                    Crie ordens de serviço, acompanhe o fluxo de caixa, veja relatórios em tempo real. Tudo organizado e acessível de qualquer dispositivo.
                  </p>
                </div>
                <div className="bg-linear-to-br from-pink-50 to-rose-50 dark:from-pink-950 dark:to-rose-950 rounded-2xl p-8 border border-pink-100 dark:border-pink-900 shadow-lg">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-inner">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-linear-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-lg p-3 flex flex-col items-center justify-center">
                        <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400 mb-1" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">Dashboard</span>
                      </div>
                      <div className="bg-linear-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-lg p-3 flex flex-col items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400 mb-1" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">Relatórios</span>
                      </div>
                      <div className="bg-linear-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 rounded-lg p-3 flex flex-col items-center justify-center">
                        <Wallet className="h-6 w-6 text-purple-600 dark:text-purple-400 mb-1" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">Financeiro</span>
                      </div>
                      <div className="bg-linear-to-br from-orange-100 to-orange-200 dark:from-orange-900 dark:to-orange-800 rounded-lg p-3 flex flex-col items-center justify-center">
                        <FileText className="h-6 w-6 text-orange-600 dark:text-orange-400 mb-1" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">Ordens</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-16">
            <Link href="/cadastro">
              <Button size="lg" className="shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                <Zap className="h-4 w-4 mr-2" />
                Começar Agora Gratuitamente
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Screenshots/Demo Section */}
      <div id="demo" className="px-4 py-16 sm:py-24 bg-linear-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <span className="px-4 py-2 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full text-sm font-semibold">
                Interface Intuitiva
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Veja o Sistema em Ação
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Interface moderna e intuitiva, desenvolvida para facilitar seu trabalho
            </p>
          </div>

          {/* Main Dashboard Preview */}
          <div className="relative mb-12">
            <div className="absolute -inset-4 bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl blur-2xl opacity-20"></div>
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Browser Bar */}
              <div className="bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500"></div>
                  <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                </div>
                <div className="flex-1 mx-4 bg-white dark:bg-gray-800 rounded px-3 py-1 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Shield className="h-3 w-3" />
                  <span>crmatelier.com.br/dashboard</span>
                </div>
              </div>

              {/* Dashboard Content Mockup */}
              <div className="p-8 bg-linear-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/50 dark:to-purple-950/50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  {/* Stat Cards */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Total Clientes</span>
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">156</div>
                    <div className="text-xs text-green-600 mt-1">+12% este mês</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Ordens Ativas</span>
                      <FileText className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">23</div>
                    <div className="text-xs text-green-600 mt-1">+5 hoje</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Receita Mês</span>
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">R$ 8,4k</div>
                    <div className="text-xs text-green-600 mt-1">+18% vs anterior</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Caixa Hoje</span>
                      <Wallet className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">R$ 1,2k</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">12 movimentos</div>
                  </div>
                </div>

                {/* Chart Area */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Últimos 6 Meses</h3>
                    <Calendar className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="h-48 flex items-end gap-2">
                    {[65, 59, 80, 81, 56, 85].map((height, i) => (
                      <div key={i} className="flex-1 bg-linear-to-t from-blue-600 to-indigo-500 rounded-t-lg transition-all hover:from-blue-700 hover:to-indigo-600" style={{ height: `${height}%` }}></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="h-16 w-16 bg-linear-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2">Dashboard em Tempo Real</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Veja todas as métricas importantes do seu ateliê atualizadas instantaneamente
              </p>
            </div>
            <div className="text-center">
              <div className="h-16 w-16 bg-linear-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Search className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2">Busca Instantânea</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Encontre qualquer informação em segundos com a busca global inteligente (⌘K)
              </p>
            </div>
            <div className="text-center">
              <div className="h-16 w-16 bg-linear-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Sun className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2">Design Adaptável</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Interface moderna com tema claro/escuro e totalmente responsiva para mobile
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section - Funcionalidades Detalhadas */}
      <div className="px-4 py-16 sm:py-24 bg-linear-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
        {/* Decoração de fundo */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <span className="px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm font-semibold">
                Recursos Completos
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Funcionalidades que Facilitam seu Dia a Dia
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Desenvolvido especialmente para ateliês, com recursos que você realmente precisa
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Dashboard Inteligente */}
            <div className="group bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-600 transition-all duration-300 hover:-translate-y-1">
              <div className="h-14 w-14 bg-linear-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <BarChart3 className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-semibold text-xl mb-3 text-gray-900 dark:text-gray-100">Dashboard Inteligente</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                KPIs em tempo real com animações, gráficos de receita, top serviços e métricas de performance
              </p>
            </div>

            {/* Busca Global */}
            <div className="group bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-600 transition-all duration-300 hover:-translate-y-1">
              <div className="h-14 w-14 bg-linear-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Search className="h-7 w-7 text-white" />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-semibold text-xl text-gray-900 dark:text-gray-100">Busca Global</h3>
                <kbd className="px-2 py-1 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">⌘K</kbd>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                Encontre clientes, ordens e serviços instantaneamente com busca inteligente por qualquer campo
              </p>
            </div>

            {/* Tema Claro/Escuro */}
            <div className="group bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:border-amber-200 dark:hover:border-amber-600 transition-all duration-300 hover:-translate-y-1">
              <div className="h-14 w-14 bg-linear-to-br from-amber-400 to-amber-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg relative overflow-hidden">
                <Sun className="h-7 w-7 text-white absolute transition-all duration-500 group-hover:translate-y-10" />
                <Moon className="h-6 w-6 text-white absolute translate-y-10 transition-all duration-500 group-hover:translate-y-0" />
              </div>
              <h3 className="font-semibold text-xl mb-3 text-gray-900 dark:text-gray-100">Modo Claro/Escuro</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                Interface adaptável com tema claro, escuro ou automático para conforto visual em qualquer horário
              </p>
            </div>

            {/* Lembretes e Notificações */}
            <div className="group bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:border-rose-200 dark:hover:border-rose-600 transition-all duration-300 hover:-translate-y-1">
              <div className="h-14 w-14 bg-linear-to-br from-rose-500 to-rose-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg relative">
                <Bell className="h-7 w-7 text-white group-hover:animate-wiggle" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-ping"></span>
              </div>
              <h3 className="font-semibold text-xl mb-3 text-gray-900 dark:text-gray-100">Lembretes Automáticos</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                Aniversários de clientes, ordens pendentes e alertas financeiros no sidebar para não perder nada
              </p>
            </div>

            {/* Timeline de Ordens */}
            <div className="group bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:border-cyan-200 dark:hover:border-cyan-600 transition-all duration-300 hover:-translate-y-1">
              <div className="h-14 w-14 bg-linear-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Clock className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-semibold text-xl mb-3 text-gray-900 dark:text-gray-100">Timeline Completa</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                Acompanhe o histórico completo de cada ordem: criação, alterações de status, pagamentos e anotações
              </p>
            </div>

            {/* Catálogo de Serviços */}
            <div className="group bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:border-emerald-200 dark:hover:border-emerald-600 transition-all duration-300 hover:-translate-y-1">
              <div className="h-14 w-14 bg-linear-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Scissors className="h-7 w-7 text-white group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <h3 className="font-semibold text-xl mb-3 text-gray-900 dark:text-gray-100">Catálogo Inteligente</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                Serviços com preços, categorias, histórico de alterações e análise dos mais vendidos
              </p>
            </div>

            {/* Análises e Relatórios */}
            <div className="group bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:border-violet-200 dark:hover:border-violet-600 transition-all duration-300 hover:-translate-y-1">
              <div className="h-14 w-14 bg-linear-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-semibold text-xl mb-3 text-gray-900 dark:text-gray-100">Análises Avançadas</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                Gráficos de evolução, comparativos de períodos e identificação de tendências de crescimento
              </p>
            </div>

            {/* Histórico Completo */}
            <div className="group bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:border-orange-200 dark:hover:border-orange-600 transition-all duration-300 hover:-translate-y-1">
              <div className="h-14 w-14 bg-linear-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Calendar className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-semibold text-xl mb-3 text-gray-900 dark:text-gray-100">Histórico de Alterações</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                Rastreie todas as mudanças em clientes, serviços e ordens com registro de data, hora e responsável
              </p>
            </div>

            {/* Multi-organização */}
            <div className="group bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:border-teal-200 dark:hover:border-teal-600 transition-all duration-300 hover:-translate-y-1">
              <div className="h-14 w-14 bg-linear-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-semibold text-xl mb-3 text-gray-900 dark:text-gray-100">Multi-Organização</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                Dados isolados por organização com segurança RLS, permissões e controle de acesso granular
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Seção de Comparação - Antes × Depois */}
      <div className="px-4 py-16 sm:py-24 bg-linear-to-b from-white via-blue-50 to-white dark:from-gray-900 dark:via-blue-950 dark:to-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <span className="px-4 py-2 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded-full text-sm font-semibold">
                Transforme Seu Ateliê
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Antes × Depois do CRM Ateliê
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Veja a diferença que um sistema profissional faz no seu dia a dia
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Antes - Sem o Sistema */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-red-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition"></div>
              <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 border-2 border-red-200 dark:border-red-900">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                    <X className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Sem o Sistema</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Gestão manual e desorganizada</p>
                  </div>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <X className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">Planilhas desorganizadas</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Dados espalhados, difícil de encontrar</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <X className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">Perda de informações</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Anotações em papel que se perdem</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <X className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">Erros no caixa</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Dinheiro não bate no final do mês</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <X className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">Tempo perdido procurando</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Horas buscando histórico de clientes</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <X className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">Decisões no escuro</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Sem relatórios para analisar negócio</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* Depois - Com o Sistema */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-linear-to-r from-green-500 to-emerald-500 rounded-2xl blur opacity-30 group-hover:opacity-40 transition"></div>
              <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 border-2 border-green-200 dark:border-green-900">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Com o CRM Ateliê</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Tudo organizado e automatizado</p>
                  </div>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">Tudo centralizado</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Busca instantânea de qualquer informação</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">Histórico completo</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Cada cliente com todos os detalhes salvos</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">Controle financeiro preciso</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Sabe exatamente quanto entrou e saiu</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">Economia de 5h por semana</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Menos tempo em tarefas administrativas</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">Relatórios em tempo real</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Decisões baseadas em dados concretos</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Stats de Impacto */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-5xl mx-auto">
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="text-4xl font-bold text-blue-600 mb-2">5h</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Economizadas por semana</div>
            </div>
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="text-4xl font-bold text-green-600 mb-2">95%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Menos erros no caixa</div>
            </div>
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="text-4xl font-bold text-purple-600 mb-2">3x</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Mais rápido para buscar</div>
            </div>
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="text-4xl font-bold text-orange-600 mb-2">100%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Dados organizados</div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="px-4 py-16 sm:py-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Escolha o Plano Ideal
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Comece grátis e escale conforme seu negócio cresce
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Plano Free */}
            <div className="group bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-8 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-xl transition-all duration-500 hover:-translate-y-2">
              <div className="mb-6 mt-2">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Free</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">R$ 0</span>
                  <span className="text-gray-600 dark:text-gray-400">/mês</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Para começar</p>
              </div>

              <Link href="/cadastro">
                <Button variant="outline" className="w-full mb-6">
                  Começar Grátis
                </Button>
              </Link>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Até 50 clientes</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Até 2 usuários</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">100 ordens/mês</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">500 MB armazenamento</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Dashboard básico</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Controle de caixa</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Contas a pagar/receber</span>
                </div>
                <div className="flex items-start gap-3">
                  <X className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Relatórios avançados</span>
                </div>
                <div className="flex items-start gap-3">
                  <X className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Exportação de dados</span>
                </div>
                <div className="flex items-start gap-3">
                  <X className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Automações</span>
                </div>
              </div>
            </div>

            {/* Plano Pro */}
            <div className="group bg-linear-to-b from-blue-50 to-white dark:from-blue-950 dark:to-gray-800 border-2 border-blue-500 dark:border-blue-600 rounded-2xl p-8 relative shadow-xl hover:shadow-2xl transform scale-105 hover:scale-110 transition-all duration-500 hover:-translate-y-2">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-linear-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold px-4 py-1 rounded-full shadow-lg whitespace-nowrap">
                ⭐ Mais Popular
              </div>

              <div className="mb-6 mt-2">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Pro</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">R$ 59,90</span>
                  <span className="text-gray-600 dark:text-gray-400">/mês</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">ou R$ 599/ano (2 meses grátis)</p>
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
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Até 200 clientes</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Até 5 usuários</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">1.000 ordens/mês</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">5 GB armazenamento</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Tudo do plano Free +</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Relatórios avançados</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Exportação Excel/PDF</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Dashboards personalizados</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Lembretes automáticos</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Campos customizados</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Suporte prioritário (12h)</span>
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
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Todos os planos incluem 14 dias de teste grátis • Sem cartão de crédito • Cancele quando quiser
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section - Modernizado */}
      <div className="px-4 py-20 bg-linear-to-r from-blue-600 via-indigo-700 to-purple-800 text-white relative overflow-hidden">
        {/* Background decorativo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-overlay filter blur-3xl opacity-20"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-overlay filter blur-3xl opacity-20"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">Infraestrutura de Qualidade</h2>
            <p className="text-blue-100 text-lg">Construído com as melhores tecnologias do mercado</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300 hover:shadow-2xl">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-linear-to-r from-green-400 to-emerald-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-5xl font-bold mb-2 bg-linear-to-r from-white to-blue-100 bg-clip-text text-transparent">99.9%</div>
                <div className="text-blue-100 font-medium">Alta Disponibilidade</div>
                <div className="text-blue-200 text-xs mt-1">Supabase Infrastructure</div>
              </div>
            </div>

            <div className="group bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300 hover:shadow-2xl">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-linear-to-r from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="text-5xl font-bold mb-2 bg-linear-to-r from-white to-blue-100 bg-clip-text text-transparent">&lt;100ms</div>
                <div className="text-blue-100 font-medium">Resposta Rápida</div>
                <div className="text-blue-200 text-xs mt-1">Edge Functions</div>
              </div>
            </div>

            <div className="group bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300 hover:shadow-2xl">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-linear-to-r from-purple-400 to-pink-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="text-5xl font-bold mb-2 bg-linear-to-r from-white to-blue-100 bg-clip-text text-transparent">24/7</div>
                <div className="text-blue-100 font-medium">Suporte Ativo</div>
                <div className="text-blue-200 text-xs mt-1">Email & Documentação</div>
              </div>
            </div>

            <div className="group bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300 hover:shadow-2xl">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-linear-to-r from-orange-400 to-red-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="text-5xl font-bold mb-2 bg-linear-to-r from-white to-blue-100 bg-clip-text text-transparent">SSL</div>
                <div className="text-blue-100 font-medium">Segurança Total</div>
                <div className="text-blue-200 text-xs mt-1">Criptografia & LGPD</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm font-medium mb-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Tire suas dúvidas
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Perguntas Frequentes
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Tudo que você precisa saber sobre o CRM Atelier
            </p>
          </div>

          <div className="space-y-4">
            <div className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 sm:p-8 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600">
              <div className="flex gap-4">
                <div className="shrink-0 w-12 h-12 rounded-lg bg-linear-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-xl mb-3 text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Preciso de cartão de crédito para começar?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    Não! O plano Free é 100% gratuito e não requer cartão de crédito. Você pode começar a usar agora mesmo.
                  </p>
                </div>
              </div>
            </div>

            <div className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 sm:p-8 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600">
              <div className="flex gap-4">
                <div className="shrink-0 w-12 h-12 rounded-lg bg-linear-to-r from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-xl mb-3 text-gray-900 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    O que acontece se eu atingir o limite de clientes?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    Implementamos soft delete: clientes arquivados ainda contam no limite. Você pode fazer upgrade do plano ou restaurar clientes arquivados. Isso preserva seu histórico e evita perda de dados.
                  </p>
                </div>
              </div>
            </div>

            <div className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 sm:p-8 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-600">
              <div className="flex gap-4">
                <div className="shrink-0 w-12 h-12 rounded-lg bg-linear-to-r from-red-500 to-orange-600 flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-xl mb-3 text-gray-900 dark:text-gray-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                    Posso cancelar a qualquer momento?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    Sim! Não há multa ou fidelidade. Seus dados ficam disponíveis por 30 dias após cancelamento para exportação.
                  </p>
                </div>
              </div>
            </div>

            <div className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 sm:p-8 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600">
              <div className="flex gap-4">
                <div className="shrink-0 w-12 h-12 rounded-lg bg-linear-to-r from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-xl mb-3 text-gray-900 dark:text-gray-100 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                    Meus dados são seguros?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    Sim! Usamos Supabase com criptografia SSL/TLS, Row Level Security (RLS) para isolamento de dados e backup automático. Estamos em conformidade com a LGPD.
                  </p>
                </div>
              </div>
            </div>

            <div className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 sm:p-8 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600">
              <div className="flex gap-4">
                <div className="shrink-0 w-12 h-12 rounded-lg bg-linear-to-r from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-xl mb-3 text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Quando o plano Enterprise estará disponível?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    Estamos desenvolvendo ativamente! Recursos como WhatsApp API, múltiplas filiais e white label estarão disponíveis em breve. Entre em contato para saber mais.
                  </p>
                </div>
              </div>
            </div>

            <div className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 sm:p-8 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-200 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-600">
              <div className="flex gap-4">
                <div className="shrink-0 w-12 h-12 rounded-lg bg-linear-to-r from-pink-500 to-rose-600 flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-xl mb-3 text-gray-900 dark:text-gray-100 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                    Posso testar o plano Pro gratuitamente?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    Sim! Todos os planos pagos incluem 14 dias de teste grátis, sem necessidade de cartão de crédito.
                  </p>
                </div>
              </div>
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
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
              <p className="text-center md:text-left">
                &copy; {new Date().getFullYear()} CRM Atelier. Todos os direitos reservados.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Desenvolvido por</span>
                <a 
                  href="https://omegasistem.com.br" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white font-semibold hover:text-blue-400 transition-colors flex items-center gap-2 group"
                >
                  <span className="relative">
                    Omega Sistem
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-300"></span>
                  </span>
                  <svg className="h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Sticky CTA - Aparece ao rolar */}
      <div className={`sticky-cta ${showStickyCTA ? 'visible' : ''}`}>
        <div className="bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-2xl border-t-4 border-white">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="font-bold text-lg mb-1">Pronto para transformar seu ateliê?</p>
              <p className="text-sm text-blue-100">Comece grátis agora - sem cartão de crédito!</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/cadastro" onClick={triggerConfetti}>
                <Button 
                  size="lg" 
                  className="bg-white text-blue-600 hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 font-bold"
                >
                  <Zap className="h-5 w-5 mr-2" />
                  Começar Grátis →
                </Button>
              </Link>
              <button 
                className="text-white hover:text-gray-200 text-sm underline"
                onClick={() => setShowStickyCTA(false)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
