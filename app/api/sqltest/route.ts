import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

export async function GET() {
  try {
    const pool = await getPool()
    const result = await pool.request().query(`
      SELECT
        DB_NAME() AS database_name,
        @@VERSION AS version,
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE') AS table_count
    `)
    const row = result.recordset[0]
    return NextResponse.json({
      ok: true,
      database: row.database_name,
      tables: row.table_count,
      version: row.version.split('\n')[0],
    })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}