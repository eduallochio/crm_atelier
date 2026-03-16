import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getPool, sql } from '@/lib/db'

const DEFAULTS = {
  notify_client_birthday: true,
  notify_order_ready: true,
  notify_payment_reminder: true,
  notify_order_delayed: true,
  notify_low_stock: false,
  notify_new_client: false,
  email_notifications_enabled: false,
  notification_email: null as string | null,
  birthday_reminder_days: 7,
  payment_reminder_days: 3,
  order_reminder_days: 1,
  ordem_aviso_ativo: false,
  ordem_aviso_texto: null as string | null,
}

export async function GET() {
  try {
    const user = await requireAuth()
    const pool = await getPool()

    const result = await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(`SELECT * FROM org_notification_settings WHERE organization_id = @orgId`)

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
    console.error('[GET /api/settings/notifications]', error)
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
      .input('notifyClientBirthday', sql.Bit, body.notify_client_birthday ? 1 : 0)
      .input('notifyOrderReady', sql.Bit, body.notify_order_ready ? 1 : 0)
      .input('notifyPaymentReminder', sql.Bit, body.notify_payment_reminder ? 1 : 0)
      .input('notifyOrderDelayed', sql.Bit, body.notify_order_delayed ? 1 : 0)
      .input('notifyLowStock', sql.Bit, body.notify_low_stock ? 1 : 0)
      .input('notifyNewClient', sql.Bit, body.notify_new_client ? 1 : 0)
      .input('emailNotificationsEnabled', sql.Bit, body.email_notifications_enabled ? 1 : 0)
      .input('notificationEmail', sql.NVarChar, body.notification_email || null)
      .input('birthdayReminderDays', sql.Int, body.birthday_reminder_days ?? 7)
      .input('paymentReminderDays', sql.Int, body.payment_reminder_days ?? 3)
      .input('orderReminderDays', sql.Int, body.order_reminder_days ?? 1)
      .input('ordemAvisoAtivo', sql.Bit, body.ordem_aviso_ativo ? 1 : 0)
      .input('ordemAvisoTexto', sql.NVarChar(sql.MAX), body.ordem_aviso_texto || null)
      .query(`
        UPDATE org_notification_settings
        SET
          notify_client_birthday = @notifyClientBirthday,
          notify_order_ready = @notifyOrderReady,
          notify_payment_reminder = @notifyPaymentReminder,
          notify_order_delayed = @notifyOrderDelayed,
          notify_low_stock = @notifyLowStock,
          notify_new_client = @notifyNewClient,
          email_notifications_enabled = @emailNotificationsEnabled,
          notification_email = @notificationEmail,
          birthday_reminder_days = @birthdayReminderDays,
          payment_reminder_days = @paymentReminderDays,
          order_reminder_days = @orderReminderDays,
          ordem_aviso_ativo = @ordemAvisoAtivo,
          ordem_aviso_texto = @ordemAvisoTexto,
          updated_at = GETDATE()
        WHERE organization_id = @orgId

        IF @@ROWCOUNT = 0
          INSERT INTO org_notification_settings (
            organization_id,
            notify_client_birthday, notify_order_ready, notify_payment_reminder,
            notify_order_delayed, notify_low_stock, notify_new_client,
            email_notifications_enabled, notification_email,
            birthday_reminder_days, payment_reminder_days, order_reminder_days,
            ordem_aviso_ativo, ordem_aviso_texto
          )
          VALUES (
            @orgId,
            @notifyClientBirthday, @notifyOrderReady, @notifyPaymentReminder,
            @notifyOrderDelayed, @notifyLowStock, @notifyNewClient,
            @emailNotificationsEnabled, @notificationEmail,
            @birthdayReminderDays, @paymentReminderDays, @orderReminderDays,
            @ordemAvisoAtivo, @ordemAvisoTexto
          )
      `)

    const result = await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(`SELECT * FROM org_notification_settings WHERE organization_id = @orgId`)

    return NextResponse.json(result.recordset[0])
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[PUT /api/settings/notifications]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
