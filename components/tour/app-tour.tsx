'use client'

import { useEffect, useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import Joyride, { type CallBackProps, STATUS, type Step } from 'react-joyride'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const TOUR_KEY = 'meu-atelier-tour-v2'

function greetingByHour(hour: number) {
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

function WelcomeModal({ open, onStart }: { open: boolean; onStart: () => void }) {
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: async () => { const r = await fetch('/api/me'); return r.ok ? r.json() : null },
    enabled: open,
  })

  const first = (me?.name as string | undefined)?.split(' ')[0]
  const orgName = me?.organizationName as string | undefined
  const greeting = greetingByHour(new Date().getHours())

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-xl">
            {greeting}{first ? `, ${first}` : ''}! 👋
          </DialogTitle>
          <DialogDescription className="pt-2 text-[14px] leading-relaxed">
            {orgName
              ? <>Seja muito bem-vindo ao Meu Atelier. O <strong>{orgName}</strong> agora tem um sistema completo para organizar clientes, serviços, ordens e financeiro.</>
              : <>Seja muito bem-vindo ao Meu Atelier — seu sistema completo para organizar clientes, serviços, ordens e financeiro.</>}
            {' '}Vamos fazer um tour rápido pelas principais funcionalidades? Leva só 2 minutos.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button onClick={onStart} className="w-full sm:w-auto">Começar tour</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const steps: Step[] = [
  {
    target: '[data-tour="sidebar"]',
    content: (
      <div>
        <h3 className="font-semibold text-[15px] mb-2">Menu de Navegação</h3>
        <p className="text-[13px] text-gray-500 leading-relaxed">
          Daqui você acessa todas as seções do sistema. O menu fica sempre visível no lado esquerdo da tela.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '[data-tour="nav-dashboard"]',
    content: (
      <div>
        <h3 className="font-semibold text-[15px] mb-2">📊 Dashboard</h3>
        <p className="text-[13px] text-gray-500 leading-relaxed">
          Visão geral do seu negócio: faturamento do mês, ordens em andamento, aniversariantes do mês e alertas de pagamentos vencendo.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '[data-tour="nav-clientes"]',
    content: (
      <div>
        <h3 className="font-semibold text-[15px] mb-2">👥 Clientes</h3>
        <p className="text-[13px] text-gray-500 leading-relaxed">
          Cadastre seus clientes com nome, telefone, endereço e aniversário. Veja o histórico completo de ordens e o total gasto por cada cliente.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '[data-tour="nav-servicos"]',
    content: (
      <div>
        <h3 className="font-semibold text-[15px] mb-2">✂️ Serviços</h3>
        <p className="text-[13px] text-gray-500 leading-relaxed">
          Monte seu catálogo com preços, tempo estimado e nível de dificuldade. Com o <strong>controle de estoque ativo</strong>, você também vincula os materiais do catálogo a cada serviço — o custo é calculado automaticamente.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '[data-tour="nav-ordens"]',
    content: (
      <div>
        <h3 className="font-semibold text-[15px] mb-2">📋 Ordens de Serviço</h3>
        <p className="text-[13px] text-gray-500 leading-relaxed">
          O coração do sistema! Registre trabalhos, acompanhe o status, aplique descontos, imprima comprovantes e envie pelo WhatsApp. Com o controle de estoque ativo, os <strong>materiais são baixados automaticamente</strong> ao concluir uma ordem.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '[data-tour="nav-financeiro"]',
    content: (
      <div>
        <h3 className="font-semibold text-[15px] mb-2">💰 Financeiro</h3>
        <p className="text-[13px] text-gray-500 leading-relaxed">
          Controle completo: <strong>Caixa</strong> para o dia a dia, <strong>Contas a Pagar</strong> (com vínculo ao fornecedor) e <strong>Contas a Receber</strong> — tudo com gráficos de fluxo de caixa.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '[data-tour="nav-estoque"]',
    content: (
      <div>
        <h3 className="font-semibold text-[15px] mb-2">📦 Estoque</h3>
        <p className="text-[13px] text-gray-500 leading-relaxed">
          Gerencie seus materiais e insumos com 4 seções:
        </p>
        <ul className="text-[12px] text-gray-500 mt-2 space-y-1 list-none">
          <li>• <strong>Produtos</strong> — catálogo com quantidade atual e mínima</li>
          <li>• <strong>Entradas</strong> — registre compras e reposições</li>
          <li>• <strong>Relatórios</strong> — histórico de movimentações e saídas</li>
          <li>• <strong>Fornecedores</strong> — cadastro de seus fornecedores</li>
        </ul>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '[data-tour="nav-configuracoes"]',
    content: (
      <div>
        <h3 className="font-semibold text-[15px] mb-2">⚙️ Configurações</h3>
        <p className="text-[13px] text-gray-500 leading-relaxed">
          Personalize sua conta: logo, contato, métodos de pagamento e muito mais. Em <strong>Sistema</strong> você ativa o <strong>Controle de Estoque</strong>. Em <strong>Notificações</strong> você define uma <strong>mensagem padrão</strong> que aparece automaticamente em todas as novas ordens de serviço.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '[data-tour="user-menu"]',
    content: (
      <div>
        <h3 className="font-semibold text-[15px] mb-2">👤 Seu Perfil</h3>
        <p className="text-[13px] text-gray-500 leading-relaxed">
          Acesse seu perfil, altere sua senha e veja suas informações de conta clicando aqui.
        </p>
      </div>
    ),
    placement: 'bottom-end',
    disableBeacon: true,
  },
  {
    target: 'body',
    content: (
      <div>
        <h3 className="font-semibold text-base mb-2">Pronto! 🎉</h3>
        <p className="text-sm text-gray-500 leading-relaxed">
          Você já conhece o Meu Atelier. Comece cadastrando seus <strong>serviços</strong> e <strong>clientes</strong> para criar sua primeira ordem de serviço!
        </p>
        <p className="text-[12px] text-gray-400 mt-2 leading-relaxed">
          Dica: para usar o controle de estoque, cadastre seus <strong>produtos</strong>, ative o módulo em <strong>Configurações → Sistema</strong> e vincule materiais aos seus serviços.
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Clique em &quot;Ver tour&quot; no rodapé do menu para rever este guia a qualquer momento.
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
]

export function AppTour() {
  const [run, setRun] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const completed = localStorage.getItem(TOUR_KEY)
    if (!completed) {
      const timer = setTimeout(() => setShowWelcome(true), 800)
      return () => clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    // "Ver tour" no rodapé do menu — pula direto pro Joyride, sem o modal de
    // boas-vindas (que faz sentido só no primeiro acesso de verdade)
    const handleStart = () => setRun(true)
    window.addEventListener('start-tour', handleStart)
    return () => window.removeEventListener('start-tour', handleStart)
  }, [])

  const handleStartTour = useCallback(() => {
    setShowWelcome(false)
    setRun(true)
  }, [])

  const handleCallback = useCallback((data: CallBackProps) => {
    const { status } = data
    if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
      localStorage.setItem(TOUR_KEY, 'true')
      setRun(false)
    }
  }, [])

  if (!mounted) return null

  return (
    <>
      <WelcomeModal open={showWelcome} onStart={handleStartTour} />
      <Joyride
        steps={steps}
        run={run}
        continuous
        showProgress
        showSkipButton
        disableOverlayClose
        scrollToFirstStep
        spotlightClicks={false}
        callback={handleCallback}
        locale={{
          back: 'Voltar',
          close: 'Fechar',
          last: 'Concluir',
          next: 'Próximo',
          nextLabelWithProgress: 'Próximo ({step} de {steps})',
          open: 'Abrir',
          skip: 'Pular tour',
        }}
        styles={{
          options: {
            primaryColor: '#6366f1',
            backgroundColor: '#ffffff',
            textColor: '#111827',
            arrowColor: '#ffffff',
            overlayColor: 'rgba(0,0,0,0.5)',
            zIndex: 10000,
          },
          tooltip: {
            borderRadius: 12,
            padding: '20px 24px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            maxWidth: 340,
          },
          tooltipContent: {
            padding: 0,
          },
          buttonNext: {
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            padding: '8px 16px',
            backgroundColor: '#6366f1',
          },
          buttonBack: {
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            color: '#6b7280',
            marginRight: 8,
            backgroundColor: 'transparent',
          },
          buttonSkip: {
            fontSize: 12,
            color: '#9ca3af',
          },
          buttonClose: {
            top: 12,
            right: 12,
            color: '#9ca3af',
            width: 16,
            height: 16,
          },
          spotlight: {
            borderRadius: 10,
          },
        }}
      />
    </>
  )
}
