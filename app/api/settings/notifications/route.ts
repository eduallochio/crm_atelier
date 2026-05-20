import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgNotificationSettings } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'

const DEFAULTS = {
  notifyClientBirthday:      true,
  notifyOrderReady:          true,
  notifyPaymentReminder:     true,
  notifyOrderDelayed:        true,
  notifyLowStock:            false,
  notifyNewClient:           false,
  emailNotificationsEnabled: false,
  notificationEmail:         null as string | null,
  birthdayReminderDays:      7,
  paymentReminderDays:       3,
  orderReminderDays:         1,
}

export async function GET() {
  try {
    const user = await requireAuth()

    const result = await db
      .select()
      .from(orgNotificationSettings)
      .where(eq(orgNotificationSettings.organizationId, user.organizationId))
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
    logServerError('[GET /api/settings/notifications]', error); console.error('[GET /api/settings/notifications]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const values = {
      organizationId:            user.organizationId,
      notifyClientBirthday:      !!body.notify_client_birthday,
      notifyOrderReady:          !!body.notify_order_ready,
      notifyPaymentReminder:     !!body.notify_payment_reminder,
      notifyOrderDelayed:        !!body.notify_order_delayed,
      notifyLowStock:            !!body.notify_low_stock,
      notifyNewClient:           !!body.notify_new_client,
      emailNotificationsEnabled: !!body.email_notifications_enabled,
      notificationEmail:         body.notification_email || null,
      birthdayReminderDays:      body.birthday_reminder_days ?? 7,
      paymentReminderDays:       body.payment_reminder_days  ?? 3,
      orderReminderDays:         body.order_reminder_days    ?? 1,
    }

    await db
      .insert(orgNotificationSettings)
      .values(values)
      .onConflictDoUpdate({
        target: orgNotificationSettings.organizationId,
        set: {
          notifyClientBirthday:      values.notifyClientBirthday,
          notifyOrderReady:          values.notifyOrderReady,
          notifyPaymentReminder:     values.notifyPaymentReminder,
          notifyOrderDelayed:        values.notifyOrderDelayed,
          notifyLowStock:            values.notifyLowStock,
          notifyNewClient:           values.notifyNewClient,
          emailNotificationsEnabled: values.emailNotificationsEnabled,
          notificationEmail:         values.notificationEmail,
          birthdayReminderDays:      values.birthdayReminderDays,
          paymentReminderDays:       values.paymentReminderDays,
          orderReminderDays:         values.orderReminderDays,
          updatedAt:                 new Date(),
        },
      })

    const result = await db
      .select()
      .from(orgNotificationSettings)
      .where(eq(orgNotificationSettings.organizationId, user.organizationId))
      .limit(1)

    return NextResponse.json(result[0])
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[PUT /api/settings/notifications]', error); console.error('[PUT /api/settings/notifications]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
