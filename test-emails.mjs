/**
 * Script de teste para envio de emails via Resend.
 * Roda com: node test-emails.mjs (na raiz do projeto)
 * Remover após os testes.
 */
import { readFileSync } from 'fs'
import { join } from 'path'
import { Resend } from 'resend'

// Carrega .env.local
const envContent = readFileSync('.env.local', 'utf-8')
for (const line of envContent.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const idx = trimmed.indexOf('=')
  if (idx === -1) continue
  const key = trimmed.slice(0, idx).trim()
  let value = trimmed.slice(idx + 1).trim()
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1)
  }
  process.env[key] = value
}

const resend = new Resend(process.env.RESEND_API_KEY)

const TO = 'eduallochio2@outlook.com'
const FROM_DEFAULT = 'Meu Atelier Sistema <nao-responda@meuateliersistema.com.br>'
const FROM_FINANCE  = 'Meu Atelier Sistema <financeiro@meuateliersistema.com.br>'
const APP_URL = 'https://meuateliersistema.com.br'

function loadTemplate(name) {
  return readFileSync(join('emails', name), 'utf-8')
}

function fill(template, vars) {
  return Object.entries(vars).reduce(
    (html, [key, value]) => html.replaceAll(`{{${key}}}`, value),
    template
  )
}

async function sendTest(label, options) {
  process.stdout.write(`Enviando ${label}... `)
  const { error } = await resend.emails.send(options)
  if (error) {
    console.log(`ERRO: ${error.message}`)
  } else {
    console.log('OK ✓')
  }
}

await sendTest('01 Confirmar email', {
  from: FROM_DEFAULT, to: TO,
  subject: '[TESTE] Confirme seu e-mail',
  html: fill(loadTemplate('01-confirmar-email.html'), {
    url_confirmacao: `${APP_URL}/auth/confirm?token=TESTE123`,
  }),
})

await sendTest('02 Redefinir senha', {
  from: FROM_DEFAULT, to: TO,
  subject: '[TESTE] Redefinir sua senha',
  html: fill(loadTemplate('02-redefinir-senha.html'), {
    url_redefinicao: `${APP_URL}/auth/reset?token=TESTE123`,
  }),
})

await sendTest('03 Trocar email', {
  from: FROM_DEFAULT, to: TO,
  subject: '[TESTE] Confirme seu novo e-mail',
  html: fill(loadTemplate('03-trocar-email.html'), {
    url_confirmacao: `${APP_URL}/auth/change-email?token=TESTE123`,
    email_novo: TO,
  }),
})

await sendTest('04 Boas-vindas', {
  from: FROM_DEFAULT, to: TO,
  subject: '[TESTE] Bem-vinda ao Meu Atelier Sistema',
  html: fill(loadTemplate('04-boas-vindas.html'), {
    nome: 'Eduardo',
    url_sistema: APP_URL,
  }),
})

await sendTest('05 Convite equipe', {
  from: FROM_DEFAULT, to: TO,
  subject: '[TESTE] Convite para o atelier',
  html: fill(loadTemplate('05-convite-equipe.html'), {
    dona: 'Maria Costureira',
    atelie: 'Atelier da Maria',
    email: TO,
    papel: 'Colaborador',
    url_convite: `${APP_URL}/convite?token=TESTE123`,
  }),
})

await sendTest('06 Pagamento confirmado', {
  from: FROM_FINANCE, to: TO,
  subject: '[TESTE] Pagamento confirmado — seu plano Pro está ativo',
  html: fill(loadTemplate('06-pagamento-confirmado.html'), {
    ciclo: 'Mensal',
    forma: 'Cartão de crédito',
    data: '09/11/2026',
    proxima_renovacao: '09/12/2026',
    valor: 'R$ 49,90',
    url_sistema: APP_URL,
  }),
})

// PIX: gera QR code localmente com biblioteca qrcode
import QRCode from 'qrcode'
const pixPayload = '00020126580014BR.GOV.BCB.PIX0136TESTE-CHAVE-AQUI5204000053039865802BR5913MeuAtelier6009SAOPAULO62070503***6304ABCD'
let qrCodeBase64 = ''
try {
  const dataUrl = await QRCode.toDataURL(pixPayload, { width: 200, margin: 1 })
  // dataUrl = "data:image/png;base64,..." — extrair só o base64
  qrCodeBase64 = dataUrl.split(',')[1]
} catch { /* sem QR code no teste */ }

let templatePix = loadTemplate('07-pix-aguardando.html')
if (!qrCodeBase64) {
  templatePix = templatePix.replace(/\{\{#if qr_code_base64\}\}[\s\S]*?\{\{\/if\}\}/g, '')
} else {
  templatePix = templatePix.replace('{{#if qr_code_base64}}', '').replace('{{/if}}', '')
}
await sendTest('07 PIX aguardando', {
  from: FROM_FINANCE, to: TO,
  subject: '[TESTE] Seu PIX está esperando — Meu Atelier',
  html: fill(templatePix, {
    valor: 'R$ 49,90',
    validade: '10/11/2026 às 23:59',
    url_pagamento: `${APP_URL}/assinatura`,
    pix_copia_cola: pixPayload,
    qr_code_base64: qrCodeBase64,
  }),
})

await sendTest('08 Pagamento atrasado', {
  from: FROM_FINANCE, to: TO,
  subject: '[TESTE] Não conseguimos confirmar seu pagamento',
  html: fill(loadTemplate('08-pagamento-atrasado.html'), {
    ciclo: 'Mensal',
    valor: 'R$ 49,90',
    vencimento: '01/11/2026',
    prazo: '10/11/2026',
    url_pagamento: `${APP_URL}/assinatura`,
  }),
})

await sendTest('09 Limite do plano', {
  from: FROM_DEFAULT, to: TO,
  subject: '[TESTE] Você já usou 80% do plano Free',
  html: fill(loadTemplate('09-limite-plano.html'), {
    percentual:   '80%',
    clientes_uso: '40',
    clientes_max: '50',
    pct_clientes:       '80',
    pct_clientes_label: '80%',
    cor_clientes:       '#f59e0b',
    ordens_uso:         '82',
    ordens_max:         '100',
    pct_ordens:         '82',
    pct_ordens_label:   '82%',
    cor_ordens:         '#f59e0b',
    servicos_uso:       '16',
    servicos_max:       '20',
    pct_servicos:       '80',
    pct_servicos_label: '80%',
    cor_servicos:       '#f59e0b',
    url_sistema:  APP_URL,
  }),
})

await sendTest('10 Assinatura cancelada', {
  from: FROM_DEFAULT, to: TO,
  subject: '[TESTE] Sua assinatura foi cancelada',
  html: fill(loadTemplate('10-assinatura-cancelada.html'), {
    ciclo: 'Mensal',
    fim_acesso: '09/12/2026',
    url_sistema: APP_URL,
  }),
})

console.log('\nPronto! Verifique eduallochio2@outlook.com')
