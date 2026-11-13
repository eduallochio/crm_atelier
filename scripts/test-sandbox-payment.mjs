/**
 * Cria uma assinatura PIX no sandbox do Asaas e confirma o pagamento,
 * disparando o webhook que envia o email via Resend.
 */
import { readFileSync } from 'fs'
import crypto from 'crypto'

const env = readFileSync('.env.local', 'utf-8')
for (const line of env.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const idx = trimmed.indexOf('=')
  if (idx === -1) continue
  const key = trimmed.slice(0, idx).trim()
  let value = trimmed.slice(idx + 1).trim()
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1)
  process.env[key] = value.replace(/\\\$/g, '$')
}

const KEY      = process.env.ASAAS_API_KEY_SANDBOX
const BASE     = process.env.ASAAS_BASE_URL_SANDBOX
const WEBHOOK  = process.env.ASAAS_WEBHOOK_TOKEN
const APP_URL  = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

async function asaas(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { 'access_token': KEY, 'Content-Type': 'application/json', ...options.headers },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`Asaas ${path} → ${JSON.stringify(data.errors)}`)
  return data
}

// 1. Criar customer de teste no sandbox
console.log('1. Criando customer de teste no sandbox...')
const customer = await asaas('/customers', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Eduardo Teste',
    email: 'eduallochio2@outlook.com',
    cpfCnpj: '12345678909',
  }),
})
console.log(`   Customer: ${customer.id}`)

// 2. Criar cobrança PIX avulsa (não assinatura, para confirmar mais fácil)
console.log('2. Criando cobrança PIX...')
const today = new Date().toISOString().split('T')[0]
const payment = await asaas('/payments', {
  method: 'POST',
  body: JSON.stringify({
    customer: customer.id,
    billingType: 'PIX',
    value: 49.90,
    dueDate: today,
    description: 'Teste de email — Plano Pro Mensal',
  }),
})
console.log(`   Payment: ${payment.id} — status: ${payment.status}`)

// 3. Confirmar o pagamento no sandbox
console.log('3. Confirmando pagamento no sandbox...')
const confirmed = await asaas(`/payments/${payment.id}/receiveInCash`, {
  method: 'POST',
  body: JSON.stringify({ paymentDate: today, value: 49.90 }),
})
console.log(`   Status após confirmação: ${confirmed.status}`)

// 4. Enviar email de pagamento confirmado diretamente via Resend
console.log('4. Enviando email de pagamento confirmado...')
console.log(`   Token webhook: ${WEBHOOK?.slice(0, 15)}...`)

const { Resend } = await import('resend')
const { readFileSync: rfs } = await import('fs')
const { join } = await import('path')

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_FINANCE = 'Meu Atelier Sistema <financeiro@meuateliersistema.com.br>'

function loadTemplate(name) {
  return rfs(join('emails', name), 'utf-8')
}
function fill(template, vars) {
  return Object.entries(vars).reduce((html, [k, v]) => html.replaceAll(`{{${k}}}`, v), template)
}

const html = fill(loadTemplate('06-pagamento-confirmado.html'), {
  ciclo: 'Mensal',
  forma: 'PIX',
  data: today,
  proxima_renovacao: new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString('pt-BR'),
  valor: 'R$ 49,90',
  url_sistema: APP_URL,
})

const { error } = await resend.emails.send({
  from: FROM_FINANCE,
  to: 'eduallochio2@outlook.com',
  subject: '[SANDBOX] Pagamento confirmado — seu plano Pro está ativo',
  html,
})
if (error) {
  console.log(`   ERRO: ${error.message}`)
} else {
  console.log('   Email enviado OK ✓')
}

console.log('\nPronto! Verifique eduallochio2@outlook.com')
