/**
 * Drizzle ORM Schema — CRM Atelier
 * Fonte da verdade de todas as tabelas PostgreSQL/Supabase.
 * NÃO editar os arquivos em drizzle/migrations/ — são gerados automaticamente.
 *
 * Após alterações: npx drizzle-kit generate && supabase db push
 */

import {
  pgTable,
  uuid,
  text,
  boolean,
  numeric,
  integer,
  timestamp,
  date,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { sql, relations } from 'drizzle-orm'

// ─── 1. ORGANIZATIONS ─────────────────────────────────────────────────────────

export const organizations = pgTable('organizations', {
  id:                 uuid('id').primaryKey().defaultRandom(),
  name:               text('name').notNull(),
  slug:               text('slug').notNull().unique(),
  plan:               text('plan').notNull().default('free'),
  subscriptionStatus: text('subscription_status').default('inactive'),
  email:              text('email'),
  phone:              text('phone'),
  cnpj:               text('cnpj'),
  address:            text('address'),
  city:               text('city'),
  state:              text('state'),
  zipCode:            text('zip_code'),
  website:            text('website'),
  logoUrl:            text('logo_url'),
  lifetimeLicense:    boolean('lifetime_license').notNull().default(false),
  instagram:          text('instagram'),
  facebook:           text('facebook'),
  twitter:            text('twitter'),
  tiktok:             text('tiktok'),
  kwai:               text('kwai'),
  createdAt:          timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:          timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// ─── 2. PROFILES (substitui users — vinculado a auth.users) ───────────────────

export const profiles = pgTable('profiles', {
  id:             uuid('id').primaryKey(), // mesmo UUID do auth.users
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  fullName:       text('full_name'),
  role:           text('role').notNull().default('owner'),
  isOwner:        boolean('is_owner').notNull().default(false),
  isMaster:       boolean('is_master').notNull().default(false),
  createdAt:      timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('idx_profiles_org').on(t.organizationId),
])

// ─── 3. USAGE METRICS ─────────────────────────────────────────────────────────

export const usageMetrics = pgTable('usage_metrics', {
  id:                uuid('id').primaryKey().defaultRandom(),
  organizationId:    uuid('organization_id').notNull().unique().references(() => organizations.id, { onDelete: 'cascade' }),
  clientsCount:      integer('clients_count').notNull().default(0),
  ordersCount:       integer('orders_count').notNull().default(0),
  usersCount:        integer('users_count').notNull().default(1),
  totalClientsEver:  integer('total_clients_ever').notNull().default(0),
  totalOrdersEver:   integer('total_orders_ever').notNull().default(0),
  updatedAt:         timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// ─── 4. CUSTOMIZATION SETTINGS ────────────────────────────────────────────────

export const customizationSettings = pgTable('customization_settings', {
  id:             uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().unique().references(() => organizations.id, { onDelete: 'cascade' }),
  primaryColor:   text('primary_color').notNull().default('#3b82f6'),
  secondaryColor: text('secondary_color').notNull().default('#10b981'),
  logoUrl:        text('logo_url'),
  atelierName:    text('atelier_name'),
  updatedAt:      timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// ─── 5. ORG CLIENTS ───────────────────────────────────────────────────────────

export const orgClients = pgTable('org_clients', {
  id:             uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  nome:           text('nome').notNull(),
  telefone:       text('telefone'),
  email:          text('email'),
  dataNascimento: date('data_nascimento'),
  observacoes:    text('observacoes'),
  cep:            text('cep'),
  logradouro:     text('logradouro'),
  numero:         text('numero'),
  complemento:    text('complemento'),
  bairro:         text('bairro'),
  cidade:         text('cidade'),
  estado:         text('estado'),
  dataCadastro:   timestamp('data_cadastro', { withTimezone: true }).defaultNow(),
  createdAt:      timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('idx_clients_org').on(t.organizationId),
])

// ─── 6. ORG SERVICES ──────────────────────────────────────────────────────────

export const orgServices = pgTable('org_services', {
  id:                   uuid('id').primaryKey().defaultRandom(),
  organizationId:       uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  nome:                 text('nome').notNull(),
  descricao:            text('descricao'),
  preco:                numeric('preco', { precision: 10, scale: 2 }).notNull().default('0'),
  categoria:            text('categoria'),
  tempoEstimado:        text('tempo_estimado'),
  materiais:            text('materiais'),
  materiaisJson:        jsonb('materiais_json'),
  custoMateriais:       numeric('custo_materiais', { precision: 10, scale: 2 }),
  observacoesTecnicas:  text('observacoes_tecnicas'),
  nivelDificuldade:     text('nivel_dificuldade'),
  tempoMinimo:          text('tempo_minimo'),
  tempoMaximo:          text('tempo_maximo'),
  ativo:                boolean('ativo').notNull().default(true),
  createdAt:            timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('idx_services_org').on(t.organizationId),
  index('idx_services_active').on(t.organizationId, t.ativo),
])

// ─── 7. ORG SERVICE ORDERS ────────────────────────────────────────────────────

export const orgServiceOrders = pgTable('org_service_orders', {
  id:                 uuid('id').primaryKey().defaultRandom(),
  numero:             integer('numero').notNull(),
  organizationId:     uuid('organization_id').notNull().references(() => organizations.id),
  clientId:           uuid('client_id').references(() => orgClients.id, { onDelete: 'set null' }),
  status:             text('status').notNull().default('pendente'),
  valorTotal:         numeric('valor_total', { precision: 10, scale: 2 }).notNull().default('0'),
  valorEntrada:       numeric('valor_entrada', { precision: 10, scale: 2 }).notNull().default('0'),
  valorPago:          numeric('valor_pago', { precision: 10, scale: 2 }).notNull().default('0'),
  statusPagamento:    text('status_pagamento').notNull().default('pendente'),
  descontoValor:      numeric('desconto_valor', { precision: 10, scale: 2 }).notNull().default('0'),
  descontoPercentual: numeric('desconto_percentual', { precision: 5, scale: 2 }).notNull().default('0'),
  dataAbertura:       timestamp('data_abertura', { withTimezone: true }).defaultNow(),
  dataPrevista:       date('data_prevista'),
  dataConclusao:      timestamp('data_conclusao', { withTimezone: true }),
  formaPagamento:     text('forma_pagamento'),
  observacoes:        text('observacoes'),
  notasInternas:      text('notas_internas'),
  defaultMessage:     text('default_message'),
  createdAt:          timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('idx_orders_org').on(t.organizationId),
  index('idx_orders_client').on(t.clientId),
  index('idx_orders_status').on(t.status),
  index('idx_orders_data').on(t.dataAbertura),
  index('idx_orders_org_status').on(t.organizationId, t.status),
  uniqueIndex('uq_order_numero_org').on(t.organizationId, t.numero),
])

// ─── 8. ORG SERVICE ORDER ITEMS ───────────────────────────────────────────────

export const orgServiceOrderItems = pgTable('org_service_order_items', {
  id:            uuid('id').primaryKey().defaultRandom(),
  orderId:       uuid('order_id').notNull().references(() => orgServiceOrders.id, { onDelete: 'cascade' }),
  serviceId:     uuid('service_id').references(() => orgServices.id, { onDelete: 'set null' }),
  serviceNome:   text('service_nome').notNull(),
  quantidade:    integer('quantidade').notNull().default(1),
  valorUnitario: numeric('valor_unitario', { precision: 10, scale: 2 }).notNull(),
  valorTotal:    numeric('valor_total', { precision: 10, scale: 2 }).notNull(),
  createdAt:     timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// ─── 9. ORG SERVICE ORDER MATERIALS ───────────────────────────────────────────

export const orgServiceOrderMaterials = pgTable('org_service_order_materials', {
  id:          uuid('id').primaryKey().defaultRandom(),
  orderId:     uuid('order_id').notNull().references(() => orgServiceOrders.id, { onDelete: 'cascade' }),
  productId:   uuid('product_id'),
  nome:        text('nome').notNull(),
  quantidade:  numeric('quantidade', { precision: 10, scale: 3 }).notNull().default('1'),
  unidade:     text('unidade').default('un'),
  precoCusto:  numeric('preco_custo', { precision: 10, scale: 2 }),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// ─── 10. ORG SERVICE ORDER HISTORY ────────────────────────────────────────────

export const orgServiceOrderHistory = pgTable('org_service_order_history', {
  id:             uuid('id').primaryKey().defaultRandom(),
  orderId:        uuid('order_id').notNull().references(() => orgServiceOrders.id, { onDelete: 'cascade' }),
  organizationId: uuid('organization_id').notNull(),
  userEmail:      text('user_email').notNull(),
  campoAlterado:  text('campo_alterado').notNull(),
  valorAnterior:  text('valor_anterior'),
  valorNovo:      text('valor_novo'),
  createdAt:      timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// ─── 11. ORG SERVICE ORDER NOTES ──────────────────────────────────────────────

export const orgServiceOrderNotes = pgTable('org_service_order_notes', {
  id:             uuid('id').primaryKey().defaultRandom(),
  orderId:        uuid('order_id').notNull().references(() => orgServiceOrders.id, { onDelete: 'cascade' }),
  organizationId: uuid('organization_id').notNull(),
  userEmail:      text('user_email').notNull(),
  nota:           text('nota').notNull(),
  createdAt:      timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// ─── 12. ORG FINANCIAL CATEGORIES ────────────────────────────────────────────

export const orgFinancialCategories = pgTable('org_financial_categories', {
  id:             uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  nome:           text('nome').notNull(),
  tipo:           text('tipo').notNull(),
  cor:            text('cor'),
  descricao:      text('descricao'),
  ativo:          boolean('ativo').notNull().default(true),
  createdAt:      timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:      timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// ─── 13. ORG PAYMENT METHODS ──────────────────────────────────────────────────

export const orgPaymentMethods = pgTable('org_payment_methods', {
  id:             uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  nome:           text('nome').notNull(),
  tipo:           text('tipo'),
  color:          text('color'),
  icon:           text('icon'),
  isDefault:      boolean('is_default').notNull().default(false),
  ativo:          boolean('ativo').notNull().default(true),
  sortOrder:      integer('sort_order').notNull().default(0),
  createdAt:      timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:      timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// ─── 14. ORG SUPPLIERS ────────────────────────────────────────────────────────

export const orgSuppliers = pgTable('org_suppliers', {
  id:             uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  nome:           text('nome').notNull(),
  contato:        text('contato'),
  telefone:       text('telefone'),
  email:          text('email'),
  cnpj:           text('cnpj'),
  endereco:       text('endereco'),
  observacoes:    text('observacoes'),
  ativo:          boolean('ativo').notNull().default(true),
  createdAt:      timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:      timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// ─── 15. ORG RECEIVABLES ──────────────────────────────────────────────────────

export const orgReceivables = pgTable('org_receivables', {
  id:              uuid('id').primaryKey().defaultRandom(),
  organizationId:  uuid('organization_id').notNull().references(() => organizations.id),
  serviceOrderId:  uuid('service_order_id').references(() => orgServiceOrders.id, { onDelete: 'set null' }),
  clientId:        uuid('client_id').references(() => orgClients.id, { onDelete: 'no action' }),
  categoryId:      uuid('category_id').references(() => orgFinancialCategories.id, { onDelete: 'no action' }),
  paymentMethodId: uuid('payment_method_id').references(() => orgPaymentMethods.id, { onDelete: 'no action' }),
  descricao:       text('descricao').notNull(),
  valor:           numeric('valor', { precision: 10, scale: 2 }).notNull(),
  dataVencimento:  date('data_vencimento').notNull(),
  dataRecebimento: date('data_recebimento'),
  status:          text('status').notNull().default('pendente'),
  observacoes:     text('observacoes'),
  createdAt:       timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:       timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('idx_receivables_org').on(t.organizationId),
  index('idx_receivables_status').on(t.status),
  index('idx_receivables_venc').on(t.dataVencimento),
  index('idx_receivables_org_status').on(t.organizationId, t.status),
])

// ─── 16. ORG PAYABLES ─────────────────────────────────────────────────────────

export const orgPayables = pgTable('org_payables', {
  id:             uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  supplierId:     uuid('supplier_id').references(() => orgSuppliers.id, { onDelete: 'set null' }),
  categoryId:     uuid('category_id').references(() => orgFinancialCategories.id, { onDelete: 'no action' }),
  descricao:      text('descricao').notNull(),
  valor:          numeric('valor', { precision: 10, scale: 2 }).notNull(),
  dataVencimento: date('data_vencimento').notNull(),
  dataPagamento:  date('data_pagamento'),
  status:         text('status').notNull().default('pendente'),
  categoria:      text('categoria'),
  formaPagamento: text('forma_pagamento'),
  observacoes:    text('observacoes'),
  createdAt:      timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:      timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('idx_payables_org').on(t.organizationId),
  index('idx_payables_status').on(t.status),
  index('idx_payables_venc').on(t.dataVencimento),
  index('idx_payables_org_status').on(t.organizationId, t.status),
])

// ─── 17. ORG TRANSACTIONS ─────────────────────────────────────────────────────

export const orgTransactions = pgTable('org_transactions', {
  id:              uuid('id').primaryKey().defaultRandom(),
  organizationId:  uuid('organization_id').notNull().references(() => organizations.id),
  tipo:            text('tipo').notNull(),
  descricao:       text('descricao').notNull(),
  valor:           numeric('valor', { precision: 10, scale: 2 }).notNull(),
  dataTransacao:   date('data_transacao').notNull(),
  categoryId:      uuid('category_id').references(() => orgFinancialCategories.id, { onDelete: 'no action' }),
  paymentMethodId: uuid('payment_method_id').references(() => orgPaymentMethods.id, { onDelete: 'no action' }),
  receivableId:    uuid('receivable_id').references(() => orgReceivables.id, { onDelete: 'set null' }),
  payableId:       uuid('payable_id').references(() => orgPayables.id, { onDelete: 'set null' }),
  observacoes:     text('observacoes'),
  createdAt:       timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('idx_transactions_org').on(t.organizationId),
  index('idx_transactions_data').on(t.dataTransacao),
  index('idx_transactions_org_date').on(t.organizationId, t.dataTransacao),
])

// ─── 18. ORG CASHIERS ─────────────────────────────────────────────────────────

export const orgCashiers = pgTable('org_cashiers', {
  id:             uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  nome:           text('nome').notNull(),
  descricao:      text('descricao'),
  ativo:          boolean('ativo').notNull().default(true),
  createdAt:      timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:      timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// ─── 19. ORG CASHIER SESSIONS ─────────────────────────────────────────────────

export const orgCashierSessions = pgTable('org_cashier_sessions', {
  id:                    uuid('id').primaryKey().defaultRandom(),
  organizationId:        uuid('organization_id').notNull().references(() => organizations.id),
  caixaId:               uuid('caixa_id').notNull().references(() => orgCashiers.id, { onDelete: 'cascade' }),
  usuarioAberturaId:     uuid('usuario_abertura_id').references(() => profiles.id, { onDelete: 'no action' }),
  usuarioFechamentoId:   uuid('usuario_fechamento_id').references(() => profiles.id, { onDelete: 'no action' }),
  dataAbertura:          timestamp('data_abertura', { withTimezone: true }).defaultNow(),
  dataFechamento:        timestamp('data_fechamento', { withTimezone: true }),
  saldoInicial:          numeric('saldo_inicial', { precision: 10, scale: 2 }).notNull().default('0'),
  saldoEsperado:         numeric('saldo_esperado', { precision: 10, scale: 2 }),
  saldoReal:             numeric('saldo_real', { precision: 10, scale: 2 }),
  diferenca:             numeric('diferenca', { precision: 10, scale: 2 }),
  status:                text('status').notNull().default('aberto'),
  observacoesAbertura:   text('observacoes_abertura'),
  observacoesFechamento: text('observacoes_fechamento'),
  createdAt:             timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:             timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// ─── 20. ORG CASHIER MOVEMENTS ────────────────────────────────────────────────

export const orgCashierMovements = pgTable('org_cashier_movements', {
  id:               uuid('id').primaryKey().defaultRandom(),
  organizationId:   uuid('organization_id').notNull().references(() => organizations.id),
  sessaoId:         uuid('sessao_id').notNull().references(() => orgCashierSessions.id, { onDelete: 'cascade' }),
  tipo:             text('tipo').notNull(),
  valor:            numeric('valor', { precision: 10, scale: 2 }).notNull(),
  descricao:        text('descricao').notNull(),
  metodoPagamentoId: uuid('metodo_pagamento_id').references(() => orgPaymentMethods.id, { onDelete: 'no action' }),
  referenciaId:     uuid('referencia_id'),
  referenciaTipo:   text('referencia_tipo'),
  usuarioId:        uuid('usuario_id').references(() => profiles.id, { onDelete: 'no action' }),
  dataMovimento:    timestamp('data_movimento', { withTimezone: true }).defaultNow(),
  observacoes:      text('observacoes'),
  createdAt:        timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// ─── 21. ORG CASHIER RECONCILIATIONS ──────────────────────────────────────────

export const orgCashierReconciliations = pgTable('org_cashier_reconciliations', {
  id:               uuid('id').primaryKey().defaultRandom(),
  organizationId:   uuid('organization_id').notNull().references(() => organizations.id),
  sessaoId:         uuid('sessao_id').notNull().references(() => orgCashierSessions.id, { onDelete: 'cascade' }),
  metodoPagamentoId: uuid('metodo_pagamento_id').notNull().references(() => orgPaymentMethods.id),
  valorEsperado:    numeric('valor_esperado', { precision: 10, scale: 2 }).notNull().default('0'),
  valorInformado:   numeric('valor_informado', { precision: 10, scale: 2 }).notNull().default('0'),
  diferenca:        numeric('diferenca', { precision: 10, scale: 2 }),
  observacoes:      text('observacoes'),
  createdAt:        timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// ─── 22. ORG ORDER SETTINGS ───────────────────────────────────────────────────

export const orgOrderSettings = pgTable('org_order_settings', {
  id:                   uuid('id').primaryKey().defaultRandom(),
  organizationId:       uuid('organization_id').notNull().unique().references(() => organizations.id, { onDelete: 'cascade' }),
  orderPrefix:          text('order_prefix').default('OS'),
  orderStartNumber:     integer('order_start_number').notNull().default(1),
  orderNumberFormat:    text('order_number_format').notNull().default('sequential'),
  defaultStatus:        text('default_status').notNull().default('pendente'),
  requireClient:        boolean('require_client').notNull().default(true),
  requireService:       boolean('require_service').notNull().default(true),
  requireDeliveryDate:  boolean('require_delivery_date').notNull().default(true),
  requirePaymentMethod: boolean('require_payment_method').notNull().default(false),
  defaultDeliveryDays:  integer('default_delivery_days').notNull().default(7),
  defaultMessage:       text('default_message'),
  printerWidth:         text('printer_width').notNull().default('80mm'),
  autoGeneratePdf:      boolean('auto_generate_pdf').notNull().default(true),
  updatedAt:            timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// ─── 23. ORG FINANCIAL SETTINGS ───────────────────────────────────────────────

export const orgFinancialSettings = pgTable('org_financial_settings', {
  id:                          uuid('id').primaryKey().defaultRandom(),
  organizationId:              uuid('organization_id').notNull().unique().references(() => organizations.id, { onDelete: 'cascade' }),
  paymentMethodsJson:          jsonb('payment_methods_json').notNull().default(
    sql`'{"dinheiro":true,"pix":true,"credito":true,"debito":true,"outros":true}'::jsonb`
  ),
  lateFeePercentage:           numeric('late_fee_percentage', { precision: 5, scale: 2 }),
  interestRatePerMonth:        numeric('interest_rate_per_month', { precision: 5, scale: 2 }),
  cashierRequiresOpening:      boolean('cashier_requires_opening').notNull().default(true),
  cashierOpeningBalanceRequired: boolean('cashier_opening_balance_required').notNull().default(false),
  expenseCategoriesJson:       jsonb('expense_categories_json').default(sql`'[]'::jsonb`),
  incomeCategoriesJson:        jsonb('income_categories_json').default(sql`'[]'::jsonb`),
  pixKey:                      text('pix_key'),
  showPixKeyOnOrder:           boolean('show_pix_key_on_order').notNull().default(false),
  updatedAt:                   timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// ─── 24. ORG NOTIFICATION SETTINGS ───────────────────────────────────────────

export const orgNotificationSettings = pgTable('org_notification_settings', {
  id:                        uuid('id').primaryKey().defaultRandom(),
  organizationId:            uuid('organization_id').notNull().unique().references(() => organizations.id, { onDelete: 'cascade' }),
  notifyClientBirthday:      boolean('notify_client_birthday').notNull().default(true),
  notifyOrderReady:          boolean('notify_order_ready').notNull().default(true),
  notifyPaymentReminder:     boolean('notify_payment_reminder').notNull().default(true),
  notifyOrderDelayed:        boolean('notify_order_delayed').notNull().default(true),
  notifyLowStock:            boolean('notify_low_stock').notNull().default(false),
  notifyNewClient:           boolean('notify_new_client').notNull().default(false),
  emailNotificationsEnabled: boolean('email_notifications_enabled').notNull().default(false),
  notificationEmail:         text('notification_email'),
  birthdayReminderDays:      integer('birthday_reminder_days').notNull().default(7),
  paymentReminderDays:       integer('payment_reminder_days').notNull().default(3),
  orderReminderDays:         integer('order_reminder_days').notNull().default(1),
  ordemAvisoAtivo:           boolean('ordem_aviso_ativo').notNull().default(false),
  ordemAvisoTexto:           text('ordem_aviso_texto'),
  updatedAt:                 timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// ─── 25. ORG SYSTEM PREFERENCES ──────────────────────────────────────────────

export const orgSystemPreferences = pgTable('org_system_preferences', {
  id:             uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().unique().references(() => organizations.id, { onDelete: 'cascade' }),
  dateFormat:     text('date_format').notNull().default('dd/MM/yyyy'),
  timeFormat:     text('time_format').notNull().default('24h'),
  currency:       text('currency').notNull().default('BRL'),
  timezone:       text('timezone').notNull().default('America/Sao_Paulo'),
  language:       text('language').notNull().default('pt-BR'),
  theme:          text('theme').notNull().default('light'),
  compactMode:      boolean('compact_mode').notNull().default(false),
  showTooltips:     boolean('show_tooltips').notNull().default(true),
  controlaEstoque:  boolean('controla_estoque').notNull().default(false),
  updatedAt:        timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// ─── 26. ORG PRODUCTS (Estoque) ───────────────────────────────────────────────

export const orgProducts = pgTable('org_products', {
  id:               uuid('id').primaryKey().defaultRandom(),
  organizationId:   uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  nome:             text('nome').notNull(),
  descricao:        text('descricao'),
  categoria:        text('categoria'),
  unidade:          text('unidade').notNull().default('un'),
  quantidadeAtual:  numeric('quantidade_atual', { precision: 10, scale: 3 }).notNull().default('0'),
  quantidadeMinima: numeric('quantidade_minima', { precision: 10, scale: 3 }).notNull().default('0'),
  precoCusto:       numeric('preco_custo', { precision: 10, scale: 2 }),
  codigoBarras:     text('codigo_barras'),
  ativo:            boolean('ativo').notNull().default(true),
  createdAt:        timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:        timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('idx_products_org').on(t.organizationId),
  index('idx_products_active').on(t.organizationId, t.ativo),
])

// ─── 27. ORG STOCK ENTRIES ────────────────────────────────────────────────────

export const orgStockEntries = pgTable('org_stock_entries', {
  id:             uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  supplierId:     uuid('supplier_id').references(() => orgSuppliers.id),
  tipo:           text('tipo').notNull().default('manual'),
  numeroNota:     text('numero_nota'),
  serieNota:      text('serie_nota'),
  chaveAcesso:    text('chave_acesso'),
  emitenteCnpj:   text('emitente_cnpj'),
  emitenteNome:   text('emitente_nome'),
  dataEmissao:    timestamp('data_emissao', { withTimezone: true }),
  valorTotal:     numeric('valor_total', { precision: 10, scale: 2 }),
  observacoes:    text('observacoes'),
  createdAt:      timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// ─── 28. ORG STOCK ENTRY ITEMS ────────────────────────────────────────────────

export const orgStockEntryItems = pgTable('org_stock_entry_items', {
  id:            uuid('id').primaryKey().defaultRandom(),
  entryId:       uuid('entry_id').notNull().references(() => orgStockEntries.id, { onDelete: 'cascade' }),
  productId:     uuid('product_id').references(() => orgProducts.id),
  produtoNome:   text('produto_nome').notNull(),
  quantidade:    numeric('quantidade', { precision: 10, scale: 3 }).notNull(),
  unidade:       text('unidade').notNull().default('un'),
  precoUnitario: numeric('preco_unitario', { precision: 10, scale: 2 }),
  precoTotal:    numeric('preco_total', { precision: 10, scale: 2 }),
})

// ─── 29. PLANS ────────────────────────────────────────────────────────────────

export const plans = pgTable('plans', {
  id:           uuid('id').primaryKey().defaultRandom(),
  slug:         text('slug').notNull().unique(),
  name:         text('name').notNull(),
  description:  text('description'),
  price:        numeric('price', { precision: 10, scale: 2 }).notNull().default('0'),
  priceAnnual:  numeric('price_annual', { precision: 10, scale: 2 }),
  annualNote:   text('annual_note'),
  badge:        text('badge'),
  isFeatured:   boolean('is_featured').notNull().default(false),
  isActive:     boolean('is_active').notNull().default(true),
  featuresJson: jsonb('features_json'),
  ctaText:      text('cta_text').default('Criar conta'),
  ctaUrl:       text('cta_url').default('/cadastro'),
  sortOrder:    integer('sort_order').notNull().default(0),
  createdAt:    timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// ─── 30. ADMIN LOGS ───────────────────────────────────────────────────────────

export const adminLogs = pgTable('admin_logs', {
  id:           uuid('id').primaryKey().defaultRandom(),
  action:       text('action').notNull(),
  resourceType: text('resource_type'),
  resourceId:   text('resource_id'),
  description:  text('description').notNull(),
  adminEmail:   text('admin_email'),
  detailsJson:  jsonb('details_json'),
  createdAt:    timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('idx_admin_logs_created').on(t.createdAt),
  index('idx_admin_logs_action').on(t.action),
  index('idx_admin_logs_resource').on(t.resourceType, t.resourceId),
])

// ─── 31. ADMIN SYSTEM SETTINGS ────────────────────────────────────────────────

export const adminSystemSettings = pgTable('admin_system_settings', {
  key:       text('key').primaryKey(),
  value:     text('value').notNull().default(''),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  updatedBy: text('updated_by'),
})

// ─── 32. COUPONS ──────────────────────────────────────────────────────────────

export const coupons = pgTable('coupons', {
  id:              uuid('id').primaryKey().defaultRandom(),
  code:            text('code').notNull().unique(),
  description:     text('description'),
  discountType:    text('discount_type').notNull().default('percentage'),
  discountValue:   numeric('discount_value', { precision: 10, scale: 2 }).notNull(),
  maxUses:         integer('max_uses'),
  usesCount:       integer('uses_count').notNull().default(0),
  expiresAt:       timestamp('expires_at', { withTimezone: true }),
  isActive:        boolean('is_active').notNull().default(true),
  applicablePlans: jsonb('applicable_plans'),
  createdAt:       timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('idx_coupons_code').on(t.code),
])

// ─── 33. COUPON USAGES ────────────────────────────────────────────────────────

export const couponUsages = pgTable('coupon_usages', {
  id:             uuid('id').primaryKey().defaultRandom(),
  couponId:       uuid('coupon_id').notNull().references(() => coupons.id),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  usedAt:         timestamp('used_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('idx_coupon_usages_coupon').on(t.couponId),
  index('idx_coupon_usages_org').on(t.organizationId),
])

// ─── 34. ORG MONTHLY GOALS ────────────────────────────────────────────────────

export const orgMonthlyGoals = pgTable('org_monthly_goals', {
  id:                uuid('id').primaryKey().defaultRandom(),
  organizationId:    uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  year:              integer('year').notNull(),
  month:             integer('month').notNull(),
  revenueGoal:       numeric('revenue_goal', { precision: 10, scale: 2 }),
  ordersGoal:        integer('orders_goal'),
  newClientsGoal:    integer('new_clients_goal'),
  createdAt:         timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:         timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('idx_goals_org').on(t.organizationId),
  uniqueIndex('uq_goals_org_month').on(t.organizationId, t.year, t.month),
])

// ─── 35. ORG STOCK EXITS ─────────────────────────────────────────────────────

export const orgStockExits = pgTable('org_stock_exits', {
  id:             uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  serviceOrderId: uuid('service_order_id').references(() => orgServiceOrders.id, { onDelete: 'set null' }),
  tipo:           text('tipo').notNull().default('manual'),
  observacoes:    text('observacoes'),
  createdAt:      timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:      timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('idx_stock_exits_org').on(t.organizationId),
  index('idx_stock_exits_order').on(t.serviceOrderId),
])

// ─── 36. ORG STOCK EXIT ITEMS ─────────────────────────────────────────────────

export const orgStockExitItems = pgTable('org_stock_exit_items', {
  id:          uuid('id').primaryKey().defaultRandom(),
  exitId:      uuid('exit_id').notNull().references(() => orgStockExits.id, { onDelete: 'cascade' }),
  productId:   uuid('product_id').notNull().references(() => orgProducts.id),
  produtoNome: text('produto_nome').notNull(),
  quantidade:  numeric('quantidade', { precision: 10, scale: 3 }).notNull(),
  unidade:     text('unidade').notNull().default('un'),
}, (t) => [
  index('idx_stock_exit_items_exit').on(t.exitId),
  index('idx_stock_exit_items_product').on(t.productId),
])

// ─── 37. ADMIN ERROR LOGS ─────────────────────────────────────────────────────

export const adminErrorLogs = pgTable('admin_error_logs', {
  id:             uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'set null' }),
  userId:         uuid('user_id'),
  message:        text('message').notNull(),
  stack:          text('stack'),
  componentStack: text('component_stack'),
  errorType:      text('error_type').notNull().default('runtime'),
  severity:       text('severity').notNull().default('error'),
  url:            text('url'),
  userAgent:      text('user_agent'),
  extra:          jsonb('extra'),
  resolved:       boolean('resolved').notNull().default(false),
  resolvedAt:     timestamp('resolved_at', { withTimezone: true }),
  resolutionNote: text('resolution_note'),
  createdAt:      timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// ─── 38. PAGE EVENTS ──────────────────────────────────────────────────────────

export const pageEvents = pgTable('page_events', {
  id:        uuid('id').primaryKey().defaultRandom(),
  page:      text('page').notNull(),
  event:     text('event').notNull(),
  data:      jsonb('data'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS INFERIDOS (usar em todo o projeto — não criar interfaces manualmente)
// ─────────────────────────────────────────────────────────────────────────────

export type Organization       = typeof organizations.$inferSelect
export type NewOrganization    = typeof organizations.$inferInsert
export type Profile            = typeof profiles.$inferSelect
export type NewProfile         = typeof profiles.$inferInsert
export type OrgClient          = typeof orgClients.$inferSelect
export type NewOrgClient       = typeof orgClients.$inferInsert
export type OrgService         = typeof orgServices.$inferSelect
export type NewOrgService      = typeof orgServices.$inferInsert
export type OrgServiceOrder    = typeof orgServiceOrders.$inferSelect
export type NewOrgServiceOrder = typeof orgServiceOrders.$inferInsert
export type OrgServiceOrderItem    = typeof orgServiceOrderItems.$inferSelect
export type OrgFinancialCategory   = typeof orgFinancialCategories.$inferSelect
export type OrgPaymentMethod       = typeof orgPaymentMethods.$inferSelect
export type OrgSupplier            = typeof orgSuppliers.$inferSelect
export type AdminErrorLog          = typeof adminErrorLogs.$inferSelect
export type NewAdminErrorLog       = typeof adminErrorLogs.$inferInsert
export type OrgReceivable          = typeof orgReceivables.$inferSelect
export type NewOrgReceivable       = typeof orgReceivables.$inferInsert
export type OrgPayable             = typeof orgPayables.$inferSelect
export type NewOrgPayable          = typeof orgPayables.$inferInsert
export type OrgTransaction         = typeof orgTransactions.$inferSelect
export type NewOrgTransaction      = typeof orgTransactions.$inferInsert
export type OrgCashier             = typeof orgCashiers.$inferSelect
export type OrgCashierSession      = typeof orgCashierSessions.$inferSelect
export type OrgCashierMovement     = typeof orgCashierMovements.$inferSelect
export type OrgProduct             = typeof orgProducts.$inferSelect
export type NewOrgProduct          = typeof orgProducts.$inferInsert
export type OrgStockEntry          = typeof orgStockEntries.$inferSelect
export type OrgStockExit           = typeof orgStockExits.$inferSelect
export type NewOrgStockExit        = typeof orgStockExits.$inferInsert
export type OrgStockExitItem       = typeof orgStockExitItems.$inferSelect
export type NewOrgStockExitItem    = typeof orgStockExitItems.$inferInsert
export type Plan                   = typeof plans.$inferSelect
export type AdminLog               = typeof adminLogs.$inferSelect
export type Coupon                 = typeof coupons.$inferSelect
