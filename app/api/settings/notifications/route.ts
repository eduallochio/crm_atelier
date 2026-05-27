import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgNotificationSettings } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'

const DEFAULTS = {
  notify_client_birthday:      true,
  notify_order_ready:          true,
  notify_payment_reminder:     true,
  notify_order_delayed:        true,
  notify_low_stock:            false,
  notify_new_client:           false,
  email_notifications_enabled: false,
  notification_email:          null as string | null,
  birthday_reminder_days:      7,
  payment_reminder_days:       3,
  order_reminder_days:         1,
  ordem_aviso_ativo:           false,
  ordem_aviso_texto:           null as string | null,
}

function mapRow(row: {
  id: string
  organizationId: string
  notifyClientBirthday: boolean
  notifyOrderReady: boolean
  notifyPaymentReminder: boolean
  notifyOrderDelayed: boolean
  notifyLowStock: boolean
  notifyNewClient: boolean
  emailNotificationsEnabled: boolean
  notificationEmail: string | null
  birthdayReminderDays: number
  paymentReminderDays: number
  orderReminderDays: number
  ordemAvisoAtivo: boolean
  ordemAvisoTexto: string | null
  updatedAt: Date | null
}) {
  return {
    id:                          row.id,
    organization_id:             row.organizationId,
    notify_client_birthday:      row.notifyClientBirthday,
    notify_order_ready:          row.notifyOrderReady,
    notify_payment_reminder:     row.notifyPaymentReminder,
    notify_order_delayed:        row.notifyOrderDelayed,
    notify_low_stock:            row.notifyLowStock,
    notify_new_client:           row.notifyNewClient,
    email_notifications_enabled: row.emailNotificationsEnabled,
    notification_email:          row.notificationEmail,
    birthday_reminder_days:      row.birthdayReminderDays,
    payment_reminder_days:       row.paymentReminderDays,
    order_reminder_days:         row.orderReminderDays,
    ordem_aviso_ativo:           row.ordemAvisoAtivo,
    ordem_aviso_texto:           row.ordemAvisoTexto,
    updated_at:                  row.updatedAt,
  }
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

    return NextResponse.json(mapRow(result[0]))
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
      ordemAvisoAtivo:           !!body.ordem_aviso_ativo,
      ordemAvisoTexto:           body.ordem_aviso_texto || null,
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
          ordemAvisoAtivo:           values.ordemAvisoAtivo,
          ordemAvisoTexto:           values.ordemAvisoTexto,
          updatedAt:                 new Date(),
        },
      })

    const result = await db
      .select()
      .from(orgNotificationSettings)
      .where(eq(orgNotificationSettings.organizationId, user.organizationId))
      .limit(1)

    return NextResponse.json(mapRow(result[0]))
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[PUT /api/settings/notifications]', error); console.error('[PUT /api/settings/notifications]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
