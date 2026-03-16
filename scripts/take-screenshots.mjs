/**
 * Script de captura automática de screenshots para o Manual do Sistema
 * ─────────────────────────────────────────────────────────────────────
 * Pré-requisitos:
 *   1. O servidor Next.js deve estar rodando:  npm run dev
 *   2. Instalar o browser do Playwright:       npx playwright install chromium
 *   3. Definir as variáveis no arquivo .env.local:
 *        SCREENSHOT_EMAIL=seu@email.com
 *        SCREENSHOT_PASSWORD=sua_senha
 *
 * Como executar:
 *   node scripts/take-screenshots.mjs
 *
 * As imagens são salvas em:  public/manual/*.png
 */

import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUTPUT_DIR = join(ROOT, 'public', 'manual')

// ── Lê .env.local ────────────────────────────────────────────────────
function loadEnv() {
  try {
    const env = readFileSync(join(ROOT, '.env.local'), 'utf-8')
    const vars = {}
    for (const line of env.split('\n')) {
      const [key, ...rest] = line.split('=')
      if (key && rest.length) vars[key.trim()] = rest.join('=').trim()
    }
    return vars
  } catch {
    return {}
  }
}

const env = loadEnv()
const BASE_URL   = env.NEXTAUTH_URL  || 'http://localhost:3000'
const EMAIL      = env.SCREENSHOT_EMAIL    || process.env.SCREENSHOT_EMAIL    || ''
const PASSWORD   = env.SCREENSHOT_PASSWORD || process.env.SCREENSHOT_PASSWORD || ''

if (!EMAIL || !PASSWORD) {
  console.error('\n❌ Defina SCREENSHOT_EMAIL e SCREENSHOT_PASSWORD no arquivo .env.local\n')
  process.exit(1)
}

mkdirSync(OUTPUT_DIR, { recursive: true })

// ── Páginas a capturar ───────────────────────────────────────────────
const PAGES = [
  // Tela de login (sem autenticação)
  { url: '/login',                    name: 'login',                   auth: false, wait: 500 },

  // Módulos principais
  { url: '/dashboard',                name: 'dashboard',               auth: true,  wait: 2000 },
  { url: '/clientes',                 name: 'clientes',                auth: true,  wait: 1500 },
  { url: '/servicos',                 name: 'servicos',                auth: true,  wait: 1500 },
  { url: '/ordens-servico',           name: 'ordens',                  auth: true,  wait: 1500 },

  // Financeiro
  { url: '/financeiro',               name: 'financeiro',              auth: true,  wait: 1500 },
  { url: '/financeiro',               name: 'financeiro-caixa',        auth: true,  wait: 1500 },
  { url: '/financeiro/pagar',         name: 'financeiro-pagar',        auth: true,  wait: 1500 },
  { url: '/financeiro/receber',       name: 'financeiro-receber',      auth: true,  wait: 1500 },

  // Estoque
  { url: '/estoque',                  name: 'estoque',                 auth: true,  wait: 1500 },
  { url: '/estoque/entradas',         name: 'estoque-entradas',        auth: true,  wait: 1500 },
  { url: '/estoque/relatorios',       name: 'estoque-relatorios',      auth: true,  wait: 1500 },
  { url: '/fornecedores',             name: 'fornecedores',            auth: true,  wait: 1500 },

  // Configurações
  { url: '/configuracoes',            name: 'configuracoes',           auth: true,  wait: 1500 },
]

// ── Capturas de diálogos / formulários ──────────────────────────────
// Após tirar as screenshots das páginas, o script tenta abrir formulários
const DIALOGS = [
  {
    url: '/clientes',
    name: 'clientes-form',
    trigger: 'button:has-text("Novo Cliente")',
    wait: 800,
  },
  {
    url: '/servicos',
    name: 'servicos-form',
    trigger: 'button:has-text("Novo Serviço")',
    wait: 800,
  },
  {
    url: '/ordens-servico',
    name: 'ordens-form',
    trigger: 'button:has-text("Nova OS"), button:has-text("Nova Ordem")',
    wait: 1200,
  },
  {
    url: '/ordens-servico',
    name: 'ordens-materiais',
    trigger: 'button:has-text("Nova OS"), button:has-text("Nova Ordem")',
    wait: 1200,
  },
  {
    url: '/configuracoes',
    name: 'configuracoes-notificacoes',
    trigger: 'button:has-text("Notificações"), [role="tab"]:has-text("Notificações")',
    wait: 800,
  },
]

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function main() {
  console.log('\n🚀 Iniciando captura de screenshots...')
  console.log(`   App: ${BASE_URL}`)
  console.log(`   Saída: public/manual/\n`)

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5, // screenshots nítidas (equivalente a Retina 1.5x)
  })

  const page = await context.newPage()

  // ── 1. Login ───────────────────────────────────────────────────────
  console.log('🔐 Fazendo login...')
  await page.goto(`${BASE_URL}/login`)
  await sleep(1000)

  // Captura a tela de login
  await page.screenshot({ path: join(OUTPUT_DIR, 'login.png'), fullPage: false })
  console.log('   ✓ login.png')

  await page.fill('#email', EMAIL)
  await page.fill('#password', PASSWORD)
  await page.click('button[type="submit"]')

  try {
    await page.waitForURL('**/dashboard', { timeout: 10000 })
    console.log('   ✓ Login realizado com sucesso\n')
  } catch {
    console.error('   ✗ Falha no login. Verifique as credenciais em .env.local')
    await browser.close()
    process.exit(1)
  }

  // ── 2. Screenshots das páginas ─────────────────────────────────────
  for (const p of PAGES.filter(p => p.auth)) {
    process.stdout.write(`📸 Capturando ${p.name}...`)
    await page.goto(`${BASE_URL}${p.url}`)
    await sleep(p.wait)
    // Aguarda a rede estabilizar (sem requests em andamento)
    await page.waitForLoadState('networkidle').catch(() => {})
    await page.screenshot({ path: join(OUTPUT_DIR, `${p.name}.png`), fullPage: false })
    console.log(` ✓`)
  }

  // ── 3. Screenshots de formulários/diálogos ─────────────────────────
  console.log('\n📋 Capturando formulários...')
  for (const d of DIALOGS) {
    process.stdout.write(`   Abrindo ${d.name}...`)
    try {
      await page.goto(`${BASE_URL}${d.url}`)
      await sleep(1200)
      await page.waitForLoadState('networkidle').catch(() => {})
      const btn = page.locator(d.trigger).first()
      if (await btn.isVisible({ timeout: 3000 })) {
        await btn.click()
        await sleep(d.wait)
        await page.screenshot({ path: join(OUTPUT_DIR, `${d.name}.png`), fullPage: false })
        console.log(` ✓`)
      } else {
        console.log(` ⚠ botão não encontrado — pulando`)
      }
    } catch {
      console.log(` ⚠ erro ao capturar — pulando`)
    }
  }

  await browser.close()

  console.log('\n✅ Capturas concluídas!')
  console.log(`   ${PAGES.length + DIALOGS.length} screenshots salvas em public/manual/`)
  console.log('\n   Recarregue a página do Manual para ver as imagens.\n')
}

main().catch(err => {
  console.error('\n❌ Erro:', err.message)
  process.exit(1)
})
