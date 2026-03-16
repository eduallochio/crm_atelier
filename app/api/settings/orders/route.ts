import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getPool, sql } from '@/lib/db'

const DEFAULTS = {
  order_prefix: 'OS',
  order_start_number: 1,
  order_number_format: 'sequential' as const,
  default_status: 'pendente',
  require_client: true,
  require_service: true,
  require_delivery_date: true,
  require_payment_method: false,
  default_delivery_days: 7,
}

export async function GET() {
  try {
    const user = await requireAuth()
    const pool = await getPool()

    const result = await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(`SELECT * FROM org_order_settings WHERE organization_id = @orgId`)

    if (result.recordset.length === 0) {
      return NextResponse.json({
        id: '',
        organization_id: user.organizationId,
        ...DEFAULTS,
        updated_at: new Date().toISOString(),
      })
    }

    return NextResponse.json(result.recordset[0])
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[GET /api/settings/orders]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const pool = await getPool()

    await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .input('orderPrefix', sql.NVarChar, body.order_prefix ?? 'OS')
      .input('orderStartNumber', sql.Int, body.order_start_number ?? 1)
      .input('orderNumberFormat', sql.NVarChar, body.order_number_format ?? 'sequential')
      .input('defaultStatus', sql.NVarChar, body.default_status ?? 'pendente')
      .input('requireClient', sql.Bit, body.require_client !== false ? 1 : 0)
      .input('requireService', sql.Bit, body.require_service !== false ? 1 : 0)
      .input('requireDeliveryDate', sql.Bit, body.require_delivery_date !== false ? 1 : 0)
      .input('requirePaymentMethod', sql.Bit, body.require_payment_method ? 1 : 0)
      .input('defaultDeliveryDays', sql.Int, body.default_delivery_days ?? 7)
      .query(`
        UPDATE org_order_settings
        SET
          order_prefix = @orderPrefix,
          order_start_number = @orderStartNumber,
          order_number_format = @orderNumberFormat,
          default_status = @defaultStatus,
          require_client = @requireClient,
          require_service = @requireService,
          require_delivery_date = @requireDeliveryDate,
          require_payment_method = @requirePaymentMethod,
          default_delivery_days = @defaultDeliveryDays,
          updated_at = GETDATE()
        WHERE organization_id = @orgId

        IF @@ROWCOUNT = 0
          INSERT INTO org_order_settings (
            organization_id, order_prefix, order_start_number, order_number_format,
            default_status, require_client, require_service, require_delivery_date,
            require_payment_method, default_delivery_days
          )
          VALUES (
            @orgId, @orderPrefix, @orderStartNumber, @orderNumberFormat,
            @defaultStatus, @requireClient, @requireService, @requireDeliveryDate,
            @requirePaymentMethod, @defaultDeliveryDays
          )
      `)

    const result = await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(`SELECT * FROM org_order_settings WHERE organization_id = @orgId`)

    return NextResponse.json(result.recordset[0])
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[PUT /api/settings/orders]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
