import sql from 'mssql'

// Suporte a Windows Authentication (SQLSERVER_TRUSTED_CONNECTION=true)
// ou SQL Server Authentication (SQLSERVER_USER + SQLSERVER_PASSWORD)
const useTrustedConnection = process.env.SQLSERVER_TRUSTED_CONNECTION === 'true'

const config: sql.config = {
  server: process.env.SQLSERVER_SERVER!,
  database: process.env.SQLSERVER_DATABASE || 'CrmAtelier',
  port: Number(process.env.SQLSERVER_PORT) || 1433,
  options: {
    encrypt: process.env.SQLSERVER_ENCRYPT === 'true',
    trustServerCertificate: true,
    // Windows Authentication — não precisa de usuário/senha
    ...(useTrustedConnection && { trustedConnection: true }),
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  // Credenciais SQL Server Auth (ignoradas se trustedConnection=true)
  ...(!useTrustedConnection && {
    user: process.env.SQLSERVER_USER,
    password: process.env.SQLSERVER_PASSWORD,
  }),
}

let pool: sql.ConnectionPool | null = null

export async function getPool(): Promise<sql.ConnectionPool> {
  // Se o pool existe mas não está conectado, descarta e recria
  if (pool && !pool.connected) {
    try { await pool.close() } catch { /* ignora */ }
    pool = null
  }

  if (!pool) {
    pool = await new sql.ConnectionPool(config).connect()
  }

  return pool
}

/** Fecha o pool (útil em testes ou hot-reload de dev) */
export async function closePool() {
  if (pool) {
    await pool.close()
    pool = null
  }
}

export { sql }
