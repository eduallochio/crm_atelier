'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layouts/header'
import { MASTER_DETAIL_CSS } from '@/components/dashboard/master-detail-css'
import {
  Printer,
  LayoutDashboard,
  Users,
  Scissors,
  FileText,
  DollarSign,
  Package,
  Settings,
  ImageIcon,
  Wallet,
  TrendingDown,
  TrendingUp,
  PackageOpen,
  BarChart3,
  Truck,
  Bell,
  Shield,
  UserPlus,
  ArrowLeftRight,
  CreditCard,
  QrCode,
} from 'lucide-react'

const TOC: [string, string][] = [
  ['1', 'Visão geral'],
  ['2', 'Dashboard'],
  ['3', 'Clientes'],
  ['4', 'Serviços'],
  ['5', 'Ordens de serviço'],
  ['6', 'Financeiro'],
  ['6.1', 'Fluxo de caixa'],
  ['6.2', 'Caixas e chave PIX'],
  ['7', 'Estoque e fornecedores'],
  ['8', 'Alertas e notificações'],
  ['9', 'Configurações'],
  ['10', 'Dicas e perguntas'],
]
const anchor = (n: string) => `s-${n.replace('.', '-')}`

function ScreenshotPlaceholder({ label }: { label: string }) {
  return (
    <div className="aj-shot my-5 flex h-52 flex-col items-center justify-center gap-2 print:h-56">
      <ImageIcon className="h-7 w-7 text-[#C8714A]/50 print:hidden" aria-hidden="true" />
      <p className="px-4 text-center text-[13px] text-muted-foreground">{label}</p>
    </div>
  )
}

/** Exibe a imagem real se disponível; caso contrário, mostra o placeholder */
function Screenshot({ src, alt, label }: { src: string; alt: string; label: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) return <ScreenshotPlaceholder label={label} />
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      // a imagem pode falhar antes da hidratação, quando o onError ainda não existe
      ref={(img) => { if (img?.complete && img.naturalWidth === 0) setFailed(true) }}
      src={src}
      alt={alt}
      className="my-5 w-full rounded-lg border border-border/70 shadow-sm print:border-gray-300 print:shadow-none"
      onError={() => setFailed(true)}
    />
  )
}

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  const [n, ...rest] = title.split(' ')
  return (
    <div id={anchor(n.replace(/\.$/, ''))} className="aj-sec mb-5 flex scroll-mt-24 items-center gap-3 pb-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#C8714A]/12 text-[#8A4B2C] dark:text-[#E39B78]">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <h2 className="font-serif-display text-[28px] leading-tight text-foreground">
        <span className="mr-2 text-[#C8714A]">{n.replace(/\.$/, '')}</span>{rest.join(' ')}
      </h2>
    </div>
  )
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="aj-step mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12.5px] font-bold tabular-nums">
        {n}
      </span>
      <p className="text-[14.5px] leading-relaxed text-foreground/85">{text}</p>
    </div>
  )
}

function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="aj-list mb-5 space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="text-[14.5px] leading-relaxed text-foreground/85">{item}</li>
      ))}
    </ul>
  )
}

export default function AjudaPage() {
  const [active, setActive] = useState('1')

  useEffect(() => {
    const els = TOC.map(([n]) => document.getElementById(anchor(n))).filter(Boolean) as HTMLElement[]
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (vis[0]) setActive(vis[0].target.id.replace('s-', '').replace('-', '.'))
      },
      { rootMargin: '0px 0px -70% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  const go = (n: string) => {
    document.getElementById(anchor(n))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActive(n)
  }

  return (
    <>
      <style>{MASTER_DETAIL_CSS + AJ_CSS + `
        @media print {
          body * { visibility: hidden; }
          #manual-content, #manual-content * { visibility: visible; }
          #manual-content { position: absolute; left: 0; top: 0; width: 100%; color: #2C1810; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
          @page { margin: 20mm 15mm; size: A4; }
        }
      `}</style>

      <div className="flex min-h-full flex-col">
        <div className="no-print">
          <Header title="Ajuda" description="Manual do Meu Atelier, módulo por módulo" />
        </div>

        <div className="mx-auto flex w-full max-w-6xl flex-1 gap-8 px-4 py-6 sm:px-6 lg:py-8">
          {/* Índice fixo ao lado */}
          <aside className="no-print hidden w-60 shrink-0 lg:block">
            <nav aria-label="Seções do manual" className="sticky top-6">
              <p className="fin-cap mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Neste manual</p>
              <ol className="aj-toc">
                {TOC.map(([n, t]) => (
                  <li key={n}>
                    <a href={`#${anchor(n)}`} onClick={(e) => { e.preventDefault(); go(n) }}
                      className={`aj-toc-a ${n.includes('.') ? 'pl-7' : ''} ${active === n ? 'is-on' : ''}`} aria-current={active === n ? 'location' : undefined}>
                      <span className="w-7 shrink-0 tabular-nums text-[#C8714A]">{n}</span>{t}
                    </a>
                  </li>
                ))}
              </ol>
              <button type="button" onClick={() => window.print()} className="cli-ghost mt-5 w-full justify-center">
                <Printer className="h-4 w-4" aria-hidden="true" />Imprimir / PDF
              </button>
            </nav>
          </aside>

          {/* Conteúdo do manual */}
          <div id="manual-content" className="aj-paper min-w-0 flex-1 space-y-14 px-5 py-8 sm:px-10">

            {/* Capa */}
            <div className="aj-cover pb-10 text-center">
              <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#C8714A]/12 text-[#8A4B2C] dark:text-[#E39B78]">
                <Scissors className="h-7 w-7" aria-hidden="true" />
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Manual de utilização · versão 3.1</p>
              <h1 className="font-serif-display mt-2 text-[44px] leading-none text-foreground sm:text-[56px]">Meu <em className="text-[#C8714A]">Atelier</em></h1>
              <p className="mx-auto mt-3 max-w-md text-[14.5px] leading-relaxed text-muted-foreground">Tudo o que o sistema faz, explicado passo a passo, do cadastro da cliente ao fechamento do caixa.</p>
              <div className="no-print mt-5 flex justify-center lg:hidden">
                <button type="button" onClick={() => window.print()} className="cli-ghost">
                  <Printer className="h-4 w-4" aria-hidden="true" />Imprimir / PDF
                </button>
              </div>
              <Screenshot src="/manual/login.png" alt="Tela de login" label="[Captura de tela da tela inicial / login do sistema]" />
            </div>

            {/* Índice (celular e impressão) */}
            <nav aria-label="Índice" className="aj-note p-5 lg:hidden print:block">
              <h2 className="font-serif-display mb-3 text-2xl text-foreground">Índice</h2>
              <ol className="grid gap-x-4 gap-y-1.5 text-[14px] sm:grid-cols-2">
                {TOC.map(([n, t]) => (
                  <li key={n}>
                    <a href={`#${anchor(n)}`} onClick={(e) => { e.preventDefault(); go(n) }} className="flex gap-2 text-foreground/85 hover:text-[#8A4B2C] dark:hover:text-[#E39B78]">
                      <span className="w-7 shrink-0 font-semibold tabular-nums text-[#C8714A]">{n}</span>{t}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            {/* 1. Visão Geral */}
            <section>
              <SectionHeader icon={Shield} title="1. Visão Geral do Sistema" />
              <p className="text-[14.5px] text-foreground/85 leading-relaxed mb-4">
                O <strong>Meu Atelier</strong> é um sistema de gestão completo desenvolvido especialmente para ateliês de costura, bordado e artesanato. Com ele você centraliza o cadastro de clientes, serviços, ordens de serviço, controle financeiro e de estoque em um único lugar.
              </p>
              <FeatureList items={[
                'Acesso via navegador web — sem necessidade de instalação',
                'Dados seguros e isolados por organização',
                'Interface responsiva para uso em computador e tablet',
                'Tour guiado integrado para novos usuários',
              ]} />
              <div className="grid gap-3 sm:grid-cols-2 mb-4">
                <div className="aj-note p-3">
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">Plano Free</p>
                  <p className="text-[13.5px] text-emerald-700 dark:text-emerald-400">50 clientes · 20 serviços · 100 ordens · 2 usuários</p>
                </div>
                <div className="aj-note p-3">
                  <p className="text-xs font-semibold text-[#8A4B2C] dark:text-[#E39B78] mb-1">Plano Pro</p>
                  <p className="text-[13.5px] text-[#8A4B2C] dark:text-[#E39B78]">Clientes ilimitados · Serviços ilimitados · Ordens ilimitadas · 3 usuários</p>
                </div>
              </div>
              <Screenshot src="/manual/dashboard.png" alt="Menu lateral do sistema" label="[Captura de tela do menu lateral (sidebar) com todos os módulos visíveis]" />
            </section>

            {/* 2. Dashboard */}
            <section className="page-break">
              <SectionHeader icon={LayoutDashboard} title="2. Dashboard — a bancada do dia" />
              <p className="text-[14.5px] text-foreground/85 leading-relaxed mb-4">
                O Dashboard é a primeira tela depois do login. Ele responde a uma pergunta: <strong>o que precisa sair do ateliê hoje?</strong> Em cima ficam as entregas da semana, logo abaixo o faturamento do mês com a meta, e por último o caixa, os lembretes e o que já aconteceu no dia.
              </p>

              <h3 className="aj-h3">Entregas da semana</h3>
              <p className="text-[14.5px] text-foreground/85 leading-relaxed mb-2">
                As ordens em aberto aparecem em quatro colunas, pelo prazo de entrega:
              </p>
              <FeatureList items={[
                'Atrasadas — o prazo já passou e a ordem ainda não foi concluída',
                'Hoje — entregas marcadas para hoje',
                'Amanhã — entregas de amanhã',
                'Próximos dias — o que vence entre 2 e 7 dias',
              ]} />
              <div className="space-y-2 mb-4">
                <Step n={1} text="Clique numa ordem para abrir as ações rápidas." />
                <Step n={2} text="'Avisar' abre o WhatsApp com a mensagem pronta para a cliente (aparece quando ela tem telefone cadastrado)." />
                <Step n={3} text="'Concluir' finaliza a ordem. Se ainda houver saldo a pagar, o sistema pergunta se a cliente já pagou e em qual forma." />
              </div>

              <h3 className="aj-h3 mt-4">Faturamento e meta do mês</h3>
              <p className="text-[14.5px] text-foreground/85 leading-relaxed mb-2">
                A faixa de faturamento soma as ordens concluídas no mês e compara com o mês passado. A meta aparece como uma linha costurada: a agulha marca onde você está, e o texto diz quanto falta e quanto precisa entrar por dia até o fim do mês.
              </p>
              <div className="space-y-2 mb-4">
                <Step n={1} text="Clique em 'Definir meta' (ou 'Mudar a meta', se já existir uma)." />
                <Step n={2} text="Digite o valor (ex: 6.000,00) e clique em 'Salvar'." />
                <Step n={3} text="O progresso se atualiza sozinho conforme as ordens são concluídas." />
              </div>
              <div className="aj-note p-3.5 text-[13.5px] mb-4">
                <strong>Dica:</strong> Para tirar a meta, salve com o valor 0.
              </div>

              <h3 className="aj-h3 mt-4">Caixa, lembretes e o dia até agora</h3>
              <div className="grid gap-3 sm:grid-cols-3 mb-4">
                <div className="aj-card p-3">
                  <p className="text-[13.5px] font-semibold text-emerald-700 dark:text-emerald-400 mb-1">Caixa</p>
                  <p className="text-[12.5px] text-muted-foreground">Quanto há na gaveta agora, com entradas, saídas e sangrias. Sem caixa aberto, mostra o atalho para abrir.</p>
                </div>
                <div className="aj-card p-3">
                  <p className="text-[13.5px] font-semibold text-[#8A4B2C] dark:text-[#E39B78] mb-1">Lembretes</p>
                  <p className="text-[12.5px] text-muted-foreground">Aniversários de clientes, ordens concluídas a receber, clientes sumidas há mais de 90 dias e materiais acabando.</p>
                </div>
                <div className="aj-card p-3">
                  <p className="text-[13.5px] font-semibold text-[#8A4B2C] dark:text-[#E39B78] mb-1">O dia até agora</p>
                  <p className="text-[12.5px] text-muted-foreground">A linha do tempo do que foi feito hoje: ordens criadas, concluídas, pagamentos e cadastros.</p>
                </div>
              </div>
              <Screenshot src="/manual/dashboard.png" alt="Dashboard" label="[Captura de tela do Dashboard com as entregas da semana, a faixa de faturamento e os lembretes]" />
            </section>

            {/* 3. Clientes */}
            <section className="page-break">
              <SectionHeader icon={Users} title="3. Clientes" />
              <p className="text-[14.5px] text-foreground/85 leading-relaxed mb-4">
                Gerencie todo o cadastro de clientes do ateliê. O histórico de ordens e o valor total gasto por cada cliente ficam disponíveis automaticamente.
              </p>
              <FeatureList items={[
                'Cadastro com nome, telefone, e-mail, endereço e data de aniversário',
                'Busca e filtragem por nome ou telefone',
                'Visualização do histórico completo de ordens do cliente',
                'Valor total gasto pelo cliente (soma de todas as ordens concluídas)',
                'Exportação da lista em Excel ou PDF',
                'Soft delete — clientes removidos ficam na lixeira (preserva histórico)',
              ]} />
              <Screenshot src="/manual/clientes.png" alt="Lista de clientes" label="[Captura de tela da lista de clientes com tabela e botão 'Novo Cliente']" />
              <h3 className="aj-h3 mt-4">Como cadastrar um cliente</h3>
              <div className="space-y-2">
                <Step n={1} text="Clique em 'Novo Cliente' no canto superior direito da tela." />
                <Step n={2} text="Preencha o nome (obrigatório) e os demais campos — telefone, e-mail, endereço e aniversário." />
                <Step n={3} text="Clique em 'Cadastrar'. O cliente aparecerá imediatamente na lista." />
              </div>
              <Screenshot src="/manual/clientes-form.png" alt="Formulário de cadastro de cliente" label="[Captura de tela do formulário de cadastro de cliente]" />
            </section>

            {/* 4. Serviços */}
            <section className="page-break">
              <SectionHeader icon={Scissors} title="4. Serviços" />
              <p className="text-[14.5px] text-foreground/85 leading-relaxed mb-4">
                Monte o catálogo de serviços oferecidos pelo ateliê. Os serviços cadastrados aqui aparecem automaticamente na criação de ordens de serviço.
              </p>
              <FeatureList items={[
                'Nome, descrição, categoria e preço de venda',
                'Tempo estimado, tempo mínimo e máximo de execução',
                'Nível de dificuldade (Fácil / Médio / Difícil)',
                'Observações técnicas para referência interna',
                'Vinculação de materiais do catálogo de estoque (requer Controle de Estoque ativo)',
                'Cálculo automático do custo dos materiais e margem de lucro',
                'Ativar/desativar serviço sem excluir do histórico',
              ]} />
              <Screenshot src="/manual/servicos.png" alt="Catálogo de serviços" label="[Captura de tela do catálogo de serviços com cards/tabela]" />
              <h3 className="aj-h3 mt-4">Vinculando materiais a um serviço</h3>
              <p className="text-[13.5px] text-muted-foreground mb-2">
                Esta função requer o <strong>Controle de Estoque</strong> ativo em Configurações → Sistema.
              </p>
              <div className="space-y-2">
                <Step n={1} text="Abra o formulário de novo serviço ou edição." />
                <Step n={2} text="Na seção 'Materiais e Custo', clique em 'Selecionar produto...' e busque o material." />
                <Step n={3} text="Informe a quantidade necessária e clique no botão '+' para adicionar." />
                <Step n={4} text="O custo total e a margem de lucro são calculados automaticamente." />
                <Step n={5} text="Ao criar uma OS com esse serviço, os materiais são pré-populados automaticamente." />
              </div>
              <Screenshot src="/manual/servicos-form.png" alt="Formulário de serviço com materiais" label="[Captura de tela do formulário de serviço com seção de materiais vinculados]" />
            </section>

            {/* 5. Ordens de Serviço */}
            <section className="page-break">
              <SectionHeader icon={FileText} title="5. Ordens de Serviço" />
              <p className="text-[14.5px] text-foreground/85 leading-relaxed mb-4">
                O módulo central do sistema. Registre, acompanhe e gerencie todos os trabalhos do ateliê. Uma ordem de serviço (OS) vincula cliente, serviços, prazo, pagamento e histórico de andamento.
              </p>
              <FeatureList items={[
                'Vinculação de cliente e um ou mais serviços por OS',
                'Controle de status: Pendente → Em Andamento → Concluído / Cancelado',
                'Data de abertura e prazo de entrega com alertas de atraso',
                'Desconto em valor fixo (R$) ou percentual (%)',
                'Registro de forma de pagamento e valor pago',
                'Campo de observações (com possibilidade de mensagem padrão automática)',
                'Histórico de alterações de status da OS',
                'Impressão de comprovante térmico em PDF',
                'Envio por WhatsApp com resumo da OS',
                'Baixa automática de estoque ao concluir (requer Controle de Estoque ativo)',
              ]} />
              <Screenshot src="/manual/ordens.png" alt="Lista de ordens de serviço" label="[Captura de tela da lista de ordens de serviço com filtros de status]" />

              <h3 className="aj-h3 mt-5">Como criar uma Ordem de Serviço</h3>
              <div className="space-y-2">
                <Step n={1} text="Clique em 'Nova OS' na tela de Ordens de Serviço." />
                <Step n={2} text="Selecione o cliente. Se não existir, cadastre-o antes na seção Clientes." />
                <Step n={3} text="Adicione um ou mais serviços clicando em 'Selecionar serviço...' e informando a quantidade." />
                <Step n={4} text="Preencha a data de entrega prevista e a forma de pagamento." />
                <Step n={5} text="Se houver desconto, informe o valor ou percentual no campo correspondente." />
                <Step n={6} text="Clique em 'Criar Ordem'. O comprovante em PDF será gerado automaticamente." />
              </div>
              <Screenshot src="/manual/ordens-form.png" alt="Formulário de nova OS" label="[Captura de tela do formulário de nova OS com campos preenchidos]" />

              <h3 className="aj-h3 mt-5">Materiais utilizados na OS</h3>
              <p className="text-[13.5px] text-muted-foreground mb-2">
                Visível apenas quando o Controle de Estoque está ativo em Configurações → Sistema.
              </p>
              <FeatureList items={[
                'Se o serviço tiver materiais vinculados, eles são pré-populados automaticamente na OS',
                'É possível adicionar ou remover materiais manualmente antes de salvar',
                'Ao marcar a OS como Concluída, os materiais são baixados do estoque automaticamente',
                'A baixa é registrada em Estoque → Relatórios com referência à OS',
              ]} />
              <Screenshot src="/manual/ordens-materiais.png" alt="OS com materiais" label="[Captura de tela da OS com seção de materiais expandida]" />
            </section>

            {/* 6. Financeiro */}
            <section className="page-break">
              <SectionHeader icon={DollarSign} title="6. Financeiro" />
              <p className="text-[14.5px] text-foreground/85 leading-relaxed mb-4">
                Controle financeiro completo com três subseções: Caixa, Contas a Pagar e Contas a Receber.
              </p>

              <div className="grid gap-3 sm:grid-cols-3 mb-4">
                <div className="aj-card p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="h-4 w-4 text-[#C8714A]" aria-hidden="true" />
                    <span className="text-[14.5px] font-semibold text-foreground">Caixa</span>
                  </div>
                  <p className="text-[12.5px] text-muted-foreground">Abertura e fechamento diário, movimentações de entrada e saída, conferência de caixa.</p>
                </div>
                <div className="aj-card p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="h-4 w-4 text-red-700 dark:text-red-400 dark:text-red-400" aria-hidden="true" />
                    <span className="text-[14.5px] font-semibold text-foreground">Contas a Pagar</span>
                  </div>
                  <p className="text-[12.5px] text-muted-foreground">Registre despesas, vincule a fornecedores, marque como pago e controle vencimentos.</p>
                </div>
                <div className="aj-card p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-emerald-700 dark:text-emerald-400 dark:text-emerald-400" aria-hidden="true" />
                    <span className="text-[14.5px] font-semibold text-foreground">Contas a Receber</span>
                  </div>
                  <p className="text-[12.5px] text-muted-foreground">Gerado automaticamente ao concluir uma OS. Acompanhe pagamentos e inadimplências.</p>
                </div>
              </div>
              <Screenshot src="/manual/financeiro.png" alt="Módulo Financeiro" label="[Captura de tela do módulo Financeiro — visão geral do Caixa]" />

              <h3 className="aj-h3 mt-4">Fluxo do Caixa</h3>
              <div className="space-y-2">
                <Step n={1} text="Acesse Financeiro → Caixa. Se não há sessão aberta, clique em 'Abrir Caixa' informando o saldo inicial." />
                <Step n={2} text="Durante o dia, registre entradas (recebimentos) e saídas (pagamentos) clicando nos botões correspondentes." />
                <Step n={3} text="Para fechar o caixa, clique em 'Fechar Sessão' e informe o saldo contado em espécie." />
                <Step n={4} text="O sistema gera uma conferência automática com qualquer diferença encontrada." />
              </div>
              <Screenshot src="/manual/financeiro-caixa.png" alt="Caixa com sessão aberta" label="[Captura de tela do Caixa com sessão aberta e movimentações]" />

              <h3 className="aj-h3 mt-4">Contas a Receber — fluxo de conclusão da OS</h3>
              <p className="text-[14.5px] text-foreground/85 leading-relaxed mb-2">
                Ao concluir uma OS com saldo em aberto, o sistema exibe um dialog perguntando se o cliente já pagou:
              </p>
              <div className="space-y-2 mb-3">
                <Step n={1} text="Selecione a forma de pagamento (Pix, Dinheiro, Cartão etc.) no seletor exibido." />
                <Step n={2} text="'Sim — Lançar no caixa': marca a OS como paga e registra a entrada diretamente no caixa aberto." />
                <Step n={3} text="'Não — Gerar conta a receber': cria uma conta a receber com vencimento em 7 dias para cobrar depois." />
              </div>
              <div className="aj-note p-3.5 text-[13.5px] mb-3">
                <strong>Dica:</strong> Se não há caixa aberto ao escolher “Lançar no caixa”, a OS é marcada como paga mas o valor não é registrado no caixa — abra o caixa antes de concluir OS pagas na hora.
              </div>

              <h3 className="aj-h3 mt-4">Abas de Contas a Pagar e a Receber</h3>
              <p className="text-[14.5px] text-foreground/85 leading-relaxed mb-2">
                As duas telas separam as contas em abas, cada uma com o total ao lado:
              </p>
              <FeatureList items={[
                'Atrasadas — venceram e ainda não foram pagas ou recebidas',
                'Vencem em 7 dias — o que chega na próxima semana',
                'Em aberto — todas as contas pendentes',
                'Pagas / Recebidas e Canceladas — o histórico',
                'Clique numa conta para ver os detalhes e usar o botão Pagar ou Receber',
              ]} />
              <div className="aj-note aj-warn p-3.5 text-[13.5px] mb-3">
                <strong>Atenção:</strong> Quando há contas vencidas, um badge vermelho aparece automaticamente no menu lateral ao lado de “Contas a Pagar” ou “Contas a Receber”. O sino de alertas no topo da tela também exibe a contagem total de itens urgentes.
              </div>
              <Screenshot src="/manual/financeiro-receber.png" alt="Contas a Receber" label="[Captura de tela das Contas a Receber com cards de resumo e tabela]" />
            </section>

            {/* 6.1 Fluxo de Caixa */}
            <section className="page-break">
              <SectionHeader icon={ArrowLeftRight} title="6.1 Fluxo de Caixa" />
              <p className="text-[14.5px] text-foreground/85 leading-relaxed mb-4">
                O <strong>Fluxo de Caixa</strong> é um painel analítico que consolida todas as movimentações financeiras do período selecionado — entradas (recebimentos) e saídas (despesas) — permitindo visualizar a saúde financeira do ateliê de forma rápida.
              </p>
              <p className="text-[13.5px] text-muted-foreground mb-3">
                Acesse em: <strong>Financeiro → Fluxo de Caixa</strong> no menu lateral.
              </p>

              <h3 className="aj-h3">Cards de Resumo</h3>
              <div className="grid gap-3 sm:grid-cols-3 mb-4">
                <div className="aj-card p-3">
                  <p className="text-[13.5px] font-semibold text-emerald-700 dark:text-emerald-400 mb-1">Total de Entradas</p>
                  <p className="text-[12.5px] text-muted-foreground">Soma de todos os recebimentos (OS pagas + lançamentos no caixa) no período.</p>
                </div>
                <div className="aj-card p-3">
                  <p className="text-[13.5px] font-semibold text-red-700 dark:text-red-400 mb-1">Total de Saídas</p>
                  <p className="text-[12.5px] text-muted-foreground">Soma de todas as despesas registradas (contas a pagar pagas) no período.</p>
                </div>
                <div className="aj-card p-3">
                  <p className="text-[13.5px] font-semibold text-[#8A4B2C] dark:text-[#E39B78] mb-1">Saldo do Período</p>
                  <p className="text-[12.5px] text-muted-foreground">Diferença entre entradas e saídas. Positivo = superávit; negativo = déficit.</p>
                </div>
              </div>

              <h3 className="aj-h3">Entradas por Forma de Pagamento</h3>
              <p className="text-[14.5px] text-foreground/85 leading-relaxed mb-2">
                Dentro do Fluxo de Caixa há um painel detalhando as entradas agrupadas por forma de pagamento:
              </p>
              <FeatureList items={[
                'Total recebido por cada método (PIX, Dinheiro, Cartão etc.)',
                'Quantidade de transações por método',
                'Percentual de participação de cada método no total',
                'Barra de progresso visual para comparação rápida',
              ]} />
              <div className="aj-note p-3.5 text-[13.5px] mb-4">
                <strong>Exemplo de uso:</strong> Se você recebeu R$ 2.000 em PIX e R$ 500 em dinheiro, o painel mostrará PIX como 80% e Dinheiro como 20% das entradas do período.
              </div>

              <h3 className="aj-h3">Atalhos Rápidos</h3>
              <p className="text-[14.5px] text-foreground/85 leading-relaxed mb-3">
                O Fluxo de Caixa também exibe atalhos para as principais ações financeiras: abrir caixa, registrar despesa, acessar contas a receber e gerenciar formas de pagamento.
              </p>
              <Screenshot src="/manual/financeiro-fluxo.png" alt="Fluxo de Caixa" label="[Captura de tela do Fluxo de Caixa com cards de resumo e painel de formas de pagamento]" />
            </section>

            {/* 6.2 Caixas e Chave PIX */}
            <section className="page-break">
              <SectionHeader icon={QrCode} title="6.2 Caixas e Chave PIX" />
              <p className="text-[14.5px] text-foreground/85 leading-relaxed mb-4">
                O sistema permite cadastrar múltiplos <strong>caixas</strong> (PDVs, pontos de recebimento, contas bancárias) e vincular uma <strong>Chave PIX</strong> a cada um deles. Isso facilita identificar para qual caixa cada pagamento PIX foi destinado.
              </p>

              <h3 className="aj-h3">O que é um Caixa?</h3>
              <p className="text-[14.5px] text-foreground/85 leading-relaxed mb-3">
                Um <strong>caixa</strong> representa um ponto físico ou conta de recebimento — por exemplo: “Caixa Principal”, “Conta Nubank”, “Caixa Loja 2”. Cada caixa tem sessões de abertura e fechamento independentes.
              </p>

              <h3 className="aj-h3">Cadastrando um Caixa com Chave PIX</h3>
              <div className="space-y-2 mb-4">
                <Step n={1} text="Acesse Financeiro → Caixa e clique em 'Novo Caixa'." />
                <Step n={2} text="Preencha o nome do caixa (ex: 'Conta Nubank', 'Caixa Loja')." />
                <Step n={3} text="No campo 'Chave PIX', informe a chave correspondente: celular, e-mail, CPF/CNPJ ou chave aleatória." />
                <Step n={4} text="Se já houver uma chave PIX cadastrada em Configurações → Financeiro, aparece o link 'Usar chave das configurações' — clique para preenchê-la automaticamente." />
                <Step n={5} text="Salve. O caixa estará disponível para abertura de sessão." />
              </div>

              <div className="grid gap-3 sm:grid-cols-2 mb-4">
                <div className="aj-note p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <QrCode className="h-4 w-4 text-[#C8714A]" aria-hidden="true" />
                    <p className="text-[13.5px] font-semibold text-[#8A4B2C] dark:text-[#E39B78]">Chave das Configurações</p>
                  </div>
                  <p className="text-[12.5px] text-foreground/85">Se você tem uma única chave PIX para o ateliê, cadastre-a em Configurações → Financeiro e use o atalho para importar em qualquer caixa.</p>
                </div>
                <div className="aj-note p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="h-4 w-4 text-[#C8714A]" aria-hidden="true" />
                    <p className="text-[13.5px] font-semibold text-[#8A4B2C] dark:text-[#E39B78]">Chave Específica por Caixa</p>
                  </div>
                  <p className="text-[12.5px] text-foreground/85">Se cada conta bancária tem sua própria chave PIX (ex: Nubank e Itaú), cadastre a chave correspondente em cada caixa separadamente.</p>
                </div>
              </div>

              <div className="aj-note aj-warn p-3.5 text-[13.5px] mb-4">
                <strong>Importante:</strong> A Chave PIX no caixa é informativa — ajuda a organizar para qual conta o dinheiro foi. O vínculo automático entre pagamentos PIX recebidos e o caixa correspondente é registrado ao concluir uma OS com forma de pagamento PIX.
              </div>

              <h3 className="aj-h3">Editando um Caixa existente</h3>
              <div className="space-y-2 mb-4">
                <Step n={1} text="Acesse Financeiro → Caixa e localize o caixa na lista." />
                <Step n={2} text="Clique no botão 'Editar' (ícone de lápis) ao lado do caixa." />
                <Step n={3} text="Altere o nome, descrição, chave PIX ou status (ativo/inativo) conforme necessário." />
                <Step n={4} text="Clique em 'Atualizar Caixa' para salvar." />
              </div>
              <div className="aj-note p-3.5 text-[13.5px] mb-4">
                <strong>Dica:</strong> Caixas inativos não podem ter novas sessões abertas. Use essa opção para desativar um caixa temporariamente sem perder o histórico de movimentações.
              </div>
              <Screenshot src="/manual/financeiro-caixa-cadastro.png" alt="Cadastro de caixa com chave PIX" label="[Captura de tela do formulário de cadastro de caixa com o campo Chave PIX preenchido]" />
            </section>

            {/* 7. Estoque */}
            <section className="page-break">
              <SectionHeader icon={Package} title="7. Estoque e Fornecedores" />
              <p className="text-[14.5px] text-foreground/85 leading-relaxed mb-4">
                Módulo de controle de materiais e insumos do ateliê. Para ativar a integração com Ordens de Serviço, vá em <strong>Configurações → Sistema → Controle de Estoque</strong>.
              </p>

              <div className="grid gap-3 sm:grid-cols-2 mb-4">
                <div className="aj-card p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-4 w-4 text-[#C8714A]" aria-hidden="true" />
                    <span className="text-[14.5px] font-semibold text-foreground">Produtos</span>
                  </div>
                  <p className="text-[12.5px] text-muted-foreground">Catálogo de materiais com quantidade atual, mínima, preço de custo e código de barras.</p>
                </div>
                <div className="aj-card p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <PackageOpen className="h-4 w-4 text-[#C8714A]" aria-hidden="true" />
                    <span className="text-[14.5px] font-semibold text-foreground">Entradas</span>
                  </div>
                  <p className="text-[12.5px] text-muted-foreground">Registre compras e reposições. O saldo dos produtos é atualizado automaticamente.</p>
                </div>
                <div className="aj-card p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-[14.5px] font-semibold text-foreground">Relatórios</span>
                  </div>
                  <p className="text-[12.5px] text-muted-foreground">Histórico completo de movimentações: entradas e saídas (manuais ou por OS concluída).</p>
                </div>
                <div className="aj-card p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="h-4 w-4 text-[#C8714A]" aria-hidden="true" />
                    <span className="text-[14.5px] font-semibold text-foreground">Fornecedores</span>
                  </div>
                  <p className="text-[12.5px] text-muted-foreground">Cadastro de fornecedores vinculado às contas a pagar para rastreamento de compras.</p>
                </div>
              </div>
              <Screenshot src="/manual/estoque.png" alt="Lista de produtos em estoque" label="[Captura de tela do módulo Estoque — lista de produtos com quantidade atual]" />

              <h3 className="aj-h3 mt-4">Como registrar uma entrada de estoque</h3>
              <div className="space-y-2">
                <Step n={1} text="Acesse Estoque → Entradas e clique em 'Nova Entrada'." />
                <Step n={2} text="Selecione o fornecedor (opcional) e a data de compra." />
                <Step n={3} text="Adicione os produtos comprados com quantidade e valor unitário." />
                <Step n={4} text="Confirme. O saldo de cada produto será incrementado automaticamente." />
              </div>
              <Screenshot src="/manual/estoque-entradas.png" alt="Entradas de estoque" label="[Captura de tela do formulário de nova entrada de estoque]" />

              <h3 className="aj-h3 mt-4">Baixa automática por OS</h3>
              <p className="text-[14.5px] text-foreground/85 leading-relaxed">
                Quando o Controle de Estoque está ativo e uma OS é concluída, o sistema verifica os materiais registrados naquela OS e realiza a baixa automática de cada produto. A saída fica registrada em Relatórios com a referência da OS.
              </p>
              <Screenshot src="/manual/estoque-relatorios.png" alt="Relatórios de estoque" label="[Captura de tela dos Relatórios de Estoque com saída vinculada a uma OS]" />
            </section>

            {/* 8. Alertas e Notificações */}
            <section className="page-break">
              <SectionHeader icon={Bell} title="8. Alertas e Notificações" />
              <p className="text-[14.5px] text-foreground/85 leading-relaxed mb-4">
                O sistema monitora automaticamente situações que requerem atenção e as exibe de forma visual no menu lateral e no sino de notificações, sem que você precise verificar cada módulo manualmente.
              </p>

              <h3 className="aj-h3">Sino de Notificações</h3>
              <p className="text-[14.5px] text-foreground/85 leading-relaxed mb-3">
                O ícone de sino (<Bell className="inline h-3.5 w-3.5" />) no canto superior direito da tela exibe um contador vermelho quando há alertas pendentes. Clique no sino para ver um resumo rápido e acessar diretamente o módulo com problema.
              </p>
              <div className="grid gap-3 sm:grid-cols-3 mb-4">
                <div className="aj-note aj-warn p-3">
                  <p className="text-[13.5px] font-semibold text-red-700 dark:text-red-400 mb-1">Ordens Atrasadas</p>
                  <p className="text-[12.5px] text-muted-foreground">OS com prazo de entrega vencido que ainda não foram concluídas.</p>
                </div>
                <div className="aj-note aj-warn p-3">
                  <p className="text-[13.5px] font-semibold text-[#8A4B2C] dark:text-[#E39B78] mb-1">Contas a Pagar Vencidas</p>
                  <p className="text-[12.5px] text-muted-foreground">Despesas com data de vencimento passada e status ainda pendente.</p>
                </div>
                <div className="aj-note aj-warn p-3">
                  <p className="text-[13.5px] font-semibold text-[#8A4B2C] dark:text-[#E39B78] mb-1">Contas a Receber Vencidas</p>
                  <p className="text-[12.5px] text-muted-foreground">Recebimentos com vencimento passado que ainda não foram confirmados.</p>
                </div>
              </div>

              <h3 className="aj-h3">Badges no Menu Lateral</h3>
              <p className="text-[14.5px] text-foreground/85 leading-relaxed mb-3">
                Cada módulo do menu exibe um badge colorido indicando pendências:
              </p>
              <FeatureList items={[
                'Badge vermelho — alertas urgentes (ordens atrasadas, contas vencidas)',
                'Badge azul/índigo — informações úteis (ex: aniversários de clientes no mês)',
                'Os subitens do menu Financeiro (Contas a Pagar, Contas a Receber) também exibem o badge individualmente',
              ]} />

              <h3 className="aj-h3 mt-4">Aniversários de Clientes</h3>
              <p className="text-[14.5px] text-foreground/85 leading-relaxed">
                Um badge azul aparece no menu <strong>Clientes</strong> com a contagem de clientes que fazem aniversário no mês atual. Use essa informação para oferecer promoções ou entrar em contato para fidelizar.
              </p>
              <Screenshot src="/manual/alertas.png" alt="Alertas no menu lateral" label="[Captura de tela do menu lateral com badges vermelhos e o sino de notificações com contador]" />
            </section>

            {/* 9. Configurações */}
            <section className="page-break">
              <SectionHeader icon={Settings} title="9. Configurações do Sistema" />
              <p className="text-[14.5px] text-foreground/85 leading-relaxed mb-4">
                Central de personalização do sistema. As configurações são organizadas em abas.
              </p>

              <div className="space-y-3 mb-4">
                {[
                  { icon: Shield, label: 'Organização', desc: 'Nome do ateliê, CNPJ, endereço, telefone, e-mail e site.' },
                  { icon: UserPlus, label: 'Usuários', desc: 'Gerencie quem tem acesso ao sistema. Crie usuários com cargo de Administrador ou Membro, altere cargos e remova acessos.' },
                  { icon: Scissors, label: 'Personalização', desc: 'Logo do ateliê, cor primária e secundária para o tema visual.' },
                  { icon: DollarSign, label: 'Financeiro', desc: 'Formas de pagamento aceitas, taxa de juros/multa por atraso, controle de caixa.' },
                  { icon: Bell, label: 'Notificações', desc: 'Alertas de aniversários, OS atrasadas, estoque baixo, e-mail para notificações, mensagem padrão nas OS.' },
                  { icon: FileText, label: 'Ordens de Serviço', desc: 'Numeração automática, prefixo, campos obrigatórios, prazo padrão de entrega.' },
                  { icon: Settings, label: 'Sistema', desc: 'Formato de data, fuso horário, tema (claro/escuro/auto) e toggle de Controle de Estoque.' },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="aj-card flex items-start gap-3 p-3">
                    <div className="rounded-full bg-[#C8714A]/12 p-1.5">
                      <Icon className="h-4 w-4 text-[#8A4B2C] dark:text-[#E39B78]" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-[14.5px] font-semibold text-foreground">{label}</p>
                      <p className="text-[13.5px] text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Screenshot src="/manual/configuracoes.png" alt="Configurações do sistema" label="[Captura de tela da página de Configurações com as abas visíveis]" />

              <h3 className="aj-h3 mt-4">Gerenciando Usuários da Equipe</h3>
              <p className="text-[14.5px] text-foreground/85 leading-relaxed mb-2">
                O proprietário da organização pode criar acessos adicionais para membros da equipe.
              </p>
              <div className="space-y-2 mb-3">
                <Step n={1} text="Acesse Configurações → aba 'Usuários'." />
                <Step n={2} text="Clique em 'Novo Usuário' e preencha nome, e-mail, senha inicial e cargo (Admin ou Membro)." />
                <Step n={3} text="Clique em 'Criar Usuário'. A pessoa pode fazer login imediatamente com o e-mail e senha informados." />
              </div>
              <div className="grid gap-3 sm:grid-cols-3 mb-4">
                <div className="aj-card p-3">
                  <p className="text-[12.5px] font-semibold text-[#8A4B2C] dark:text-[#E39B78] mb-1">Proprietário</p>
                  <p className="text-[12px] text-muted-foreground">Acesso total. Único que pode gerenciar usuários e configurações avançadas.</p>
                </div>
                <div className="aj-card p-3">
                  <p className="text-[12.5px] font-semibold text-[#8A4B2C] dark:text-[#E39B78] mb-1">Administrador</p>
                  <p className="text-[12px] text-muted-foreground">Acesso total a todos os módulos, exceto gerenciamento de usuários.</p>
                </div>
                <div className="aj-card p-3">
                  <p className="text-[12.5px] font-semibold text-foreground mb-1">Membro</p>
                  <p className="text-[12px] text-muted-foreground">Acesso operacional para cadastros e OS. Sem acesso a configurações financeiras.</p>
                </div>
              </div>
              <div className="aj-note aj-warn p-3.5 text-[13.5px] mb-4">
                <strong>Plano Free:</strong> Permite até 2 usuários. Faça upgrade para o plano Pro para adicionar até 3 membros à equipe.
              </div>
              <Screenshot src="/manual/configuracoes-usuarios.png" alt="Aba Usuários nas Configurações" label="[Captura de tela da aba Usuários nas Configurações com lista de membros e formulário]" />

              <h3 className="aj-h3 mt-4">Ativando o Controle de Estoque</h3>
              <div className="space-y-2">
                <Step n={1} text="Acesse Configurações → aba 'Sistema'." />
                <Step n={2} text="Na seção 'Módulos', ative o toggle 'Controle de Estoque'." />
                <Step n={3} text="Clique em 'Salvar Alterações'." />
                <Step n={4} text="A partir de agora, a seção de materiais aparecerá nas Ordens de Serviço e no cadastro de serviços." />
              </div>

              <h3 className="aj-h3 mt-4">Configurando mensagem padrão nas OS</h3>
              <div className="space-y-2">
                <Step n={1} text="Acesse Configurações → aba 'Notificações'." />
                <Step n={2} text="Role até 'Aviso Padrão nas Ordens de Serviço' e ative o toggle." />
                <Step n={3} text="Digite a mensagem que deve aparecer automaticamente no campo de observações de toda nova OS." />
                <Step n={4} text="Clique em 'Salvar Alterações'. A mensagem será aplicada às próximas OS criadas." />
              </div>
              <Screenshot src="/manual/configuracoes-notificacoes.png" alt="Configurações de notificações" label="[Captura de tela das Configurações — aba Notificações com campo de mensagem padrão]" />
            </section>

            {/* 10. Dicas e FAQ */}
            <section className="page-break">
              <SectionHeader icon={FileText} title="10. Dicas e Perguntas Frequentes" />

              <div className="space-y-4">
                {[
                  {
                    q: 'Como reativar o tour do sistema?',
                    a: 'Clique em "Ver tour do sistema" no rodapé do menu lateral esquerdo.',
                  },
                  {
                    q: 'O que acontece se eu excluir um cliente?',
                    a: 'O cliente é desativado (soft delete) e não aparece mais na lista principal, mas todo o histórico de ordens de serviço é preservado e pode ser consultado.',
                  },
                  {
                    q: 'Posso ter mais de um usuário no sistema?',
                    a: 'Sim. Acesse Configurações → aba "Usuários" e clique em "Novo Usuário". Informe nome, e-mail, senha e cargo (Admin ou Membro). O novo usuário pode fazer login imediatamente. No plano Free o limite é 2 usuários; no Pro até 3.',
                  },
                  {
                    q: 'Como definir uma meta mensal de receita?',
                    a: 'No Dashboard, na faixa de faturamento, clique em "Definir meta", digite o valor e clique em "Salvar". O progresso é atualizado automaticamente conforme as OS são concluídas.',
                  },
                  {
                    q: 'O sino de notificações não aparece alertas. O que verificar?',
                    a: 'O sino mostra alertas apenas quando há ordens com prazo vencido (status pendente/em andamento) ou contas a pagar/receber com vencimento passado. Se não há pendências, o sino aparece sem contador — isso é esperado.',
                  },
                  {
                    q: 'Como funciona a numeração automática das OS?',
                    a: 'Configure o prefixo em Configurações → Ordens de Serviço. A numeração é incrementada automaticamente a cada nova OS criada, sem possibilidade de alterar o número inicial.',
                  },
                  {
                    q: 'O estoque baixa sozinho ao concluir uma OS?',
                    a: 'Sim, desde que o Controle de Estoque esteja ativo (Configurações → Sistema) e que a OS tenha materiais registrados. A baixa é realizada uma única vez — se a OS for reaberta e concluída novamente, não há baixa duplicada.',
                  },
                  {
                    q: 'Como vincular uma chave PIX a um caixa?',
                    a: 'Acesse Financeiro → Caixa, crie um novo caixa ou edite um existente. No campo "Chave PIX", informe a chave (celular, e-mail, CPF/CNPJ ou chave aleatória). Se já houver uma chave cadastrada em Configurações → Financeiro, clique em "Usar chave das configurações" para preenchê-la automaticamente.',
                  },
                  {
                    q: 'O que é o Fluxo de Caixa e como acessar?',
                    a: 'O Fluxo de Caixa é um painel analítico que mostra todas as entradas e saídas do período, além do saldo. Acesse pelo menu Financeiro → Fluxo de Caixa. Lá você também visualiza as entradas agrupadas por forma de pagamento (PIX, Dinheiro, Cartão etc.).',
                  },
                  {
                    q: 'Como imprimir uma ordem de serviço?',
                    a: 'Na lista de ordens, clique no ícone de olho (visualizar) ao lado da OS desejada. Na tela de preview, clique em "Baixar PDF" para salvar ou imprimir.',
                  },
                  {
                    q: 'Posso usar o sistema no celular?',
                    a: 'Sim, o sistema é responsivo e funciona em smartphones. Para melhor experiência, recomendamos o uso em tablet ou computador.',
                  },
                  {
                    q: 'Como exportar meus dados?',
                    a: 'Em Clientes, Serviços e Ordens de Serviço há botões de exportação para Excel (.xlsx) e PDF na parte superior da lista.',
                  },
                ].map(({ q, a }) => (
                  <div key={q} className="border-l-2 border-dashed border-[#C8714A]/60 pl-4">
                    <p className="text-[14.5px] font-semibold text-foreground mb-1">{q}</p>
                    <p className="text-[13.5px] text-muted-foreground leading-relaxed">{a}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 aj-note p-5 text-center">
                <p className="text-sm font-semibold text-foreground mb-1">Precisa de mais ajuda?</p>
                <p className="text-[13.5px] text-muted-foreground">
                  Clique em <strong>“Ver tour do sistema”</strong> no rodapé do menu para rever o guia interativo a qualquer momento.
                </p>
              </div>
            </section>

            {/* Rodapé */}
            <footer className="text-center text-[12.5px] text-muted-foreground py-6 border-t border-dashed border-border">
              <p>Meu Atelier — Manual do Sistema v3.1</p>
              <p className="mt-1">Para substituir os espaços de captura de tela, tire screenshots de cada seção e edite este documento.</p>
            </footer>

          </div>
        </div>
      </div>
    </>
  )
}

const AJ_CSS = `
.aj-paper { background: var(--card); border: 1px solid color-mix(in oklab, var(--border) 70%, transparent); border-radius: 12px; }
.aj-cover { border-bottom: 2px dashed color-mix(in oklab, #C8714A 35%, transparent); }
.aj-sec { border-bottom: 1.5px dashed color-mix(in oklab, #C8714A 40%, transparent); }
.aj-h3 { font-family: var(--font-cormorant), Georgia, serif; font-weight: 600; font-size: 21px; line-height: 1.2; color: var(--foreground); margin-bottom: .5rem; }
.aj-step { background: color-mix(in oklab, #C8714A 14%, transparent); color: #8A4B2C; border: 1px dashed color-mix(in oklab, #C8714A 55%, transparent); }
.dark .aj-step { color: #E39B78; }
.aj-list li { position: relative; padding-left: 22px; }
.aj-list li::before { content: ''; position: absolute; left: 2px; top: .72em; width: 12px; border-top: 2px dashed #C8714A; }
.aj-note { background: color-mix(in oklab, #D4A85A 10%, var(--card)); border: 1px dashed color-mix(in oklab, #D4A85A 60%, transparent); border-radius: 8px; color: var(--foreground); }
.aj-warn { background: color-mix(in oklab, #C8714A 9%, var(--card)); border-color: color-mix(in oklab, #C8714A 55%, transparent); }
.aj-shot { border: 2px dashed color-mix(in oklab, #C8714A 30%, transparent); border-radius: 10px; background: repeating-linear-gradient(135deg, color-mix(in oklab, #C8714A 5%, transparent) 0 10px, transparent 10px 20px); }
.aj-card { background: var(--background); border: 1px solid color-mix(in oklab, var(--border) 80%, transparent); border-radius: 8px; }
.aj-toc { border-left: 1.5px dashed color-mix(in oklab, #C8714A 35%, transparent); }
.aj-toc-a { display: flex; align-items: baseline; padding: 7px 12px; margin-left: -1.5px; border-left: 2px solid transparent; font-size: 14px; color: var(--muted-foreground); transition: color .15s, border-color .15s, background .15s; }
.aj-toc-a:hover { color: var(--foreground); }
.aj-toc-a.is-on { color: var(--foreground); font-weight: 600; border-left-color: #C8714A; background: color-mix(in oklab, #C8714A 7%, transparent); }
@media (prefers-reduced-motion: reduce) { .aj-toc-a { transition: none; } }
`
