import { NextRequest, NextResponse } from 'next/server'
import { requireMaster } from '@/lib/auth/session'
import { getPool, sql } from '@/lib/db'
import { logAdminAction } from '@/lib/admin-log'

const DEFAULTS: Record<string, string> = {
  site_name:            'Meu Atelier',
  support_email:        'suporte@meuatelier.com',
  max_users_free:       '3',
  max_clients_free:     '50',
  max_services_free:    '20',
  max_orders_free:      '100',
  enable_signup:        'true',
  enable_trial:         'true',
  trial_duration_days:  '14',
  maintenance_mode:     'false',
  announcement:         '',
}

export async function GET() {
  try {
    await requireMaster()
    const pool = await getPool()

    const result = await pool.request().query(
      `SELECT [key], value FROM admin_system_settings`
    )

    const map: Record<string, string> = { ...DEFAULTS }
    for (const row of result.recordset) {
      map[row.key as string] = row.value as string
    }

    return NextResponse.json({
      site_name:           map.site_name,
      support_email:       map.support_email,
      max_users_free:      parseInt(map.max_users_free)    || 3,
      max_clients_free:    parseInt(map.max_clients_free)  || 50,
      max_services_free:   parseInt(map.max_services_free) || 20,
      max_orders_free:     parseInt(map.max_orders_free)   || 100,
      enable_signup:       map.enable_signup === 'true',
      enable_trial:        map.enable_trial === 'true',
      trial_duration_days: parseInt(map.trial_duration_days) || 14,
      maintenance_mode:    map.maintenance_mode === 'true',
      announcement:        map.announcement ?? '',
    })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    if ((error as Error).message?.includes('Invalid object name')) {
      return NextResponse.json({
        site_name: DEFAULTS.site_name,
        support_email: DEFAULTS.support_email,
        max_users_free: 3,
        max_clients_free: 50,
        max_services_free: 20,
        max_orders_free: 100,
        enable_signup: true,
        enable_trial: true,
        trial_duration_days: 14,
        maintenance_mode: false,
        announcement: '',
      })
    }
    console.error('[GET /api/admin/system-settings]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireMaster()
    const body = await request.json()
    const pool = await getPool()

    const entries: [string, string][] = [
      ['site_name',           String(body.site_name ?? DEFAULTS.site_name)],
      ['support_email',       String(body.support_email ?? DEFAULTS.support_email)],
      ['max_users_free',      String(parseInt(body.max_users_free)    || 3)],
      ['max_clients_free',    String(parseInt(body.max_clients_free)  || 50)],
      ['max_services_free',   String(parseInt(body.max_services_free) || 20)],
      ['max_orders_free',     String(parseInt(body.max_orders_free)   || 100)],
      ['enable_signup',       body.enable_signup ? 'true' : 'false'],
      ['enable_trial',        body.enable_trial ? 'true' : 'false'],
      ['trial_duration_days', String(parseInt(body.trial_duration_days) || 14)],
      ['maintenance_mode',    body.maintenance_mode ? 'true' : 'false'],
      ['announcement',        String(body.announcement ?? '')],
    ]

    for (const [key, value] of entries) {
      await pool.request()
        .input('key',   sql.NVarChar, key)
        .input('value', sql.NVarChar, value)
        .input('email', sql.NVarChar, admin.email ?? null)
        .query(`
          UPDATE admin_system_settings
            SET value = @value, updated_at = GETDATE(), updated_by = @email
          WHERE [key] = @key
          IF @@ROWCOUNT = 0
            INSERT INTO admin_system_settings ([key], value, updated_by)
            VALUES (@key, @value, @email)
        `)
    }

    await logAdminAction({
      action: 'UPDATE',
      resourceType: 'system_settings',
      description: 'Configurações do sistema atualizadas',
      adminEmail: admin.email,
      details: Object.fromEntries(entries),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    console.error('[PUT /api/admin/system-settings]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
