import { NextResponse } from 'next/server'
import { requireMaster } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { organizations, profiles, adminLogs } from '@/lib/db/schema'
import { desc, count, sql as drizzleSql } from 'drizzle-orm'
import { createClient as createServiceClient } from '@supabase/supabase-js'

// Limites do plano Free do Supabase
const SUPABASE_FREE_LIMITS = {
  db_mb:      500,    // 500 MB banco
  storage_mb: 1024,   // 1 GB storage
  mau:        50_000, // 50k usuários ativos/mês
  egress_gb:  5,      // 5 GB egress
}

function getAdminSupabase() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  try {
    await requireMaster()

    const start = Date.now()
    await db.select({ now: drizzleSql`NOW()` }).from(organizations).limit(1)
    const dbMs = Date.now() - start

    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)

    // ── Estatísticas gerais ───────────────────────────────────────────────────
    const [statsResult, totalUsersResult, recentLogs] = await Promise.all([
      db.select({
        totalOrgs:  count(),
        activeOrgs: drizzleSql<number>`COUNT(*) FILTER (WHERE subscription_status = 'active')::int`,
        newToday:   drizzleSql<number>`COUNT(*) FILTER (WHERE created_at >= ${oneDayAgo.toISOString()})::int`,
      }).from(organizations),
      db.select({ count: count() }).from(profiles),
      db.select({
          action:      adminLogs.action,
          description: adminLogs.description,
          adminEmail:  adminLogs.adminEmail,
          createdAt:   adminLogs.createdAt,
        })
        .from(adminLogs)
        .orderBy(desc(adminLogs.createdAt))
        .limit(10),
    ])

    // ── Tamanho real das tabelas via pg_catalog ───────────────────────────────
    const tableSizeResult = await db.execute(drizzleSql`
      SELECT
        c.relname                                        AS name,
        pg_total_relation_size(c.oid)                   AS total_bytes,
        pg_relation_size(c.oid)                         AS table_bytes,
        pg_indexes_size(c.oid)                          AS index_bytes,
        COALESCE(s.n_live_tup, 0)                       AS rows
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      LEFT JOIN pg_stat_user_tables s ON s.relid = c.oid
      WHERE n.nspname = 'public'
        AND c.relkind = 'r'
        AND c.relname NOT LIKE 'pg_%'
      ORDER BY total_bytes DESC
      LIMIT 20
    `)

    const tableStats = (tableSizeResult as any[]).map((r: any) => ({
      name:       r.name,
      total_mb:   Number(r.total_bytes) / 1024 / 1024,
      table_mb:   Number(r.table_bytes) / 1024 / 1024,
      index_mb:   Number(r.index_bytes) / 1024 / 1024,
      rows:       Number(r.rows ?? 0),
    }))

    // ── Tamanho total do banco ────────────────────────────────────────────────
    const dbSizeResult = await db.execute(drizzleSql`
      SELECT pg_database_size(current_database()) AS size_bytes
    `)
    const dbSizeBytes  = Number((dbSizeResult as any[])[0]?.size_bytes ?? 0)
    const dbSizeMb     = dbSizeBytes / 1024 / 1024
    const dbUsedPct    = (dbSizeMb / SUPABASE_FREE_LIMITS.db_mb) * 100

    // ── Storage do Supabase (via Admin API) ───────────────────────────────────
    let storageTotalMb  = 0
    let storageFileCount = 0
    const storageBuckets: { name: string; size_mb: number; files: number }[] = []

    try {
      const supabase = getAdminSupabase()
      const { data: buckets } = await supabase.storage.listBuckets()

      if (buckets) {
        for (const bucket of buckets) {
          const { data: files } = await supabase.storage.from(bucket.name).list('', {
            limit: 1000,
            offset: 0,
          })
          let bucketSize = 0
          if (files) {
            for (const file of files) {
              bucketSize += (file as any).metadata?.size ?? 0
            }
          }
          const bucketMb = bucketSize / 1024 / 1024
          storageTotalMb += bucketMb
          storageFileCount += files?.length ?? 0
          storageBuckets.push({
            name:    bucket.name,
            size_mb: bucketMb,
            files:   files?.length ?? 0,
          })
        }
      }
    } catch {
      // Storage API indisponível — retorna zeros
    }

    const storageUsedPct = (storageTotalMb / SUPABASE_FREE_LIMITS.storage_mb) * 100

    const stats = statsResult[0]

    // ── Alertas automáticos ───────────────────────────────────────────────────
    const alerts: { level: 'warning' | 'critical'; message: string }[] = []

    if (dbUsedPct > 80)      alerts.push({ level: 'critical', message: `Banco em ${dbUsedPct.toFixed(1)}% do limite Free (${SUPABASE_FREE_LIMITS.db_mb} MB)` })
    else if (dbUsedPct > 60) alerts.push({ level: 'warning',  message: `Banco em ${dbUsedPct.toFixed(1)}% do limite Free` })

    if (storageUsedPct > 80)      alerts.push({ level: 'critical', message: `Storage em ${storageUsedPct.toFixed(1)}% do limite Free (1 GB)` })
    else if (storageUsedPct > 60) alerts.push({ level: 'warning',  message: `Storage em ${storageUsedPct.toFixed(1)}% do limite Free` })

    if (dbMs > 500) alerts.push({ level: 'warning', message: `Latência do banco elevada: ${dbMs}ms` })

    return NextResponse.json({
      status: alerts.some(a => a.level === 'critical') ? 'warning' : 'ok',
      alerts,
      db: {
        status:      'connected',
        response_ms: dbMs,
        version:     'PostgreSQL (Supabase)',
        size_mb:     Math.round(dbSizeMb * 100) / 100,
        size_pct:    Math.round(dbUsedPct * 10) / 10,
        limit_mb:    SUPABASE_FREE_LIMITS.db_mb,
      },
      storage: {
        used_mb:     Math.round(storageTotalMb * 100) / 100,
        used_pct:    Math.round(storageUsedPct * 10) / 10,
        limit_mb:    SUPABASE_FREE_LIMITS.storage_mb,
        file_count:  storageFileCount,
        buckets:     storageBuckets,
        top_tables:  tableStats,
        // compat com UI antiga
        total_mb:    SUPABASE_FREE_LIMITS.db_mb,
        files:       [],
      },
      supabase_limits: SUPABASE_FREE_LIMITS,
      stats: {
        total_orgs:  Number(stats.totalOrgs),
        total_users: Number(totalUsersResult[0]?.count ?? 0),
        active_orgs: Number(stats.activeOrgs),
        new_today:   Number(stats.newToday),
      },
      tables:      tableStats,
      recent_logs: recentLogs,
      checked_at:  new Date().toISOString(),
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
