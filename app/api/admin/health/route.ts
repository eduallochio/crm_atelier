import { NextResponse } from 'next/server'
import { requireMaster } from '@/lib/auth/session'
import { getPool } from '@/lib/db'

export async function GET() {
  try {
    await requireMaster()
    const pool = await getPool()
    const start = Date.now()

    const pingResult = await pool.request().query('SELECT GETDATE() AS now, @@VERSION AS version')
    const dbMs = Date.now() - start
    const dbVersion = (pingResult.recordset[0]?.version as string ?? '').split('\n')[0].trim()

    const statsResult = await pool.request().query(`
      SELECT
        (SELECT COUNT(*) FROM organizations) AS total_orgs,
        (SELECT COUNT(*) FROM users) AS total_users,
        (SELECT COUNT(*) FROM organizations WHERE state = 'active') AS active_orgs,
        (SELECT COUNT(*) FROM organizations WHERE created_at >= DATEADD(day, -1, GETDATE())) AS new_today
    `)
    const stats = statsResult.recordset[0]

    const recentLogsResult = await pool.request().query(`
      SELECT TOP 10 action, description, admin_email, created_at
      FROM admin_logs
      ORDER BY created_at DESC
    `)

    const tablesResult = await pool.request().query(`
      SELECT t.name AS table_name, p.rows AS row_count
      FROM sys.tables t
      JOIN sys.partitions p ON p.object_id = t.object_id AND p.index_id IN (0,1)
      WHERE t.name IN (
        'organizations','users','org_clients','org_service_orders',
        'org_transactions','admin_logs','plans','admin_system_settings'
      )
      ORDER BY p.rows DESC
    `)

    // Tamanho dos arquivos do banco
    const storageResult = await pool.request().query(`
      SELECT
        name,
        type_desc,
        CAST(size * 8.0 / 1024 AS DECIMAL(10,2)) AS size_mb,
        CAST(FILEPROPERTY(name, 'SpaceUsed') * 8.0 / 1024 AS DECIMAL(10,2)) AS used_mb
      FROM sys.database_files
    `)

    // Top tabelas por tamanho em disco
    const tableSizesResult = await pool.request().query(`
      SELECT TOP 12
        t.name AS table_name,
        CAST(SUM(a.total_pages) * 8.0 / 1024 AS DECIMAL(10,3)) AS total_mb,
        CAST(SUM(a.used_pages) * 8.0 / 1024 AS DECIMAL(10,3)) AS used_mb,
        SUM(p.rows) AS row_count
      FROM sys.tables t
      JOIN sys.indexes i ON t.object_id = i.object_id
      JOIN sys.partitions p ON i.object_id = p.object_id AND i.index_id = p.index_id
      JOIN sys.allocation_units a ON p.partition_id = a.container_id
      WHERE t.name NOT LIKE 'sys%'
      GROUP BY t.name
      ORDER BY SUM(a.total_pages) DESC
    `)

    const totalMb = storageResult.recordset
      .filter((r) => r.type_desc === 'ROWS')
      .reduce((sum: number, r) => sum + parseFloat(r.size_mb), 0)
    const usedMb = storageResult.recordset
      .filter((r) => r.type_desc === 'ROWS')
      .reduce((sum: number, r) => sum + parseFloat(r.used_mb || 0), 0)

    return NextResponse.json({
      status: 'ok',
      db: { status: 'connected', response_ms: dbMs, version: dbVersion },
      stats: {
        total_orgs:  Number(stats.total_orgs),
        total_users: Number(stats.total_users),
        active_orgs: Number(stats.active_orgs),
        new_today:   Number(stats.new_today),
      },
      storage: {
        total_mb: Math.round(totalMb * 100) / 100,
        used_mb:  Math.round(usedMb  * 100) / 100,
        files: storageResult.recordset.map((r) => ({
          name:    r.name as string,
          type:    r.type_desc as string,
          size_mb: parseFloat(r.size_mb),
          used_mb: parseFloat(r.used_mb || 0),
        })),
        top_tables: tableSizesResult.recordset.map((r) => ({
          name:     r.table_name as string,
          total_mb: parseFloat(r.total_mb),
          used_mb:  parseFloat(r.used_mb),
          rows:     Number(r.row_count),
        })),
      },
      tables: tablesResult.recordset.map((r) => ({
        name: r.table_name as string,
        rows: Number(r.row_count),
      })),
      recent_logs: recentLogsResult.recordset,
      checked_at: new Date().toISOString(),
    })
  } catch (error) {
    const msg = (error as Error).message
    if (msg === 'UNAUTHORIZED' || msg === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    console.error('[GET /api/admin/health]', error)
    return NextResponse.json({ status: 'error', error: msg, checked_at: new Date().toISOString() }, { status: 500 })
  }
}
