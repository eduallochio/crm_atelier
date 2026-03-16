'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Printer,
  LayoutDashboard,
  Users,
  Scissors,
  FileText,
  DollarSign,
  Package,
  Settings,
  Camera,
  ChevronRight,
  Wallet,
  TrendingDown,
  TrendingUp,
  PackageOpen,
  BarChart3,
  Truck,
  Bell,
  Shield,
  Target,
  UserPlus,
} from 'lucide-react'

function ScreenshotPlaceholder({ label }: { label: string }) {
  return (
    <div className="border-2 border-dashed border-gray-300 rounded-xl h-52 flex flex-col items-center justify-center gap-2 my-4 bg-gray-50 print:bg-white print:border-gray-300 print:h-56">
      <Camera className="h-8 w-8 text-gray-300 print:hidden" />
      <p className="text-[13px] text-gray-400 text-center px-4">{label}</p>
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
      src={src}
      alt={alt}
      className="rounded-xl border shadow-md w-full my-4 print:shadow-none print:border-gray-300"
      onError={() => setFailed(true)}
    />
  )
}

function SectionHeader({ icon: Icon, title, color }: { icon: React.ElementType; title: string; color: string }) {
  return (
    <div className={`flex items-center gap-3 mb-4 pb-3 border-b-2 ${color}`}>
      <div className={`p-2 rounded-lg ${color.replace('border-', 'bg-').replace('-500', '-100')}`}>
        <Icon className={`h-5 w-5 ${color.replace('border-', 'text-')}`} />
      </div>
      <h2 className="text-xl font-bold text-gray-800">{title}</h2>
    </div>
  )
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center mt-0.5">
        {n}
      </span>
      <p className="text-[13px] text-gray-600 leading-relaxed">{text}</p>
    </div>
  )
}

function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5 mb-4">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-[13px] text-gray-600">
          <ChevronRight className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-0.5" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export default function AjudaPage() {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => window.print()

  return (
    <>
      {/* Estilos de impressão — inline para garantir que sejam aplicados */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #manual-content, #manual-content * { visibility: visible; }
          #manual-content { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
          @page { margin: 20mm 15mm; size: A4; }
        }
      `}</style>

      <div className="min-h-screen bg-muted/30">
        {/* Cabeçalho da página */}
        <div className="bg-white border-b sticky top-0 z-10 no-print">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Manual do Sistema</h1>
              <p className="text-xs text-gray-500">Meu Atelier — Guia completo de uso</p>
            </div>
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              Imprimir / Salvar PDF
            </Button>
          </div>
        </div>

        {/* Conteúdo do manual */}
        <div id="manual-content" ref={printRef} className="max-w-4xl mx-auto px-6 py-8 space-y-12">

          {/* Capa */}
          <div className="text-center py-10 border-b-2 border-indigo-100">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-2xl mb-4">
              <Scissors className="h-8 w-8 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Meu Atelier</h1>
            <p className="text-gray-500 text-sm mb-1">Manual de Utilização do Sistema</p>
            <p className="text-gray-400 text-xs">Versão 3.0</p>
            <Screenshot src="/manual/login.png" alt="Tela de login" label="[Captura de tela da tela inicial / login do sistema]" />
          </div>

          {/* Índice */}
          <div className="bg-indigo-50 rounded-xl p-6 no-page-break">
            <h2 className="text-base font-bold text-gray-800 mb-4">Índice</h2>
            <div className="grid grid-cols-2 gap-2 text-[13px]">
              {[
                ['1', 'Visão Geral do Sistema'],
                ['2', 'Dashboard — Painel de Controle'],
                ['3', 'Clientes'],
                ['4', 'Serviços'],
                ['5', 'Ordens de Serviço'],
                ['6', 'Financeiro'],
                ['7', 'Estoque e Fornecedores'],
                ['8', 'Alertas e Notificações'],
                ['9', 'Configurações do Sistema'],
                ['10', 'Dicas e Perguntas Frequentes'],
              ].map(([n, title]) => (
                <div key={n} className="flex items-center gap-2 text-gray-600">
                  <span className="text-indigo-500 font-semibold">{n}.</span>
                  <span>{title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 1. Visão Geral */}
          <section>
            <SectionHeader icon={Shield} title="1. Visão Geral do Sistema" color="border-indigo-500" />
            <p className="text-[13px] text-gray-600 leading-relaxed mb-4">
              O <strong>Meu Atelier</strong> é um sistema de gestão completo desenvolvido especialmente para ateliês de costura, bordado e artesanato. Com ele você centraliza o cadastro de clientes, serviços, ordens de serviço, controle financeiro e de estoque em um único lugar.
            </p>
            <FeatureList items={[
              'Acesso via navegador web — sem necessidade de instalação',
              'Dados seguros e isolados por organização',
              'Interface responsiva para uso em computador e tablet',
              'Tour guiado integrado para novos usuários',
            ]} />
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-green-700 mb-1">Plano Free</p>
                <p className="text-[12px] text-green-600">50 clientes · 20 serviços · 100 ordens por mês</p>
              </div>
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-indigo-700 mb-1">Plano Enterprise</p>
                <p className="text-[12px] text-indigo-600">Clientes, serviços e ordens ilimitados</p>
              </div>
            </div>
            <Screenshot src="/manual/dashboard.png" alt="Menu lateral do sistema" label="[Captura de tela do menu lateral (sidebar) com todos os módulos visíveis]" />
          </section>

          {/* 2. Dashboard */}
          <section className="page-break">
            <SectionHeader icon={LayoutDashboard} title="2. Dashboard — Painel de Controle" color="border-blue-500" />
            <p className="text-[13px] text-gray-600 leading-relaxed mb-4">
              O Dashboard é a tela inicial após o login. Ele apresenta um resumo visual completo do estado do negócio, com indicadores em tempo real e inteligência analítica para apoiar decisões.
            </p>

            <h3 className="font-semibold text-[14px] text-gray-700 mb-2">Cards de Resumo</h3>
            <FeatureList items={[
              'Clientes Cadastrados — total de clientes na organização',
              'Ordens de Serviço — total de ordens no sistema',
              'Usuários — membros da equipe com acesso',
              'Receita do Mês — soma das OS concluídas no mês atual',
              'Meta do Mês — progresso visual em relação à meta de receita definida',
            ]} />

            <h3 className="font-semibold text-[14px] text-gray-700 mt-4 mb-2">Meta do Mês</h3>
            <p className="text-[13px] text-gray-600 leading-relaxed mb-2">
              O card de <strong>Meta do Mês</strong> exibe uma barra de progresso comparando a receita atual com a meta definida. A cor da barra muda conforme o avanço: verde (≥80%), laranja (50–79%) e vermelho (&lt;50%).
            </p>
            <div className="space-y-2 mb-4">
              <Step n={1} text="No card 'Meta do Mês', clique no ícone de lápis no canto superior direito." />
              <Step n={2} text="Digite o valor da meta (ex: 5000,00) e pressione Enter ou clique no botão verde." />
              <Step n={3} text="A meta é salva e o progresso é atualizado automaticamente conforme as OS são concluídas." />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-[12px] text-blue-700 mb-4">
              <strong>Dica:</strong> Para zerar a meta, edite e salve com o valor 0.
            </div>

            <h3 className="font-semibold text-[14px] text-gray-700 mt-4 mb-2">Inteligência de Negócios</h3>
            <p className="text-[13px] text-gray-600 leading-relaxed mb-2">
              Abaixo dos cards de resumo há três painéis analíticos que consolidam informações financeiras e operacionais:
            </p>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="border rounded-lg p-3">
                <p className="text-[12px] font-semibold text-emerald-700 mb-1">Saúde Financeira</p>
                <p className="text-[11px] text-gray-500">Saldo de recebíveis, contas vencidas, previsão dos próximos 7 dias e pipeline de ordens em aberto.</p>
              </div>
              <div className="border rounded-lg p-3">
                <p className="text-[12px] font-semibold text-blue-700 mb-1">Top Clientes</p>
                <p className="text-[11px] text-gray-500">Ranking dos 5 melhores clientes por receita total. Indica também quantos clientes estão inativos (sem OS nos últimos 60 dias).</p>
              </div>
              <div className="border rounded-lg p-3">
                <p className="text-[12px] font-semibold text-violet-700 mb-1">Desempenho Operacional</p>
                <p className="text-[11px] text-gray-500">Ticket médio, tempo médio de conclusão de OS, taxa de pontualidade e taxa de cancelamento — todos calculados em tempo real.</p>
              </div>
            </div>

            <h3 className="font-semibold text-[14px] text-gray-700 mt-4 mb-2">Gráficos e Filtro de Período</h3>
            <FeatureList items={[
              'Faturamento Mensal — gráfico de barras com receita por mês',
              'Serviços Mais Vendidos — ranking dos 5 serviços com maior demanda no período',
              'Ordens por Status — gráfico donut com distribuição por pendente, em andamento, concluído e cancelado',
              'Filtro de período: Últimos 7 dias, 30 dias, 90 dias ou Todo período',
            ]} />
            <Screenshot src="/manual/dashboard.png" alt="Dashboard" label="[Captura de tela do Dashboard com cards, meta e gráficos]" />
          </section>

          {/* 3. Clientes */}
          <section className="page-break">
            <SectionHeader icon={Users} title="3. Clientes" color="border-green-500" />
            <p className="text-[13px] text-gray-600 leading-relaxed mb-4">
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
            <h3 className="font-semibold text-[14px] text-gray-700 mt-4 mb-2">Como cadastrar um cliente</h3>
            <div className="space-y-2">
              <Step n={1} text="Clique em 'Novo Cliente' no canto superior direito da tela." />
              <Step n={2} text="Preencha o nome (obrigatório) e os demais campos — telefone, e-mail, endereço e aniversário." />
              <Step n={3} text="Clique em 'Cadastrar'. O cliente aparecerá imediatamente na lista." />
            </div>
            <Screenshot src="/manual/clientes-form.png" alt="Formulário de cadastro de cliente" label="[Captura de tela do formulário de cadastro de cliente]" />
          </section>

          {/* 4. Serviços */}
          <section className="page-break">
            <SectionHeader icon={Scissors} title="4. Serviços" color="border-purple-500" />
            <p className="text-[13px] text-gray-600 leading-relaxed mb-4">
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
            <h3 className="font-semibold text-[14px] text-gray-700 mt-4 mb-2">Vinculando materiais a um serviço</h3>
            <p className="text-[12px] text-gray-500 mb-2">
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
            <SectionHeader icon={FileText} title="5. Ordens de Serviço" color="border-orange-500" />
            <p className="text-[13px] text-gray-600 leading-relaxed mb-4">
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

            <h3 className="font-semibold text-[14px] text-gray-700 mt-5 mb-2">Como criar uma Ordem de Serviço</h3>
            <div className="space-y-2">
              <Step n={1} text="Clique em 'Nova OS' na tela de Ordens de Serviço." />
              <Step n={2} text="Selecione o cliente. Se não existir, cadastre-o antes na seção Clientes." />
              <Step n={3} text="Adicione um ou mais serviços clicando em 'Selecionar serviço...' e informando a quantidade." />
              <Step n={4} text="Preencha a data de entrega prevista e a forma de pagamento." />
              <Step n={5} text="Se houver desconto, informe o valor ou percentual no campo correspondente." />
              <Step n={6} text="Clique em 'Criar Ordem'. O comprovante em PDF será gerado automaticamente." />
            </div>
            <Screenshot src="/manual/ordens-form.png" alt="Formulário de nova OS" label="[Captura de tela do formulário de nova OS com campos preenchidos]" />

            <h3 className="font-semibold text-[14px] text-gray-700 mt-5 mb-2">Materiais utilizados na OS</h3>
            <p className="text-[12px] text-gray-500 mb-2">
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
            <SectionHeader icon={DollarSign} title="6. Financeiro" color="border-emerald-500" />
            <p className="text-[13px] text-gray-600 leading-relaxed mb-4">
              Controle financeiro completo com três subseções: Caixa, Contas a Pagar e Contas a Receber.
            </p>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="h-4 w-4 text-emerald-600" />
                  <span className="text-[13px] font-semibold text-gray-700">Caixa</span>
                </div>
                <p className="text-[11px] text-gray-500">Abertura e fechamento diário, movimentações de entrada e saída, conferência de caixa.</p>
              </div>
              <div className="border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span className="text-[13px] font-semibold text-gray-700">Contas a Pagar</span>
                </div>
                <p className="text-[11px] text-gray-500">Registre despesas, vincule a fornecedores, marque como pago e controle vencimentos.</p>
              </div>
              <div className="border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-[13px] font-semibold text-gray-700">Contas a Receber</span>
                </div>
                <p className="text-[11px] text-gray-500">Gerado automaticamente ao concluir uma OS. Acompanhe pagamentos e inadimplências.</p>
              </div>
            </div>
            <Screenshot src="/manual/financeiro.png" alt="Módulo Financeiro" label="[Captura de tela do módulo Financeiro — visão geral do Caixa]" />

            <h3 className="font-semibold text-[14px] text-gray-700 mt-4 mb-2">Fluxo do Caixa</h3>
            <div className="space-y-2">
              <Step n={1} text="Acesse Financeiro → Caixa. Se não há sessão aberta, clique em 'Abrir Caixa' informando o saldo inicial." />
              <Step n={2} text="Durante o dia, registre entradas (recebimentos) e saídas (pagamentos) clicando nos botões correspondentes." />
              <Step n={3} text="Para fechar o caixa, clique em 'Fechar Sessão' e informe o saldo contado em espécie." />
              <Step n={4} text="O sistema gera uma conferência automática com qualquer diferença encontrada." />
            </div>
            <Screenshot src="/manual/financeiro-caixa.png" alt="Caixa com sessão aberta" label="[Captura de tela do Caixa com sessão aberta e movimentações]" />

            <h3 className="font-semibold text-[14px] text-gray-700 mt-4 mb-2">Contas a Receber — geração automática</h3>
            <p className="text-[13px] text-gray-600 leading-relaxed mb-3">
              Quando uma OS é marcada como <strong>Concluída</strong>, uma conta a receber é criada automaticamente com o valor total da OS, vinculada ao cliente e com a forma de pagamento registrada. Você não precisa lançar manualmente.
            </p>

            <h3 className="font-semibold text-[14px] text-gray-700 mt-4 mb-2">Cards de Resumo clicáveis (Pagar e Receber)</h3>
            <p className="text-[13px] text-gray-600 leading-relaxed mb-2">
              Nas telas de <strong>Contas a Pagar</strong> e <strong>Contas a Receber</strong> há 4 cards de resumo no topo:
            </p>
            <FeatureList items={[
              'Total — valor acumulado de todas as contas no filtro atual (não clicável)',
              'Pendente — clique para filtrar somente contas pendentes',
              'Pago / Recebido — clique para filtrar somente contas liquidadas',
              'Atrasado — clique para filtrar somente contas vencidas e não pagas',
            ]} />
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[12px] text-amber-700 mb-3">
              <strong>Atenção:</strong> Quando há contas vencidas, um badge vermelho aparece automaticamente no menu lateral ao lado de "Contas a Pagar" ou "Contas a Receber". O sino de alertas no topo da tela também exibe a contagem total de itens urgentes.
            </div>
            <Screenshot src="/manual/financeiro-receber.png" alt="Contas a Receber" label="[Captura de tela das Contas a Receber com cards de resumo e tabela]" />
          </section>

          {/* 7. Estoque */}
          <section className="page-break">
            <SectionHeader icon={Package} title="7. Estoque e Fornecedores" color="border-amber-500" />
            <p className="text-[13px] text-gray-600 leading-relaxed mb-4">
              Módulo de controle de materiais e insumos do ateliê. Para ativar a integração com Ordens de Serviço, vá em <strong>Configurações → Sistema → Controle de Estoque</strong>.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-amber-600" />
                  <span className="text-[13px] font-semibold text-gray-700">Produtos</span>
                </div>
                <p className="text-[11px] text-gray-500">Catálogo de materiais com quantidade atual, mínima, preço de custo e código de barras.</p>
              </div>
              <div className="border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <PackageOpen className="h-4 w-4 text-blue-600" />
                  <span className="text-[13px] font-semibold text-gray-700">Entradas</span>
                </div>
                <p className="text-[11px] text-gray-500">Registre compras e reposições. O saldo dos produtos é atualizado automaticamente.</p>
              </div>
              <div className="border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-4 w-4 text-indigo-600" />
                  <span className="text-[13px] font-semibold text-gray-700">Relatórios</span>
                </div>
                <p className="text-[11px] text-gray-500">Histórico completo de movimentações: entradas e saídas (manuais ou por OS concluída).</p>
              </div>
              <div className="border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="h-4 w-4 text-gray-600" />
                  <span className="text-[13px] font-semibold text-gray-700">Fornecedores</span>
                </div>
                <p className="text-[11px] text-gray-500">Cadastro de fornecedores vinculado às contas a pagar para rastreamento de compras.</p>
              </div>
            </div>
            <Screenshot src="/manual/estoque.png" alt="Lista de produtos em estoque" label="[Captura de tela do módulo Estoque — lista de produtos com quantidade atual]" />

            <h3 className="font-semibold text-[14px] text-gray-700 mt-4 mb-2">Como registrar uma entrada de estoque</h3>
            <div className="space-y-2">
              <Step n={1} text="Acesse Estoque → Entradas e clique em 'Nova Entrada'." />
              <Step n={2} text="Selecione o fornecedor (opcional) e a data de compra." />
              <Step n={3} text="Adicione os produtos comprados com quantidade e valor unitário." />
              <Step n={4} text="Confirme. O saldo de cada produto será incrementado automaticamente." />
            </div>
            <Screenshot src="/manual/estoque-entradas.png" alt="Entradas de estoque" label="[Captura de tela do formulário de nova entrada de estoque]" />

            <h3 className="font-semibold text-[14px] text-gray-700 mt-4 mb-2">Baixa automática por OS</h3>
            <p className="text-[13px] text-gray-600 leading-relaxed">
              Quando o Controle de Estoque está ativo e uma OS é concluída, o sistema verifica os materiais registrados naquela OS e realiza a baixa automática de cada produto. A saída fica registrada em Relatórios com a referência da OS.
            </p>
            <Screenshot src="/manual/estoque-relatorios.png" alt="Relatórios de estoque" label="[Captura de tela dos Relatórios de Estoque com saída vinculada a uma OS]" />
          </section>

          {/* 8. Alertas e Notificações */}
          <section className="page-break">
            <SectionHeader icon={Bell} title="8. Alertas e Notificações" color="border-red-500" />
            <p className="text-[13px] text-gray-600 leading-relaxed mb-4">
              O sistema monitora automaticamente situações que requerem atenção e as exibe de forma visual no menu lateral e no sino de notificações, sem que você precise verificar cada módulo manualmente.
            </p>

            <h3 className="font-semibold text-[14px] text-gray-700 mb-2">Sino de Notificações</h3>
            <p className="text-[13px] text-gray-600 leading-relaxed mb-3">
              O ícone de sino (<Bell className="inline h-3.5 w-3.5" />) no canto superior direito da tela exibe um contador vermelho quando há alertas pendentes. Clique no sino para ver um resumo rápido e acessar diretamente o módulo com problema.
            </p>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="border-l-4 border-red-400 bg-red-50 rounded-r-lg p-3">
                <p className="text-[12px] font-semibold text-red-700 mb-1">Ordens Atrasadas</p>
                <p className="text-[11px] text-gray-500">OS com prazo de entrega vencido que ainda não foram concluídas.</p>
              </div>
              <div className="border-l-4 border-orange-400 bg-orange-50 rounded-r-lg p-3">
                <p className="text-[12px] font-semibold text-orange-700 mb-1">Contas a Pagar Vencidas</p>
                <p className="text-[11px] text-gray-500">Despesas com data de vencimento passada e status ainda pendente.</p>
              </div>
              <div className="border-l-4 border-amber-400 bg-amber-50 rounded-r-lg p-3">
                <p className="text-[12px] font-semibold text-amber-700 mb-1">Contas a Receber Vencidas</p>
                <p className="text-[11px] text-gray-500">Recebimentos com vencimento passado que ainda não foram confirmados.</p>
              </div>
            </div>

            <h3 className="font-semibold text-[14px] text-gray-700 mb-2">Badges no Menu Lateral</h3>
            <p className="text-[13px] text-gray-600 leading-relaxed mb-3">
              Cada módulo do menu exibe um badge colorido indicando pendências:
            </p>
            <FeatureList items={[
              'Badge vermelho — alertas urgentes (ordens atrasadas, contas vencidas)',
              'Badge azul/índigo — informações úteis (ex: aniversários de clientes no mês)',
              'Os subitens do menu Financeiro (Contas a Pagar, Contas a Receber) também exibem o badge individualmente',
            ]} />

            <h3 className="font-semibold text-[14px] text-gray-700 mt-4 mb-2">Aniversários de Clientes</h3>
            <p className="text-[13px] text-gray-600 leading-relaxed">
              Um badge azul aparece no menu <strong>Clientes</strong> com a contagem de clientes que fazem aniversário no mês atual. Use essa informação para oferecer promoções ou entrar em contato para fidelizar.
            </p>
            <Screenshot src="/manual/alertas.png" alt="Alertas no menu lateral" label="[Captura de tela do menu lateral com badges vermelhos e o sino de notificações com contador]" />
          </section>

          {/* 9. Configurações */}
          <section className="page-break">
            <SectionHeader icon={Settings} title="9. Configurações do Sistema" color="border-gray-500" />
            <p className="text-[13px] text-gray-600 leading-relaxed mb-4">
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
                <div key={label} className="flex items-start gap-3 border rounded-lg p-3">
                  <div className="p-1.5 bg-gray-100 rounded">
                    <Icon className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-gray-700">{label}</p>
                    <p className="text-[12px] text-gray-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Screenshot src="/manual/configuracoes.png" alt="Configurações do sistema" label="[Captura de tela da página de Configurações com as abas visíveis]" />

            <h3 className="font-semibold text-[14px] text-gray-700 mt-4 mb-2">Gerenciando Usuários da Equipe</h3>
            <p className="text-[13px] text-gray-600 leading-relaxed mb-2">
              O proprietário da organização pode criar acessos adicionais para membros da equipe.
            </p>
            <div className="space-y-2 mb-3">
              <Step n={1} text="Acesse Configurações → aba 'Usuários'." />
              <Step n={2} text="Clique em 'Novo Usuário' e preencha nome, e-mail, senha inicial e cargo (Admin ou Membro)." />
              <Step n={3} text="Clique em 'Criar Usuário'. A pessoa pode fazer login imediatamente com o e-mail e senha informados." />
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="border rounded-lg p-3">
                <p className="text-[11px] font-semibold text-violet-700 mb-1">Proprietário</p>
                <p className="text-[10px] text-gray-500">Acesso total. Único que pode gerenciar usuários e configurações avançadas.</p>
              </div>
              <div className="border rounded-lg p-3">
                <p className="text-[11px] font-semibold text-blue-700 mb-1">Administrador</p>
                <p className="text-[10px] text-gray-500">Acesso total a todos os módulos, exceto gerenciamento de usuários.</p>
              </div>
              <div className="border rounded-lg p-3">
                <p className="text-[11px] font-semibold text-gray-700 mb-1">Membro</p>
                <p className="text-[10px] text-gray-500">Acesso operacional para cadastros e OS. Sem acesso a configurações financeiras.</p>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[12px] text-amber-700 mb-4">
              <strong>Plano Free:</strong> Permite apenas 1 usuário (o proprietário). Faça upgrade para adicionar membros à equipe.
            </div>
            <Screenshot src="/manual/configuracoes-usuarios.png" alt="Aba Usuários nas Configurações" label="[Captura de tela da aba Usuários nas Configurações com lista de membros e formulário]" />

            <h3 className="font-semibold text-[14px] text-gray-700 mt-4 mb-2">Ativando o Controle de Estoque</h3>
            <div className="space-y-2">
              <Step n={1} text="Acesse Configurações → aba 'Sistema'." />
              <Step n={2} text="Na seção 'Módulos', ative o toggle 'Controle de Estoque'." />
              <Step n={3} text="Clique em 'Salvar Alterações'." />
              <Step n={4} text="A partir de agora, a seção de materiais aparecerá nas Ordens de Serviço e no cadastro de serviços." />
            </div>

            <h3 className="font-semibold text-[14px] text-gray-700 mt-4 mb-2">Configurando mensagem padrão nas OS</h3>
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
            <SectionHeader icon={FileText} title="10. Dicas e Perguntas Frequentes" color="border-pink-500" />

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
                  a: 'Sim. Acesse Configurações → aba "Usuários" e clique em "Novo Usuário". Informe nome, e-mail, senha e cargo (Admin ou Membro). O novo usuário pode fazer login imediatamente. No plano Free o limite é 1 usuário.',
                },
                {
                  q: 'Como definir uma meta mensal de receita?',
                  a: 'No Dashboard, localize o card "Meta do Mês". Clique no ícone de lápis, digite o valor da meta e pressione Enter. A barra de progresso é atualizada automaticamente conforme as OS são concluídas.',
                },
                {
                  q: 'O sino de notificações não aparece alertas. O que verificar?',
                  a: 'O sino mostra alertas apenas quando há ordens com prazo vencido (status pendente/em andamento) ou contas a pagar/receber com vencimento passado. Se não há pendências, o sino aparece sem contador — isso é esperado.',
                },
                {
                  q: 'Como funciona a numeração automática das OS?',
                  a: 'Configure o prefixo e número inicial em Configurações → Ordens de Serviço. O sistema incrementa automaticamente a cada nova OS criada.',
                },
                {
                  q: 'O estoque baixa sozinho ao concluir uma OS?',
                  a: 'Sim, desde que o Controle de Estoque esteja ativo (Configurações → Sistema) e que a OS tenha materiais registrados. A baixa é realizada uma única vez — se a OS for reaberta e concluída novamente, não há baixa duplicada.',
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
                <div key={q} className="border-l-2 border-indigo-300 pl-4">
                  <p className="text-[13px] font-semibold text-gray-700 mb-1">{q}</p>
                  <p className="text-[12px] text-gray-500 leading-relaxed">{a}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-indigo-50 border border-indigo-200 rounded-xl p-5 text-center">
              <p className="text-sm font-semibold text-indigo-800 mb-1">Precisa de mais ajuda?</p>
              <p className="text-[12px] text-indigo-600">
                Clique em <strong>"Ver tour do sistema"</strong> no rodapé do menu para rever o guia interativo a qualquer momento.
              </p>
            </div>
          </section>

          {/* Rodapé */}
          <footer className="text-center text-[11px] text-gray-400 py-6 border-t">
            <p>Meu Atelier — Manual do Sistema v3.0</p>
            <p className="mt-1">Para substituir os espaços de captura de tela, tire screenshots de cada seção e edite este documento.</p>
          </footer>

        </div>
      </div>
    </>
  )
}
