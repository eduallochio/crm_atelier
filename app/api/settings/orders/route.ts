import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgOrderSettings } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'

const DEFAULTS = {
  orderPrefix:          'OS',
  orderStartNumber:     1,
  orderNumberFormat:    'sequential' as const,
  defaultStatus:        'pendente',
  requireClient:        true,
  requireService:       true,
  requireDeliveryDate:  true,
  requirePaymentMethod: false,
  defaultDeliveryDays:  7,
}

export async function GET() {
  try {
    const user = await requireAuth()

    const result = await db
      .select()
      .from(orgOrderSettings)
      .where(eq(orgOrderSettings.organizationId, user.organizationId))
      .limit(1)

    if (result.length === 0) {
      return NextResponse.json({
        id: '',
        organization_id: user.organizationId,
        ...DEFAULTS,
        updated_at: new Date().toISOString(),
      })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[GET /api/settings/orders]', error); console.error('[GET /api/settings/orders]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const values = {
      organizationId:       user.organizationId,
      orderPrefix:          body.order_prefix          ?? 'OS',
      orderStartNumber:     body.order_start_number    ?? 1,
      orderNumberFormat:    body.order_number_format   ?? 'sequential',
      defaultStatus:        body.default_status        ?? 'pendente',
      requireClient:        body.require_client        !== false,
      requireService:       body.require_service       !== false,
      requireDeliveryDate:  body.require_delivery_date !== false,
      requirePaymentMethod: !!body.require_payment_method,
      defaultDeliveryDays:  body.default_delivery_days ?? 7,
    }

    await db
      .insert(orgOrderSettings)
      .values(values)
      .onConflictDoUpdate({
        target: orgOrderSettings.organizationId,
        set: {
          orderPrefix:          values.orderPrefix,
          orderStartNumber:     values.orderStartNumber,
          orderNumberFormat:    values.orderNumberFormat,
          defaultStatus:        values.defaultStatus,
          requireClient:        values.requireClient,
          requireService:       values.requireService,
          requireDeliveryDate:  values.requireDeliveryDate,
          requirePaymentMethod: values.requirePaymentMethod,
          defaultDeliveryDays:  values.defaultDeliveryDays,
          updatedAt:            new Date(),
        },
      })

    const result = await db
      .select()
      .from(orgOrderSettings)
      .where(eq(orgOrderSettings.organizationId, user.organizationId))
      .limit(1)

    return NextResponse.json(result[0])
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[PUT /api/settings/orders]', error); console.error('[PUT /api/settings/orders]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
