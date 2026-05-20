import { NextRequest, NextResponse } from 'next/server'
import { requireMaster } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { adminSystemSettings } from '@/lib/db/schema'
import { eq, inArray } from 'drizzle-orm'
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

    const rows = await db
      .select({ key: adminSystemSettings.key, value: adminSystemSettings.value })
      .from(adminSystemSettings)

    const map: Record<string, string> = { ...DEFAULTS }
    for (const row of rows) {
      map[row.key] = row.value
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
    console.error('[GET /api/admin/system-settings]', error)
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
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireMaster()
    const body = await request.json()

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

    // Upsert each setting
    for (const [key, value] of entries) {
      await db
        .insert(adminSystemSettings)
        .values({ key, value, updatedBy: admin.email ?? null })
        .onConflictDoUpdate({
          target: adminSystemSettings.key,
          set: { value, updatedAt: new Date(), updatedBy: admin.email ?? null },
        })
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
