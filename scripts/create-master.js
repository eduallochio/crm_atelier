/**
 * Script de seed para criar o usuário master em produção.
 *
 * USO:
 *   node scripts/create-master.js
 *
 * VARIÁVEIS DE AMBIENTE NECESSÁRIAS (no .env.local ou no ambiente do servidor):
 *   SQLSERVER_SERVER, SQLSERVER_DATABASE, SQLSERVER_USER, SQLSERVER_PASSWORD
 *   MASTER_EMAIL    → email do usuário master (default: master@crmatelier.com)
 *   MASTER_PASSWORD → senha do usuário master (obrigatória)
 *
 * EXEMPLO:
 *   MASTER_EMAIL=admin@minhaempresa.com MASTER_PASSWORD=MinhaSenh@Forte node scripts/create-master.js
 *
 * SEGURANÇA:
 *   - Nunca commite esse script com senhas hardcoded.
 *   - Use variáveis de ambiente ou um .env que está no .gitignore.
 *   - Em CI/CD, defina MASTER_PASSWORD como secret do pipeline.
 */

const path = require('path')

// Carrega .env.local automaticamente se existir
try {
  require('fs').readFileSync(path.join(__dirname, '../.env.local'), 'utf8')
    .split(/\r?\n/)
    .forEach(line => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) return
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) return
      const key = trimmed.slice(0, eqIdx).trim()
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
      if (key && process.env[key] === undefined) process.env[key] = val
    })
  console.log('✓ .env.local carregado')
} catch {
  console.log('ℹ .env.local não encontrado — usando variáveis do ambiente')
}

const sql = require('mssql')
const bcrypt = require('bcryptjs')

const SYSTEM_ORG_ID = '00000000-0000-0000-0000-000000000001'

async function main() {
  const masterEmail    = process.env.MASTER_EMAIL    || 'master@crmatelier.com'
  const masterPassword = process.env.MASTER_PASSWORD
  const masterName     = process.env.MASTER_NAME     || 'Administrador Master'

  if (!masterPassword) {
    console.error('❌ MASTER_PASSWORD não definida. Defina a variável de ambiente e tente novamente.')
    console.error('   Exemplo: MASTER_PASSWORD=MinhaSenh@Forte node scripts/create-master.js')
    process.exit(1)
  }

  const config = {
    user:     process.env.SQLSERVER_USER,
    password: process.env.SQLSERVER_PASSWORD,
    server:   process.env.SQLSERVER_SERVER,
    database: process.env.SQLSERVER_DATABASE || 'CrmAtelier',
    port:     Number(process.env.SQLSERVER_PORT) || 1433,
    options: {
      encrypt:                process.env.SQLSERVER_ENCRYPT === 'true',
      trustServerCertificate: true,
    },
  }

  console.log(`\n📦 Conectando ao SQL Server (${config.server}/${config.database})...`)
  const pool = await sql.connect(config)
  console.log('✓ Conectado\n')

  // 1. Adiciona coluna is_master se não existir
  console.log('1. Verificando coluna is_master...')
  await pool.request().query(`
    IF NOT EXISTS (
      SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'is_master'
    )
    BEGIN
      ALTER TABLE users ADD is_master BIT NOT NULL DEFAULT 0;
      PRINT 'Coluna is_master adicionada.';
    END
  `)
  console.log('   ✓ OK')

  // 2. Garante organização sistema
  console.log('2. Verificando organização master...')
  await pool.request()
    .input('orgId', sql.UniqueIdentifier, SYSTEM_ORG_ID)
    .query(`
      IF NOT EXISTS (SELECT 1 FROM organizations WHERE id = @orgId)
      BEGIN
        INSERT INTO organizations (id, name, slug, [plan], subscription_status)
        VALUES (@orgId, 'Sistema Master', 'system-master', 'enterprise', 'active');
      END
    `)
  console.log('   ✓ OK')

  // 3. Verifica se usuário já existe
  console.log(`3. Verificando usuário ${masterEmail}...`)
  const existing = await pool.request()
    .input('email', sql.NVarChar, masterEmail)
    .query(`SELECT id, is_master FROM users WHERE email = @email`)

  const passwordHash = await bcrypt.hash(masterPassword, 12)

  if (existing.recordset.length > 0) {
    // Promove e atualiza senha
    await pool.request()
      .input('email', sql.NVarChar, masterEmail)
      .input('passwordHash', sql.NVarChar, passwordHash)
      .query(`
        UPDATE users
        SET is_master = 1, [role] = 'owner', is_owner = 1, password_hash = @passwordHash
        WHERE email = @email
      `)
    const wasAlreadyMaster = existing.recordset[0].is_master === true || existing.recordset[0].is_master === 1
    console.log(wasAlreadyMaster
      ? '   ✓ Usuário master já existe — senha atualizada'
      : '   ✓ Usuário promovido a master e senha atualizada'
    )
  } else {
    // Cria novo usuário master
    await pool.request()
      .input('orgId', sql.UniqueIdentifier, SYSTEM_ORG_ID)
      .input('email', sql.NVarChar, masterEmail)
      .input('passwordHash', sql.NVarChar, passwordHash)
      .input('fullName', sql.NVarChar, masterName)
      .query(`
        INSERT INTO users (id, organization_id, email, password_hash, full_name, [role], is_owner, is_master)
        VALUES (NEWID(), @orgId, @email, @passwordHash, @fullName, 'owner', 1, 1)
      `)
    console.log(`   ✓ Usuário master criado: ${masterEmail}`)
  }

  await pool.close()

  console.log('\n🎉 Setup concluído!')
  console.log(`   Email:  ${masterEmail}`)
  console.log(`   Acesso: /admin\n`)
}

main().catch(err => {
  console.error('\n❌ Erro:', err.message)
  process.exit(1)
})
