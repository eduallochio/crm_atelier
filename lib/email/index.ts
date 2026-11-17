import { Resend } from 'resend'
import fs from 'fs'
import path from 'path'
import QRCode from 'qrcode'

let _resend: import('resend').Resend | null = null
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY ?? '')
  return _resend
}

const FROM_DEFAULT = 'Meu Atelier Sistema <nao-responda@meuateliersistema.com.br>'
const FROM_FINANCE = 'Meu Atelier Sistema <financeiro@meuateliersistema.com.br>'
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
}): Promise<{ id: string | null }> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY não configurada — email não enviado')
    return { id: null }
  }
  const { data, error } = await getResend().emails.send({
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
  return { id: data?.id ?? null }
}

// ── Templates ────────────────────────────────────────────────────────────────

export async function sendConfirmarEmail(to: string, urlConfirmacao: string) {
  const html = fill(loadTemplate('01-confirmar-email.html'), {
    url_confirmacao: urlConfirmacao,
  })
  await send({ to, subject: 'Confirme seu e-mail — Meu Atelier Sistema', html })
}

export async function sendRedefinirSenha(to: string, urlRedefinicao: string) {
  const html = fill(loadTemplate('02-redefinir-senha.html'), {
    url_redefinicao: urlRedefinicao,
  })
  await send({ to, subject: 'Redefinir sua senha — Meu Atelier Sistema', html })
}

export async function sendTrocarEmail(to: string, emailNovo: string, urlConfirmacao: string) {
  const html = fill(loadTemplate('03-trocar-email.html'), {
    email_novo: emailNovo,
    url_confirmacao: urlConfirmacao,
  })
  await send({ to, subject: 'Confirme seu novo e-mail — Meu Atelier Sistema', html })
}

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
  qrCodeBase64?: string
}) {
  // Gerar QR code localmente se não vier do Asaas
  let qrCodeBase64 = options.qrCodeBase64
  if (!qrCodeBase64 && options.pixCopiaCola) {
    try {
      const dataUrl = await QRCode.toDataURL(options.pixCopiaCola, { width: 200, margin: 1 })
      qrCodeBase64 = dataUrl.split(',')[1]
    } catch { /* QR code opcional */ }
  }

  let template = loadTemplate('07-pix-aguardando.html')
  if (!qrCodeBase64) {
    template = template.replace(/\{\{#if qr_code_base64\}\}[\s\S]*?\{\{\/if\}\}/g, '')
  } else {
    template = template.replace('{{#if qr_code_base64}}', '').replace('{{/if}}', '')
  }
  const html = fill(template, {
    valor: options.valor,
    validade: options.validade,
    url_pagamento: options.urlPagamento,
    pix_copia_cola: options.pixCopiaCola,
    qr_code_base64: qrCodeBase64 ?? '',
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
  servicosUso: string
  servicosMax: string
  pctServicos: string
  corServicos: string
}) {
  const html = fill(loadTemplate('09-limite-plano.html'), {
    percentual:    options.percentual,
    clientes_uso:  options.clientesUso,
    clientes_max:  options.clientesMax,
    pct_clientes:  options.pctClientes,
    cor_clientes:  options.corClientes,
    ordens_uso:    options.ordensUso,
    ordens_max:    options.ordensMax,
    pct_ordens:    options.pctOrdens,
    cor_ordens:    options.corOrdens,
    servicos_uso:  options.servicosUso,
    servicos_max:  options.servicosMax,
    pct_servicos:  options.pctServicos,
    cor_servicos:  options.corServicos,
    url_sistema:   process.env.NEXT_PUBLIC_APP_URL ?? 'https://meuateliersistema.com.br',
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

// Campanha de reengajamento — organizações que criaram conta mas nunca
// cadastraram cliente nem ordem de serviço (ver /api/admin/campaigns/reengagement)
// Separada de sendReengajamento para reaproveitar no endpoint de preview
// (/api/admin/campaigns/reengagement/preview), que mostra o HTML sem enviar.
export async function buildReengajamentoHtml(nome: string): Promise<string> {
  // Mesma configuração usada em app/suspenso (whatsapp_support_phone) — texto
  // pré-preenchido específico do contexto de reengajamento
  let whatsappHtml = ''
  try {
    const { db } = await import('@/lib/db')
    const { adminSystemSettings } = await import('@/lib/db/schema')
    const { eq } = await import('drizzle-orm')
    const [row] = await db
      .select({ value: adminSystemSettings.value })
      .from(adminSystemSettings)
      .where(eq(adminSystemSettings.key, 'whatsapp_support_phone'))
      .limit(1)
    if (row?.value) {
      const mensagem = encodeURIComponent('Olá! Criei uma conta no Meu Atelier Sistema e preciso de uma ajuda para começar.')
      const urlWhatsapp = `https://wa.me/${row.value}?text=${mensagem}`
      whatsappHtml = `
            <p style="margin:18px 0 10px;font-family:'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;font-size:13px;line-height:1.6;color:#6E5E4F;">Prefere falar por WhatsApp?</p>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 4px;">
              <tr>
                <td align="center" bgcolor="#25D366" style="border-radius:6px;">
                  <a href="${urlWhatsapp}" style="display:inline-block;padding:13px 30px;font-family:'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#FFFFFF;text-decoration:none;border-radius:6px;">Chamar no WhatsApp</a>
                </td>
              </tr>
            </table>`
    }
  } catch { /* link opcional — não bloqueia o envio */ }

  return fill(loadTemplate('11-reengajamento.html'), {
    nome,
    url_sistema: process.env.NEXT_PUBLIC_APP_URL ?? 'https://meuateliersistema.com.br',
    whatsapp_block: whatsappHtml,
  })
}

export async function sendReengajamento(to: string, nome: string): Promise<{ id: string | null }> {
  const html = await buildReengajamentoHtml(nome)
  return send({ to, subject: 'Sentimos sua falta no Meu Atelier', html })
}

// Mesmo bloco de WhatsApp usado no reengajamento — reaproveitado nas outras
// campanhas de retenção (lib/campaigns/*) pra manter a mesma saída de ajuda
async function buildWhatsappBlock(mensagem: string): Promise<string> {
  try {
    const { db } = await import('@/lib/db')
    const { adminSystemSettings } = await import('@/lib/db/schema')
    const { eq } = await import('drizzle-orm')
    const [row] = await db
      .select({ value: adminSystemSettings.value })
      .from(adminSystemSettings)
      .where(eq(adminSystemSettings.key, 'whatsapp_support_phone'))
      .limit(1)
    if (!row?.value) return ''
    const urlWhatsapp = `https://wa.me/${row.value}?text=${encodeURIComponent(mensagem)}`
    return `
          <p style="margin:18px 0 10px;font-family:'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;font-size:13px;line-height:1.6;color:#6E5E4F;">Prefere falar por WhatsApp?</p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 4px;">
            <tr>
              <td align="center" bgcolor="#25D366" style="border-radius:6px;">
                <a href="${urlWhatsapp}" style="display:inline-block;padding:13px 30px;font-family:'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#FFFFFF;text-decoration:none;border-radius:6px;">Chamar no WhatsApp</a>
              </td>
            </tr>
          </table>`
  } catch {
    return '' // link opcional — não bloqueia o envio
  }
}

// Campanha "uso baixo" — organizações que já usaram de verdade (cliente ou
// OS cadastrado) mas sem atividade recente (ver lib/campaigns/low-usage.ts)
export async function buildUsoBaixoHtml(nome: string): Promise<string> {
  const whatsappHtml = await buildWhatsappBlock('Olá! Uso o Meu Atelier Sistema e preciso de uma ajuda para continuar usando.')
  return fill(loadTemplate('12-uso-baixo.html'), {
    nome,
    url_sistema: process.env.NEXT_PUBLIC_APP_URL ?? 'https://meuateliersistema.com.br',
    whatsapp_block: whatsappHtml,
  })
}

export async function sendUsoBaixo(to: string, nome: string): Promise<{ id: string | null }> {
  const html = await buildUsoBaixoHtml(nome)
  return send({ to, subject: 'Seu ateliê continua esperando por você', html })
}

// Campanha "bônus acabando" — organizações pagantes perto do fim do bônus
// promocional de 60 dias (ver lib/campaigns/bonus-ending.ts)
export async function buildBonusAcabandoHtml(nome: string, dataFim: string): Promise<string> {
  const whatsappHtml = await buildWhatsappBlock('Olá! Tenho uma dúvida sobre minha assinatura no Meu Atelier Sistema.')
  return fill(loadTemplate('13-bonus-acabando.html'), {
    nome,
    data_fim: dataFim,
    url_sistema: process.env.NEXT_PUBLIC_APP_URL ?? 'https://meuateliersistema.com.br',
    whatsapp_block: whatsappHtml,
  })
}

export async function sendBonusAcabando(to: string, nome: string, dataFim: string): Promise<{ id: string | null }> {
  const html = await buildBonusAcabandoHtml(nome, dataFim)
  return send({ to, subject: 'Seu bônus no Meu Atelier Sistema está acabando', html })
}

// Campanha "novidades" — conteúdo preenchido na tela a cada disparo, não
// hardcoded (ver app/admin/campaigns/page.tsx e lib/campaigns/product-news.ts)
export async function buildNovidadesHtml(
  nome: string,
  conteudo: { titulo: string; descricao: string; ctaTexto: string; ctaUrl: string }
): Promise<string> {
  const whatsappHtml = await buildWhatsappBlock('Olá! Vi a novidade do Meu Atelier Sistema e tenho uma dúvida.')
  return fill(loadTemplate('14-novidades.html'), {
    nome,
    titulo: conteudo.titulo,
    descricao: conteudo.descricao,
    cta_texto: conteudo.ctaTexto,
    cta_url: conteudo.ctaUrl,
    whatsapp_block: whatsappHtml,
  })
}

export async function sendNovidades(
  to: string,
  nome: string,
  conteudo: { titulo: string; descricao: string; ctaTexto: string; ctaUrl: string }
): Promise<{ id: string | null }> {
  const html = await buildNovidadesHtml(nome, conteudo)
  return send({ to, subject: `Novidade no Meu Atelier Sistema: ${conteudo.titulo}`, html })
}
