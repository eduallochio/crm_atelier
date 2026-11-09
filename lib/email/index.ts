import { Resend } from 'resend'
import fs from 'fs'
import path from 'path'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_DEFAULT = 'Meu Atelier <nao-responda@meuateliersistema.com.br>'
const FROM_FINANCE = 'Meu Atelier Financeiro <financeiro@meuateliersistema.com.br>'
const REPLY_TO = 'contato@meuateliersistema.com.br'

function loadTemplate(name: string): string {
  const filePath = path.join(process.cwd(), 'emails', name)
  return fs.readFileSync(filePath, 'utf-8')
}

function fill(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (html, [key, value]) => html.replaceAll(`{{${key}}}`, value),
    template
  )
}

async function send(options: {
  to: string
  subject: string
  html: string
  from?: string
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY não configurada — email não enviado')
    return
  }
  const { error } = await resend.emails.send({
    from: options.from ?? FROM_DEFAULT,
    replyTo: REPLY_TO,
    to: options.to,
    subject: options.subject,
    html: options.html,
  })
  if (error) {
    console.error('[email] Erro ao enviar:', error)
    throw new Error(`Falha ao enviar email: ${error.message}`)
  }
}

// ── Templates ────────────────────────────────────────────────────────────────

export async function sendBoasVindas(to: string, nome: string) {
  const html = fill(loadTemplate('04-boas-vindas.html'), {
    nome,
    url_sistema: process.env.NEXT_PUBLIC_APP_URL ?? 'https://meuateliersistema.com.br',
  })
  await send({ to, subject: 'Bem-vinda ao Meu Atelier', html })
}

export async function sendConviteEquipe(options: {
  to: string
  dona: string
  atelie: string
  papel: string
  urlConvite: string
}) {
  const html = fill(loadTemplate('05-convite-equipe.html'), {
    dona: options.dona,
    atelie: options.atelie,
    email: options.to,
    papel: options.papel,
    url_convite: options.urlConvite,
  })
  await send({
    to: options.to,
    subject: `${options.dona} convidou você para o ${options.atelie}`,
    html,
  })
}

export async function sendPagamentoConfirmado(options: {
  to: string
  ciclo: string
  forma: string
  data: string
  proximaRenovacao: string
  valor: string
}) {
  const html = fill(loadTemplate('06-pagamento-confirmado.html'), {
    ciclo: options.ciclo,
    forma: options.forma,
    data: options.data,
    proxima_renovacao: options.proximaRenovacao,
    valor: options.valor,
    url_sistema: process.env.NEXT_PUBLIC_APP_URL ?? 'https://meuateliersistema.com.br',
  })
  await send({
    to: options.to,
    subject: 'Pagamento confirmado — seu plano Pro está ativo',
    html,
    from: FROM_FINANCE,
  })
}

export async function sendPixAguardando(options: {
  to: string
  valor: string
  validade: string
  urlPagamento: string
  pixCopiaCola: string
}) {
  const html = fill(loadTemplate('07-pix-aguardando.html'), {
    valor: options.valor,
    validade: options.validade,
    url_pagamento: options.urlPagamento,
    pix_copia_cola: options.pixCopiaCola,
  })
  await send({
    to: options.to,
    subject: 'Seu PIX está esperando — Meu Atelier',
    html,
    from: FROM_FINANCE,
  })
}

export async function sendPagamentoAtrasado(options: {
  to: string
  ciclo: string
  valor: string
  vencimento: string
  prazo: string
  urlPagamento: string
}) {
  const html = fill(loadTemplate('08-pagamento-atrasado.html'), {
    ciclo: options.ciclo,
    valor: options.valor,
    vencimento: options.vencimento,
    prazo: options.prazo,
    url_pagamento: options.urlPagamento,
  })
  await send({
    to: options.to,
    subject: 'Não conseguimos confirmar seu pagamento',
    html,
    from: FROM_FINANCE,
  })
}

export async function sendLimitePlano(options: {
  to: string
  percentual: string
  clientesUso: string
  clientesMax: string
  pctClientes: string
  corClientes: string
  ordensUso: string
  ordensMax: string
  pctOrdens: string
  corOrdens: string
}) {
  const html = fill(loadTemplate('09-limite-plano.html'), {
    percentual: options.percentual,
    clientes_uso: options.clientesUso,
    clientes_max: options.clientesMax,
    pct_clientes: options.pctClientes,
    cor_clientes: options.corClientes,
    ordens_uso: options.ordensUso,
    ordens_max: options.ordensMax,
    pct_ordens: options.pctOrdens,
    cor_ordens: options.corOrdens,
  })
  await send({
    to: options.to,
    subject: `Você já usou ${options.percentual} do plano Free`,
    html,
  })
}

export async function sendAssinaturaCancelada(options: {
  to: string
  ciclo: string
  fimAcesso: string
}) {
  const html = fill(loadTemplate('10-assinatura-cancelada.html'), {
    ciclo: options.ciclo,
    fim_acesso: options.fimAcesso,
    url_sistema: process.env.NEXT_PUBLIC_APP_URL ?? 'https://meuateliersistema.com.br',
  })
  await send({
    to: options.to,
    subject: 'Sua assinatura foi cancelada',
    html,
  })
}
