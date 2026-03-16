import sql from 'mssql'

const config = {
  user: process.env.SQLSERVER_USER,
  password: process.env.SQLSERVER_PASSWORD,
  server: process.env.SQLSERVER_SERVER,
  database: process.env.SQLSERVER_DATABASE,
  port: Number(process.env.SQLSERVER_PORT) || 1433,
  options: {
    encrypt: false, // true se usar Azure
    trustServerCertificate: true,
  },
}

let pool: sql.ConnectionPool | null = null

export async function getSqlConnection() {
  if (!pool) {
    pool = await sql.connect(config)
  }
  return pool
}