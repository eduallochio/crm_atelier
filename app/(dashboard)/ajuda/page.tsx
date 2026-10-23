'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { Header } from '@/components/layouts/header'
import { MASTER_DETAIL_CSS } from '@/components/dashboard/master-detail-css'
import {
  Printer, LayoutDashboard, Users, Scissors, FileText, DollarSign, Package, Settings,
  Wallet, ReceiptText, ArrowLeftRight, Truck, Bell, BookOpen, HelpCircle, Smartphone, X, ZoomIn,
} from 'lucide-react'

const TOC: [string, string][] = [
  ['1', 'Primeiros passos'],
  ['2', 'Dashboard'],
  ['3', 'Clientes'],
  ['4', 'Serviços'],
  ['5', 'Ordens de serviço'],
  ['6', 'Financeiro'],
  ['6.1', 'Caixa'],
  ['6.2', 'Contas a receber e a pagar'],
  ['6.3', 'Fluxo de caixa'],
  ['7', 'Estoque'],
  ['7.1', 'Fornecedores'],
  ['8', 'Alertas'],
  ['9', 'Configurações'],
  ['10', 'Dicas e perguntas'],
]
const anchor = (n: string) => `s-${n.replace('.', '-')}`

/* posição dos números sobre cada print (% da largura e da altura), medida na própria tela */
type Pin = [number, number]
const PINS: Record<string, Pin[]> = {
  dashboard: [[23.8, 29.2], [25.5, 37], [24.1, 64.9], [74.5, 69.1], [23.8, 89.8], [55.8, 83.3], [67.4, 19.4]],
  alertas: [[86.5, 3.8], [69.8, 15.3], [69.8, 25.3], [1.2, 36.8]],
  clientes: [[21.3, 15.6], [21.3, 22], [25.3, 40.4], [55.5, 27.1], [68.7, 27.1], [56.8, 74.5]],
  servicos: [[25.4, 15.3], [82.3, 18], [21.6, 60.4], [74.5, 37.5], [56.9, 83.5]],
  ordens: [[40.9, 22], [46, 32.9], [26.8, 40.4], [57, 30.5], [57, 39.2], [68.5, 39.2], [86, 47.9]],
  financeiro: [[21.6, 13.8], [23.1, 27.3], [37.4, 49.8], [77.5, 21.9], [56, 59.7], [85.9, 59.7]],
  caixa: [[21.6, 20.8], [23.1, 39.3], [48.9, 39.4], [23.2, 50.2]],
  caixaFechar: [[29.5, 23.2], [28.2, 33.8], [28.2, 56.4], [29.5, 69.1]],
  receber: [[21.3, 27.9], [21.3, 38.8], [21.6, 50.2], [57, 44.5]],
  fluxo: [[27.3, 31.1], [71.3, 22.9], [71.3, 44.5], [71.3, 67.2], [63.2, 5.4]],
  estoque: [[21.3, 27.9], [21.6, 55], [57, 41], [74.4, 41]],
  entradas: [[66.1, 5.4], [29.3, 27.9], [21.6, 39.2], [58.4, 54.4]],
  fornecedores: [[21.3, 27.9], [55.5, 33], [56.8, 82.6]],
  configuracoes: [[22.3, 26.3], [47.1, 33.3], [88.1, 33.3]],
}

type ShotProps = {
  src: string
  alt: string
  w?: number
  h?: number
  pins?: Pin[]
  legend?: React.ReactNode[]
  caption?: string
  onZoom: (s: { src: string; alt: string; w: number; h: number; pins: Pin[] }) => void
}

/** Print real da tela, com os números das partes explicadas logo abaixo; clique para ampliar */
function Shot({ src, alt, w = 1600, h = 1000, pins = [], legend = [], caption, onZoom }: ShotProps) {
  return (
    <figure className="my-6">
      <button type="button" className="aj-shot-btn group" onClick={() => onZoom({ src, alt, w, h, pins })} aria-label={`Ampliar imagem: ${alt}`}>
        <span className="relative block">
          <Image src={src} alt={alt} width={w} height={h} sizes="(max-width: 1024px) 100vw, 820px" className="block h-auto w-full" />
          {pins.map(([x, y], i) => (
            <span key={i} className={`aj-pin ${x < 3 ? 'is-edge' : ''}`} style={{ left: `${x}%`, top: `${y}%` }} aria-hidden="true">{i + 1}</span>
          ))}
          <span className="aj-zoom no-print" aria-hidden="true"><ZoomIn className="h-4 w-4" /> Ampliar</span>
        </span>
      </button>
      {legend.length > 0 && (
        <ol className="aj-legend mt-4 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
          {legend.map((l, i) => (
            <li key={i} className="flex gap-3 text-[14px] leading-snug text-foreground/85">
              <span className="aj-pin-s" aria-hidden="true">{i + 1}</span>
              <span><span className="sr-only">{i + 1}. </span>{l}</span>
            </li>
          ))}
        </ol>
      )}
      {caption && <figcaption className="mt-2 text-[13px] text-muted-foreground">{caption}</figcaption>}
    </figure>
  )
}

function SectionHeader({ icon: Icon, n, title }: { icon: React.ElementType; n: string; title: string }) {
  return (
    <div id={anchor(n)} className="aj-sec mb-5 flex scroll-mt-24 items-center gap-3 pb-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#C8714A]/12 text-[#8A4B2C] dark:text-[#E39B78]">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <h2 className="font-serif-display text-[28px] leading-tight text-foreground">
        <span className="mr-2 text-[#C8714A]">{n}</span>{title}
      </h2>
    </div>
  )
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="aj-h3 mt-7">{children}</h3>
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 text-[15px] leading-relaxed text-foreground/85">{children}</p>
}

function Steps({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="mb-4 space-y-2.5">
      {items.map((t, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="aj-step mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12.5px] font-bold tabular-nums">{i + 1}</span>
          <p className="text-[15px] leading-relaxed text-foreground/85">{t}</p>
        </li>
      ))}
    </ol>
  )
}

function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="aj-list mb-4 space-y-1.5">
      {items.map((t, i) => <li key={i} className="text-[15px] leading-relaxed text-foreground/85">{t}</li>)}
    </ul>
  )
}

function Note({ title = 'Dica', warn, children }: { title?: string; warn?: boolean; children: React.ReactNode }) {
  return (
    <div className={`aj-note ${warn ? 'aj-warn' : ''} my-4 p-4 text-[14px] leading-relaxed`}>
      <strong className="font-semibold">{title}:</strong> {children}
    </div>
  )
}

const FAQ: [string, string][] = [
  ['Como reabrir o tour do sistema?', 'Clique em “Ver tour do sistema”, no rodapé do menu lateral.'],
  ['O que acontece se eu excluir uma cliente?', 'O cadastro dela é apagado. As ordens continuam no sistema, mas ficam sem o nome dela (aparece “Cliente não informado”). Por isso, exclua só cadastros duplicados ou feitos por engano.'],
  ['Posso ter mais de um usuário?', 'Sim. Em Configurações → Usuários, clique em “Novo usuário” e informe nome, e-mail, senha e cargo. No plano Free o limite é 2 usuários; no Pro, 3.'],
  ['Como defino a meta do mês?', 'No Dashboard, na faixa de faturamento, clique em “Definir meta” (ou “Mudar a meta”), digite o valor e salve.'],
  ['Concluí uma ordem paga e o valor não entrou no caixa. Por quê?', 'O valor só entra no caixa se houver um caixa aberto. Quando isso acontece, o Financeiro mostra o aviso “ordens pagas ainda não entraram no caixa”, com o botão Lançar.'],
  ['Como funciona a numeração das ordens?', 'Cada ordem nova ganha o próximo número (#000001, #000002…). O prefixo e o número inicial ficam em Configurações → Ordens de serviço.'],
  ['O estoque baixa sozinho quando concluo uma ordem?', 'Sim, se o controle de estoque estiver ligado (Configurações → Sistema) e a ordem tiver materiais. A baixa acontece uma vez só, mesmo se a ordem for reaberta.'],
  ['Como imprimo ou envio a ordem para a cliente?', 'Abra a ordem: “Imprimir” gera o comprovante em PDF e “Enviar OS” abre o WhatsApp com o resumo pronto.'],
  ['Consigo exportar meus dados?', 'Sim. Contas a receber, contas a pagar e o fluxo de caixa exportam para Excel e PDF (ícones no topo da tela), e o estoque tem relatórios em PDF e Excel.'],
  ['Posso usar no celular?', 'Pode. Todas as telas funcionam no celular: a lista aparece primeiro e, ao tocar num item, a ficha abre em seguida, com “Voltar” para a lista.'],
]

export default function AjudaPage() {
  const [active, setActive] = useState('1')
  const [zoom, setZoom] = useState<{ src: string; alt: string; w: number; h: number; pins: Pin[] } | null>(null)
  const onZoom = useCallback((s: NonNullable<typeof zoom>) => setZoom(s), [])

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

  useEffect(() => {
    if (!zoom) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setZoom(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [zoom])

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
          #manual-content { position: absolute; left: 0; top: 0; width: 100%; color: #2C1810; border: 0; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
          figure { break-inside: avoid; }
          @page { margin: 16mm 14mm; size: A4; }
        }
      `}</style>

      <div className="flex min-h-full flex-col">
        <div className="no-print">
          <Header title="Manual do sistema" description="Como funciona cada parte do Meu Atelier, com as telas reais" />
        </div>

        <div className="mx-auto flex w-full max-w-6xl flex-1 gap-8 px-4 py-6 sm:px-6 lg:py-8">
          <aside className="no-print hidden w-60 shrink-0 lg:block">
            <nav aria-label="Seções do manual" className="sticky top-6">
              <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Neste manual</p>
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

          <div id="manual-content" className="aj-paper min-w-0 flex-1 space-y-16 px-5 py-8 sm:px-10">

            {/* Capa */}
            <div className="aj-cover pb-10 text-center">
              <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#C8714A]/12 text-[#8A4B2C] dark:text-[#E39B78]">
                <BookOpen className="h-7 w-7" aria-hidden="true" />
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Manual de utilização</p>
              <h1 className="font-serif-display mt-2 text-[44px] leading-none text-foreground sm:text-[56px]">Meu <em className="text-[#C8714A]">Atelier</em></h1>
              <p className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
                Cada tela do sistema, com o print real e os números indicando o que faz cada parte. Clique em qualquer imagem para ampliar.
              </p>
              <div className="no-print mt-5 flex justify-center lg:hidden">
                <button type="button" onClick={() => window.print()} className="cli-ghost">
                  <Printer className="h-4 w-4" aria-hidden="true" />Imprimir / PDF
                </button>
              </div>
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

            {/* 1. Primeiros passos */}
            <section>
              <SectionHeader icon={Smartphone} n="1" title="Primeiros passos" />
              <P>
                O <strong>Meu Atelier</strong> funciona no navegador, no computador ou no celular, sem instalar nada. Tudo o que você cadastra fica guardado com segurança e só a sua equipe enxerga.
              </P>
              <List items={[
                <>O <strong>menu lateral</strong> leva a cada parte do sistema: Dashboard, Clientes, Serviços, Ordens de Serviço, Financeiro, Estoque, Configurações e este manual.</>,
                <>No alto da tela ficam o <strong>sino de alertas</strong>, a troca de tema (claro ou escuro) e o seu perfil.</>,
                <>Quase todas as telas seguem o mesmo jeito: a <strong>lista à esquerda</strong>, com busca e filtros, e a <strong>ficha do item escolhido à direita</strong>.</>,
                <>No celular, a lista aparece primeiro; tocando num item, a ficha abre na tela inteira, com o botão “Voltar”.</>,
              ]} />
              <div className="my-6 grid grid-cols-2 gap-4 sm:gap-6">
                <Shot src="/manual/celular-dashboard.webp" alt="Dashboard no celular" w={780} h={1560} onZoom={onZoom} caption="O Dashboard no celular" />
                <Shot src="/manual/celular-ordem.webp" alt="Ficha da ordem de serviço no celular" w={780} h={1560} onZoom={onZoom} caption="Uma ordem aberta no celular" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="aj-card p-4">
                  <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#8A4B2C] dark:text-[#E39B78]">Plano Free</p>
                  <p className="mt-1 text-[14px] text-foreground/85">50 clientes · 20 serviços · 100 ordens · 2 usuários</p>
                </div>
                <div className="aj-card p-4">
                  <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#8A4B2C] dark:text-[#E39B78]">Plano Pro</p>
                  <p className="mt-1 text-[14px] text-foreground/85">Clientes, serviços e ordens ilimitados · 3 usuários · Financeiro e Estoque</p>
                </div>
              </div>
            </section>

            {/* 2. Dashboard */}
            <section className="page-break">
              <SectionHeader icon={LayoutDashboard} n="2" title="Dashboard" />
              <P>
                É a primeira tela depois do login e responde a uma pergunta: <strong>o que precisa sair do ateliê hoje?</strong> No topo, uma frase resume o dia (entregas de hoje, ordens atrasadas e quanto há para receber).
              </P>
              <Shot src="/manual/dashboard.webp" alt="Dashboard com as entregas da semana, o faturamento do mês, o caixa e os lembretes" h={1300} pins={PINS.dashboard} onZoom={onZoom} legend={[
                <><strong>Entregas da semana</strong>: as ordens em aberto em quatro colunas: Atrasadas, Hoje, Amanhã e Próximos dias (até 7 dias).</>,
                <><strong>Cartão da ordem</strong>: clique para ver as ações rápidas: <em>Avisar</em> (WhatsApp para a cliente) e <em>Concluir</em>.</>,
                <><strong>Faturamento do mês</strong>: soma das ordens concluídas, comparada com o mês passado.</>,
                <><strong>Meta</strong>: a linha costurada mostra quanto falta e quanto precisa entrar por dia. Clique em “Mudar a meta” para ajustar.</>,
                <><strong>Caixa</strong>: quanto há na gaveta agora, com entradas, saídas e sangrias do dia. Dá para <strong>abrir e fechar o caixa aqui mesmo</strong>, sem ir à tela do Financeiro.</>,
                <><strong>Lembretes</strong>: aniversários, ordens concluídas a receber, clientes sumidas há mais de 90 dias e materiais acabando.</>,
                <><strong>Nova ordem</strong> e <strong>Novo cliente</strong>: atalhos para os cadastros mais usados, ao lado da busca.</>,
              ]} />
              <Note>Ao concluir uma ordem que ainda tem saldo, o sistema pergunta se a cliente já pagou, igual à tela de Ordens (veja a seção 5).</Note>
            </section>

            {/* 3. Clientes */}
            <section className="page-break">
              <SectionHeader icon={Users} n="3" title="Clientes" />
              <P>O cadastro das clientes, com o contato, o endereço, o aniversário e todo o histórico de ordens de cada uma.</P>
              <Shot src="/manual/clientes.webp" alt="Tela de Clientes com a lista e a ficha da cliente" pins={PINS.clientes} onZoom={onZoom} legend={[
                <><strong>Busca</strong> por nome, e-mail ou telefone.</>,
                <><strong>Filtros</strong>: aniversariantes do mês, novos no mês, sem telefone e sem e-mail.</>,
                <><strong>Lista</strong>: o bolo marca quem faz aniversário este mês. Clique para abrir a ficha.</>,
                <><strong>Nova ordem</strong> já com a cliente escolhida.</>,
                <><strong>WhatsApp</strong> abre a conversa com a cliente; ao lado ficam Editar e, no “⋯”, Excluir.</>,
                <><strong>Histórico de ordens</strong>: cada ordem da cliente, com status e valor. Acima, os totais: ordens, em aberto e total gasto.</>,
              ]} />
              <H3>Como cadastrar uma cliente</H3>
              <Steps items={[
                'Clique em “Novo cliente”, no alto da tela.',
                'Preencha o nome (obrigatório) e, se quiser, telefone, e-mail, endereço, aniversário e observações.',
                'Salve. A cliente aparece na lista na hora e já pode ser usada nas ordens.',
              ]} />
              <Note>O endereço tem o link “Mapa”, que abre o local no Google Maps.</Note>
            </section>

            {/* 4. Serviços */}
            <section className="page-break">
              <SectionHeader icon={Scissors} n="4" title="Serviços" />
              <P>O catálogo do que o ateliê faz, com preço, tempo, dificuldade e os materiais que cada serviço gasta. Os serviços daqui aparecem na hora de montar uma ordem.</P>
              <Shot src="/manual/servicos.webp" alt="Tela de Serviços com o catálogo e a ficha do serviço" pins={PINS.servicos} onZoom={onZoom} legend={[
                <><strong>Aviso de serviços sem preço</strong>: o sistema já vem com serviços comuns de ateliê; informe o valor de cada um para usá-los.</>,
                <><strong>Filtros</strong>: ativos, inativos e sem preço, além de categoria e ordem (A–Z, preço, mais vendidos).</>,
                <><strong>Lista</strong> com preço, tempo e quantas vezes o serviço foi vendido.</>,
                <><strong>Ações</strong>: Editar, Duplicar (para criar um parecido) e Histórico de preços.</>,
                <><strong>Materiais</strong>: o que o serviço consome do estoque, com o custo e a margem de lucro calculados.</>,
              ]} />
              <H3>Ligando materiais a um serviço</H3>
              <Steps items={[
                'Com o controle de estoque ligado (Configurações → Sistema), abra o serviço e clique em “Editar”.',
                'Em “Materiais e custo”, escolha o produto, informe a quantidade e adicione.',
                'O custo e a margem são calculados na hora. Ao criar uma ordem com esse serviço, os materiais já vêm preenchidos.',
              ]} />
            </section>

            {/* 5. Ordens de serviço */}
            <section className="page-break">
              <SectionHeader icon={FileText} n="5" title="Ordens de serviço" />
              <P>O coração do sistema. Cada ordem junta a cliente, os serviços, o prazo, o pagamento e o andamento do trabalho.</P>
              <Shot src="/manual/ordens.webp" alt="Tela de Ordens de Serviço com a lista e a ficha da ordem" pins={PINS.ordens} onZoom={onZoom} legend={[
                <><strong>Filtros</strong>: pendentes, em andamento, atrasadas, a receber, concluídas e canceladas, cada uma com a contagem.</>,
                <><strong>Período, ordem e Selecionar</strong>: “Selecionar” permite mudar o status ou excluir várias ordens de uma vez.</>,
                <><strong>Lista</strong> com cliente, serviços, status e prazo (“Entrega hoje”, “Atrasada 2 dias”…).</>,
                <><strong>Andamento</strong>: Pendente → Em andamento → Concluída.</>,
                <><strong>Botão principal</strong>: muda conforme a etapa: Iniciar, Concluir, Registrar pagamento ou Avisar que está pronta.</>,
                <><strong>Enviar OS</strong> (WhatsApp com o resumo), <strong>Imprimir</strong> (comprovante em PDF) e, no “⋯”, cancelar, reabrir ou excluir.</>,
                <><strong>Total, pago e saldo</strong>. Mais abaixo: cliente, prazo, serviços, observações, notas internas e histórico.</>,
              ]} />

              <H3>Como criar uma ordem</H3>
              <Steps items={[
                'Clique em “Nova ordem” (aqui, no Dashboard ou na ficha da cliente).',
                'Escolha a cliente. Se ela ainda não existir, cadastre antes em Clientes.',
                'Defina o status e a data prevista de entrega.',
                'Adicione os serviços com a quantidade. Se houver desconto ou entrada (sinal), informe em “Pagamento”.',
                'Marque, se quiser, “Gerar PDF” e “Enviar pelo WhatsApp”, e clique em “Gerar OS”. A prévia aparece antes de salvar.',
              ]} />
              <Shot src="/manual/ordens-nova.webp" alt="Janela de nova ordem de serviço" onZoom={onZoom} caption="A janela de nova ordem. O número (#000036…) só é criado depois que a ordem é gerada." />

              <H3>Concluindo e recebendo</H3>
              <P>Ao concluir uma ordem que ainda tem saldo, o sistema pergunta se a cliente já pagou:</P>
              <Shot src="/manual/ordens-pagamento.webp" alt="Janela de conclusão perguntando se a ordem foi paga" onZoom={onZoom} />
              <List items={[
                <><strong>Sim — lançar no caixa</strong>: escolha a forma de pagamento e a data. A ordem fica paga e o valor entra no caixa aberto.</>,
                <><strong>Não — gerar conta a receber</strong>: a ordem é concluída e o saldo vira uma conta a receber, para cobrar depois.</>,
              ]} />
              <Note warn title="Atenção">Sem caixa aberto, a ordem fica paga mas o valor não entra no caixa. O Financeiro avisa e deixa lançar depois.</Note>
            </section>

            {/* 6. Financeiro */}
            <section className="page-break">
              <SectionHeader icon={DollarSign} n="6" title="Financeiro" />
              <P>O dinheiro do ateliê em cinco abas: <strong>Visão geral</strong>, <strong>A receber</strong>, <strong>A pagar</strong>, <strong>Fluxo de caixa</strong> e <strong>Caixa</strong>. Os números ao lado das abas mostram o que está atrasado.</P>
              <Shot src="/manual/financeiro.webp" alt="Visão geral do Financeiro com o caixa e as contas da semana" pins={PINS.financeiro} onZoom={onZoom} legend={[
                <><strong>Abas</strong> do Financeiro.</>,
                <><strong>Caixa de hoje</strong>: o valor na gaveta agora, com o inicial, as entradas, as saídas e as sangrias.</>,
                <><strong>Movimentos rápidos</strong>: Entrada, Saída, Sangria (tirar dinheiro) e Reforço (pôr dinheiro).</>,
                <><strong>Período</strong> dos totais: 7 dias, 30 dias, este mês, mês passado ou tudo.</>,
                <><strong>Contas desta semana</strong>: o que vence nos próximos dias, das atrasadas às de hoje.</>,
                <><strong>Receber / Pagar</strong>: dá baixa na conta direto daqui.</>,
              ]} />
              <Note>Se alguma ordem paga não entrou no caixa, aparece um aviso no fim do caixa com o botão <strong>Lançar</strong>.</Note>
            </section>

            {/* 6.1 Caixa */}
            <section className="page-break">
              <SectionHeader icon={Wallet} n="6.1" title="Caixa" />
              <P>Um <strong>caixa</strong> é cada lugar onde o dinheiro entra: a gaveta do balcão, uma conta PIX, uma segunda loja. Cada um abre e fecha separado, e cada abertura vira uma <strong>sessão</strong>.</P>
              <Shot src="/manual/caixa.webp" alt="Tela de caixas com os caixas cadastrados e as últimas sessões" pins={PINS.caixa} onZoom={onZoom} legend={[
                <><strong>Meus caixas</strong>: o caixa aberto aparece escuro, com o horário e o valor inicial.</>,
                <><strong>Ver o caixa</strong>: abre a sessão do dia com todos os movimentos.</>,
                <><strong>Abrir caixa</strong>: informe o valor inicial (o troco) e comece o dia.</>,
                <><strong>Últimas sessões fechadas</strong>, com o que sobrou ou faltou na conferência.</>,
              ]} />
              <H3>Fechando o caixa</H3>
              <P>No fim do dia, abra o caixa e clique em <strong>Fechar caixa</strong>. Conte o dinheiro e confira cada forma de pagamento:</P>
              <Shot src="/manual/caixa-fechar.webp" alt="Janela de fechamento do caixa com a conferência" pins={PINS.caixaFechar} onZoom={onZoom} legend={[
                <><strong>O sistema esperava</strong>: o valor calculado pelos movimentos do dia.</>,
                <><strong>Conferência</strong>: quanto entrou em dinheiro, PIX, crédito, débito e outros.</>,
                <><strong>Valor contado</strong>: o que realmente há no caixa.</>,
                <><strong>Diferença</strong> na hora: “bateu”, “faltam” ou “sobram”. Se não bater, dá para revisar ou fechar assim mesmo, com uma observação.</>,
              ]} />
              <H3>Cadastrando um caixa</H3>
              <Steps items={[
                'Em Financeiro → Caixa, clique em “Novo caixa”.',
                'Dê um nome (ex.: “Gaveta do balcão”, “Conta PIX”) e, se quiser, uma descrição e a chave PIX.',
                'Salve. O caixa fica pronto para abrir quando o dia começar.',
              ]} />
              <Note>A chave PIX do caixa é informativa: ajuda a saber para qual conta o dinheiro foi. Se o ateliê tem uma chave só, cadastre em Configurações → Financeiro e use o atalho “Usar chave das configurações”.</Note>
            </section>

            {/* 6.2 Contas */}
            <section className="page-break">
              <SectionHeader icon={ReceiptText} n="6.2" title="Contas a receber e a pagar" />
              <P>As duas telas funcionam igual. <strong>A receber</strong> junta o que as clientes devem (muitas contas nascem sozinhas ao concluir uma ordem sem pagamento). <strong>A pagar</strong> junta as despesas do ateliê, inclusive as que se repetem todo mês.</P>
              <Shot src="/manual/receber.webp" alt="Tela de contas a receber com a lista e o detalhe da conta" pins={PINS.receber} onZoom={onZoom} legend={[
                <><strong>Filtros</strong>: atrasadas, vencem em 7 dias, em aberto, recebidas (ou pagas) e canceladas.</>,
                <><strong>Data, forma de pagamento e ordem</strong> da lista. Acima dela, o total em aberto e em atraso.</>,
                <><strong>Lista</strong> com o vencimento de cada conta (“Atrasada 4 dias”, “Vence hoje”).</>,
                <><strong>Marcar como recebida</strong> (ou paga): dá baixa na hora, com a data de hoje. Para outra data ou forma de pagamento, use Editar.</>,
              ]} />
              <Steps items={[
                'Para lançar uma conta nova, clique em “Nova conta”, no alto.',
                'Informe a descrição, o valor, o vencimento e, se quiser, a forma de pagamento e a categoria.',
                'Os ícones ao lado de “Nova conta” exportam a lista em Excel ou PDF.',
              ]} />
            </section>

            {/* 6.3 Fluxo */}
            <section className="page-break">
              <SectionHeader icon={ArrowLeftRight} n="6.3" title="Fluxo de caixa" />
              <P>Todos os lançamentos, entradas e saídas, de todos os caixas e contas, num lugar só, com os totais do período escolhido.</P>
              <Shot src="/manual/fluxo.webp" alt="Tela de fluxo de caixa com os lançamentos e os totais" pins={PINS.fluxo} onZoom={onZoom} legend={[
                <><strong>Tudo, Entradas ou Saídas</strong>, com período e ordem. A lista agrupa os lançamentos por dia.</>,
                <><strong>Saldo do filtro</strong>: entradas menos saídas do que está na tela.</>,
                <><strong>Entradas por forma de pagamento</strong>: quanto veio de PIX, dinheiro, cartão…</>,
                <><strong>Últimos 6 meses</strong>: entradas e saídas mês a mês.</>,
                <><strong>Exportar</strong> em PDF ou Excel e, ao lado, <strong>Lançamento</strong> para registrar uma entrada ou saída avulsa.</>,
              ]} />
            </section>

            {/* 7. Estoque */}
            <section className="page-break">
              <SectionHeader icon={Package} n="7" title="Estoque" />
              <P>Os materiais do ateliê (tecidos, linhas, aviamentos) com a quantidade de cada um. Cinco abas: <strong>Produtos</strong>, <strong>Entradas</strong>, <strong>Saídas</strong>, <strong>Relatórios</strong> e <strong>Fornecedores</strong>.</P>
              <Shot src="/manual/estoque.webp" alt="Tela de estoque com os produtos e a ficha do produto" pins={PINS.estoque} onZoom={onZoom} legend={[
                <><strong>Filtros</strong>: estoque baixo, zerados, ativos e inativos.</>,
                <><strong>Régua de cada produto</strong>: a linha costurada mostra a quantidade até o mínimo. Abaixo dele, o produto fica em alerta.</>,
                <><strong>Registrar entrada</strong>: soma ao estoque (compra ou reposição).</>,
                <><strong>Saída</strong>: tira do estoque (uso, perda, amostra).</>,
              ]} />
              <H3>Entradas de estoque</H3>
              <Shot src="/manual/estoque-entradas.webp" alt="Tela de entradas de estoque com a nota fiscal" pins={PINS.entradas} onZoom={onZoom} legend={[
                <><strong>Nova entrada</strong>: manual ou com os dados da nota fiscal.</>,
                <><strong>Filtros</strong>: este mês, com nota fiscal e manuais.</>,
                <><strong>Lista</strong> das compras com fornecedor, nota e valor.</>,
                <><strong>Itens</strong> da entrada; o saldo de cada produto sobe na hora.</>,
              ]} />
              <H3>Baixa automática pelas ordens</H3>
              <P>Com o controle de estoque ligado, ao concluir uma ordem que tem materiais, o sistema dá baixa em cada produto. A saída aparece na aba Saídas, com o número da ordem.</P>
              <Note>Em <strong>Relatórios</strong> há a posição do estoque, os itens em estoque baixo, o valor total parado em estoque e o histórico de entradas, todos com exportação em PDF e Excel.</Note>
            </section>

            {/* 7.1 Fornecedores */}
            <section className="page-break">
              <SectionHeader icon={Truck} n="7.1" title="Fornecedores" />
              <P>Onde o ateliê compra. Cada fornecedor guarda o contato, o endereço, o PIX e todas as compras ligadas a ele.</P>
              <Shot src="/manual/fornecedores.webp" alt="Tela de fornecedores com a ficha do fornecedor" pins={PINS.fornecedores} onZoom={onZoom} legend={[
                <><strong>Filtros</strong>: empresas, pessoas físicas e inativos. A busca aceita nome, CNPJ, telefone ou e-mail.</>,
                <><strong>WhatsApp</strong> com o fornecedor, Editar e mais ações.</>,
                <><strong>Últimas compras</strong>: as entradas de estoque desse fornecedor, com o link “Ver entradas”.</>,
              ]} />
            </section>

            {/* 8. Alertas */}
            <section className="page-break">
              <SectionHeader icon={Bell} n="8" title="Alertas" />
              <P>O sistema avisa sozinho o que precisa de atenção, sem você entrar em cada tela.</P>
              <Shot src="/manual/alertas.webp" alt="Sino de alertas aberto e os números no menu lateral" pins={PINS.alertas} onZoom={onZoom} legend={[
                <><strong>Sino</strong>: o número vermelho é o total de pendências.</>,
                <><strong>Ordens atrasadas</strong>: prazo vencido e ainda não concluídas.</>,
                <><strong>Contas vencidas</strong>, a receber e a pagar. Clique para ir direto à tela.</>,
                <><strong>Menu lateral</strong>: cada módulo mostra o seu número de pendências; em Clientes, o número é de aniversariantes.</>,
              ]} />
            </section>

            {/* 9. Configurações */}
            <section className="page-break">
              <SectionHeader icon={Settings} n="9" title="Configurações" />
              <P>Os ajustes do sistema, separados em seções. A seção escolhida fica no endereço da página, então dá para salvar o link.</P>
              <Shot src="/manual/configuracoes.webp" alt="Configurações na seção Empresa" pins={PINS.configuracoes} onZoom={onZoom} legend={[
                <><strong>Seções</strong> à esquerda (no celular, em abas).</>,
                <><strong>Formulário</strong> da seção escolhida.</>,
                <><strong>Editar</strong>: libera os campos para alteração.</>,
              ]} />
              <div className="grid gap-2.5 sm:grid-cols-2">
                {[
                  ['Empresa', 'Nome, CNPJ (com busca automática), logo, endereço e contatos que saem nas ordens e comprovantes.'],
                  ['Usuários', 'Quem acessa o sistema e o cargo de cada pessoa: Administrador ou Membro.'],
                  ['Financeiro', 'Formas de pagamento aceitas, chave PIX e taxas.'],
                  ['Ordens de serviço', 'Prefixo e número inicial, status inicial, campos obrigatórios, prazo padrão e impressora.'],
                  ['Notificações', 'Lembretes para você e a mensagem padrão das ordens.'],
                  ['Sistema', 'Formato de data e moeda, caixa e os módulos ligados, como o controle de estoque.'],
                  ['Assinatura', 'O seu plano, o uso dos recursos e o upgrade.'],
                ].map(([t, d]) => (
                  <div key={t} className="aj-card p-3.5">
                    <p className="text-[14.5px] font-semibold text-foreground">{t}</p>
                    <p className="mt-0.5 text-[13.5px] leading-snug text-muted-foreground">{d}</p>
                  </div>
                ))}
              </div>
              <H3>Ligando o controle de estoque</H3>
              <Steps items={[
                'Abra Configurações → Sistema.',
                'Ligue “Controle de estoque” e salve.',
                'A partir daí, os materiais aparecem nos serviços e nas ordens, e a baixa passa a ser automática.',
              ]} />
              <Note title="Plano Free">Permite até 2 usuários. No plano Pro são 3.</Note>
            </section>

            {/* 10. Dicas */}
            <section className="page-break">
              <SectionHeader icon={HelpCircle} n="10" title="Dicas e perguntas" />
              <div className="space-y-2">
                {FAQ.map(([q, a]) => (
                  <details key={q} className="aj-faq group" open>
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-4 py-3 text-[15px] font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                      {q}
                      <span className="mt-1 text-[#C8714A] transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                    </summary>
                    <p className="pb-4 text-[14.5px] leading-relaxed text-foreground/80">{a}</p>
                  </details>
                ))}
              </div>
              <div className="aj-note mt-8 p-5 text-center">
                <p className="font-serif-display text-2xl text-foreground">Ainda com dúvida?</p>
                <p className="mt-1 text-[14px] text-muted-foreground">
                  Clique em “Ver tour do sistema”, no rodapé do menu, para rever o passo a passo guiado a qualquer momento.
                </p>
              </div>
            </section>

            <footer className="border-t border-dashed border-border py-6 text-center text-[12.5px] text-muted-foreground">
              Meu Atelier · Manual do sistema · as telas usam dados de exemplo
            </footer>
          </div>
        </div>
      </div>

      {/* imagem ampliada */}
      {zoom && (
        <div role="dialog" aria-modal="true" aria-label={zoom.alt} className="no-print fixed inset-0 z-[60] flex items-center justify-center bg-[#1A110C]/85 p-3 sm:p-8" onClick={() => setZoom(null)}>
          <button type="button" onClick={() => setZoom(null)} className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#FFF8F0] text-[#2C1810] shadow-lg" aria-label="Fechar imagem" autoFocus>
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="relative max-h-full w-auto max-w-[1400px] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <span className="relative block">
              <Image src={zoom.src} alt={zoom.alt} width={zoom.w} height={zoom.h} sizes="100vw" className="block h-auto max-h-[88vh] w-auto rounded-lg" />
              {zoom.pins.map(([x, y], i) => (
                <span key={i} className={`aj-pin ${x < 3 ? 'is-edge' : ''}`} style={{ left: `${x}%`, top: `${y}%` }} aria-hidden="true">{i + 1}</span>
              ))}
            </span>
          </div>
        </div>
      )}
    </>
  )
}

const AJ_CSS = `
.aj-paper { background: var(--card); border: 1px solid color-mix(in oklab, var(--border) 70%, transparent); border-radius: 12px; }
.aj-cover { border-bottom: 2px dashed color-mix(in oklab, #C8714A 35%, transparent); }
.aj-sec { border-bottom: 1.5px dashed color-mix(in oklab, #C8714A 40%, transparent); }
.aj-h3 { font-family: var(--font-cormorant), Georgia, serif; font-weight: 600; font-size: 22px; line-height: 1.2; color: var(--foreground); margin-bottom: .6rem; }
.aj-step { background: color-mix(in oklab, #C8714A 14%, transparent); color: #8A4B2C; border: 1px dashed color-mix(in oklab, #C8714A 55%, transparent); }
.dark .aj-step { color: #E39B78; }
.aj-list li { position: relative; padding-left: 22px; }
.aj-list li::before { content: ''; position: absolute; left: 2px; top: .72em; width: 12px; border-top: 2px dashed #C8714A; }
.aj-note { background: color-mix(in oklab, #D4A85A 10%, var(--card)); border: 1px dashed color-mix(in oklab, #D4A85A 60%, transparent); border-radius: 8px; color: var(--foreground); }
.aj-warn { background: color-mix(in oklab, #C8714A 9%, var(--card)); border-color: color-mix(in oklab, #C8714A 55%, transparent); }
.aj-card { background: var(--background); border: 1px solid color-mix(in oklab, var(--border) 80%, transparent); border-radius: 8px; }
.aj-faq { border-bottom: 1px dashed color-mix(in oklab, var(--border) 90%, transparent); }
.aj-toc { border-left: 1.5px dashed color-mix(in oklab, #C8714A 35%, transparent); }
.aj-toc-a { display: flex; align-items: baseline; padding: 6px 12px; margin-left: -1.5px; border-left: 2px solid transparent; font-size: 14px; color: var(--muted-foreground); transition: color .15s, border-color .15s, background .15s; }
.aj-toc-a:hover { color: var(--foreground); }
.aj-toc-a.is-on { color: var(--foreground); font-weight: 600; border-left-color: #C8714A; background: color-mix(in oklab, #C8714A 7%, transparent); }
.aj-shot-btn { display: block; width: 100%; padding: 0; border: 1px solid color-mix(in oklab, var(--border) 90%, transparent); border-radius: 10px; overflow: hidden; background: var(--background); cursor: zoom-in; box-shadow: 0 10px 30px -18px rgba(44,24,16,.45); text-align: left; }
.aj-shot-btn:focus-visible { outline: 2px solid #C8714A; outline-offset: 3px; }
.aj-zoom { position: absolute; right: 10px; bottom: 10px; display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 999px; background: rgba(44,24,16,.82); color: #FFF8F0; font-size: 12.5px; font-weight: 600; opacity: 0; transition: opacity .15s; }
.aj-shot-btn:hover .aj-zoom, .aj-shot-btn:focus-visible .aj-zoom { opacity: 1; }
.aj-pin { position: absolute; transform: translate(-100%, -50%); display: flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 50%; background: #C8714A; color: #FFF8F0; font: 700 13px/1 system-ui, sans-serif; border: 2px solid #FFF8F0; box-shadow: 0 2px 8px rgba(44,24,16,.45); pointer-events: none; font-variant-numeric: tabular-nums; }
.aj-pin.is-edge { transform: translate(10%, -50%); }
@media (max-width: 640px) { .aj-pin { width: 20px; height: 20px; font-size: 11px; border-width: 1.5px; } }
.aj-pin-s { flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; margin-top: 1px; border-radius: 50%; background: #C8714A; color: #FFF8F0; font: 700 12px/1 system-ui, sans-serif; font-variant-numeric: tabular-nums; }
@media (prefers-reduced-motion: reduce) { .aj-toc-a, .aj-zoom { transition: none; } }
`
