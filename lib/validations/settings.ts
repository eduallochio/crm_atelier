import { z } from 'zod'

export const organizationSettingsSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  cnpj: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
  logo_url: z.string().optional(),
})

export const customizationSettingsSchema = z.object({
  primary_color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor inválida'),
  secondary_color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor inválida'),
  logo_url: z.string().optional(),
  atelier_name: z.string().optional(),
})

export const financialSettingsSchema = z.object({
  payment_methods: z.object({
    dinheiro: z.boolean(),
    pix: z.boolean(),
    credito: z.boolean(),
    debito: z.boolean(),
    outros: z.boolean(),
  }),
  late_fee_percentage: z.number().min(0).max(100).optional(),
  interest_rate_per_month: z.number().min(0).max(100).optional(),
  cashier_requires_opening: z.boolean(),
  cashier_opening_balance_required: z.boolean(),
  expense_categories: z.array(z.string()).optional(),
  income_categories: z.array(z.string()).optional(),
})

export const notificationSettingsSchema = z.object({
  notify_client_birthday: z.boolean(),
  notify_order_ready: z.boolean(),
  notify_payment_reminder: z.boolean(),
  notify_order_delayed: z.boolean(),
  notify_low_stock: z.boolean(),
  notify_new_client: z.boolean(),
  email_notifications_enabled: z.boolean(),
  notification_email: z.string().email('Email inválido').optional().or(z.literal('')),
  birthday_reminder_days: z.number().int().min(0).max(30),
  payment_reminder_days: z.number().int().min(0).max(30),
  order_reminder_days: z.number().int().min(0).max(30),
})

export const orderSettingsSchema = z.object({
  order_prefix: z.string().optional(),
  order_start_number: z.number().int().min(1),
  order_number_format: z.enum(['sequential', 'yearly', 'monthly']),
  custom_statuses: z.array(z.string()).optional(),
  default_status: z.string(),
  require_client: z.boolean(),
  require_service: z.boolean(),
  require_delivery_date: z.boolean(),
  require_payment_method: z.boolean(),
  default_delivery_days: z.number().int().min(1).max(365),
})

export const systemPreferencesSchema = z.object({
  date_format: z.enum(['dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd']),
  time_format: z.enum(['12h', '24h']),
  currency: z.enum(['BRL', 'USD', 'EUR']),
  timezone: z.string(),
  language: z.enum(['pt-BR', 'en-US', 'es-ES']),
  theme: z.enum(['light', 'dark', 'auto']),
  compact_mode: z.boolean(),
  show_tooltips: z.boolean(),
})

export type OrganizationSettingsInput = z.infer<typeof organizationSettingsSchema>
export type CustomizationSettingsInput = z.infer<typeof customizationSettingsSchema>
export type FinancialSettingsInput = z.infer<typeof financialSettingsSchema>
export type NotificationSettingsInput = z.infer<typeof notificationSettingsSchema>
export type OrderSettingsInput = z.infer<typeof orderSettingsSchema>
export type SystemPreferencesInput = z.infer<typeof systemPreferencesSchema>
