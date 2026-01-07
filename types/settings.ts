export interface OrganizationSettings {
  id: string
  organization_id: string
  name: string
  slug: string
  email?: string
  phone?: string
  cnpj?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  website?: string
  logo_url?: string
  created_at: string
  updated_at: string
}

export interface CustomizationSettings {
  id: string
  organization_id: string
  primary_color: string
  secondary_color: string
  logo_url?: string
  atelier_name?: string
  updated_at: string
}

export interface FinancialSettings {
  id: string
  organization_id: string
  // Formas de pagamento ativas
  payment_methods: {
    dinheiro: boolean
    pix: boolean
    credito: boolean
    debito: boolean
    outros: boolean
  }
  // Configurações de juros e multas
  late_fee_percentage?: number
  interest_rate_per_month?: number
  // Configurações de caixa
  cashier_requires_opening: boolean
  cashier_opening_balance_required: boolean
  // Categorias personalizadas
  expense_categories?: string[]
  income_categories?: string[]
  updated_at: string
}

export interface NotificationSettings {
  id: string
  organization_id: string
  // Notificações de cliente
  notify_client_birthday: boolean
  notify_order_ready: boolean
  notify_payment_reminder: boolean
  // Notificações internas
  notify_order_delayed: boolean
  notify_low_stock: boolean
  notify_new_client: boolean
  // Configurações de e-mail
  email_notifications_enabled: boolean
  notification_email?: string
  // Antecedência de notificações (dias)
  birthday_reminder_days: number
  payment_reminder_days: number
  order_reminder_days: number
  updated_at: string
}

export interface OrderSettings {
  id: string
  organization_id: string
  // Numeração de ordens
  order_prefix?: string
  order_start_number: number
  order_number_format: 'sequential' | 'yearly' | 'monthly'
  // Status personalizados
  custom_statuses?: string[]
  default_status: string
  // Campos obrigatórios
  require_client: boolean
  require_service: boolean
  require_delivery_date: boolean
  require_payment_method: boolean
  // Prazos padrão (dias)
  default_delivery_days: number
  updated_at: string
}

export interface SystemPreferences {
  id: string
  organization_id: string
  // Preferências de exibição
  date_format: 'dd/MM/yyyy' | 'MM/dd/yyyy' | 'yyyy-MM-dd'
  time_format: '12h' | '24h'
  currency: 'BRL' | 'USD' | 'EUR'
  timezone: string
  language: 'pt-BR' | 'en-US' | 'es-ES'
  // Preferências de interface
  theme: 'light' | 'dark' | 'auto'
  compact_mode: boolean
  show_tooltips: boolean
  updated_at: string
}

export interface AllSettings {
  organization: OrganizationSettings
  customization: CustomizationSettings
  financial: FinancialSettings
  notifications: NotificationSettings
  orders: OrderSettings
  system: SystemPreferences
}
